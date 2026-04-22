import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const supabase = createAdminClient()

    const rows = await listOrEmpty<any>(
      supabase.from('tenants').select('id, name, branch_id, branches(name), rooms(room_code), move_in_date, move_out_date, status, deposit, monthly_rent, management_fee')
        .limit(50)
    )

    const tenantSummary = rows.map(r => ({
      id: r.id, houseName: r.branches?.name || '', roomCode: r.rooms?.room_code || '',
      name: r.name || '', rent: String(r.monthly_rent || 0), mgmt: String(r.management_fee || 0),
      deposit: String(r.deposit || 0), startDate: r.move_in_date || '', endDate: r.move_out_date || '',
      status: r.status || '',
    }))

    const systemPrompt = `당신은 쉐어하우스 운영 관리 AI입니다.
운영자의 자연어 요청을 파악해서 데이터 수정 계획을 JSON으로 반환하세요.

현재 입주자 데이터:
${JSON.stringify(tenantSummary, null, 2)}

요청 분석 후 반드시 아래 JSON 형식으로만 응답하세요:
{
  "understood": true,
  "description": "사용자에게 보여줄 확인 메시지",
  "action": {
    "type": "update_tenant",
    "tenantId": "해당 입주자 ID",
    "tenantName": "이름",
    "houseName": "하우스",
    "roomCode": "방코드",
    "field": "rent | managementFee | deposit | status | endDate | startDate",
    "oldValue": "현재 값",
    "newValue": "새 값"
  }
}

이해 못한 경우:
{"understood": false, "description": "이해하지 못했어요. 예시: '워너비 302호 김민준 월세 50만으로 변경해줘'"}`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(parseSimple(message, tenantSummary))
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      return NextResponse.json(JSON.parse(clean))
    } catch {
      return NextResponse.json({ understood: false, description: '요청을 이해하지 못했어요. 다시 말씀해주세요.' })
    }
  } catch (e) {
    return NextResponse.json({ understood: false, description: '오류가 발생했어요.' }, { status: 500 })
  }
}

function parseSimple(msg: string, tenants: { id: string; houseName: string; roomCode: string; name: string; rent: string; status: string }[]) {
  const rentMatch = msg.match(/([가-힣]+)\s*(?:[\w\-]+호?)\s*(?:([가-힣]+)\s+)?월세\s*(\d+)\s*만/)
  if (rentMatch) {
    const house = rentMatch[1]
    const amount = Number(rentMatch[3]) * 10000
    const tenant = tenants.find(t => t.houseName?.includes(house))
    if (tenant) {
      return {
        understood: true,
        description: `${tenant.houseName} ${tenant.roomCode} ${tenant.name}의 월세를 ${Number(tenant.rent).toLocaleString()}원 → ${amount.toLocaleString()}원으로 변경합니다.`,
        action: { type: 'update_tenant', tenantId: tenant.id, tenantName: tenant.name, houseName: tenant.houseName, roomCode: tenant.roomCode, field: 'rent', oldValue: tenant.rent, newValue: amount },
      }
    }
  }
  return { understood: false, description: '요청을 이해하지 못했어요. 예시처럼 말씀해주세요:\n"워너비 302호 월세 50만으로 변경해줘"' }
}
