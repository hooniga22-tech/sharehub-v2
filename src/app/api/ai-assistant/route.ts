import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const tenants = await getSheetData('입주자')

    // Build tenant summary for context
    // 입주자: [0]ID [2]지점명 [3]방코드 [5]이름 [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비
    const tenantSummary = tenants.slice(0, 50).map(r => ({
      id: r[0], houseName: r[2], roomCode: r[3], name: r[5],
      rent: r[10], mgmt: r[11], deposit: r[9], startDate: r[6], endDate: r[7], status: r[8],
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
      // API 키 없으면 간단한 패턴 매칭으로 처리
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

// Fallback: 간단한 패턴 매칭 (API 키 없을 때)
function parseSimple(msg: string, tenants: { id: string; houseName: string; roomCode: string; name: string; rent: string; status: string }[]) {
  // "워너비 302호 월세 50만" 패턴
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
