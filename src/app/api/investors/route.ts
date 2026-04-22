import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

type InvestorHouse = {
  investId: string
  houseName: string
  investorRatio: number
  jaehoonRatio: number
  isJoint: boolean
  memo: string
  houseRent: number
}

type InvestorResponse = {
  id: string
  name: string
  phone: string
  account: string
  birthday: string
  token: string
  memo: string
  houses: InvestorHouse[]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    const supabase = createAdminClient()

    // 투자자 목록
    const investors = await listOrEmpty<any>(supabase.from('investors').select('*'))

    // 지점 목록 (investor_id가 있는 것만 포함해도 되지만 전체 가져옴)
    const branches = await listOrEmpty<any>(supabase.from('branches').select('id, name, investor_id, investor_share_pct, contract_rent'))

    // 투자자별 지점 매핑 (branches.investor_id -> investors.id)
    const housesById = new Map<string, InvestorHouse[]>()
    for (const b of branches) {
      if (!b.investor_id) continue
      if (!housesById.has(b.investor_id)) housesById.set(b.investor_id, [])
      const pct = b.investor_share_pct || 0
      housesById.get(b.investor_id)!.push({
        investId: `${b.investor_id}_${b.id}`,
        houseName: b.name || '',
        investorRatio: pct,
        jaehoonRatio: 100 - pct,
        isJoint: pct > 0 && pct < 100,
        memo: '',
        houseRent: b.contract_rent || 0,
      })
    }

    // 투자자 -> 프론트엔드 응답 매핑
    function toResponse(inv: any): InvestorResponse {
      return {
        id: inv.id || '',
        name: inv.name || '',
        phone: inv.phone || '',
        account: inv.account_info || '',
        birthday: inv.birth_date || '',
        token: inv.access_token || '',
        memo: inv.memo || '',
        houses: housesById.get(inv.id) || [],
      }
    }

    // 토큰 조회: 단일 투자자 포털
    if (token) {
      const inv = investors.find(i => i.access_token === token)
      if (!inv) return NextResponse.json({ error: '없음' }, { status: 404 })
      const mapped = toResponse(inv)
      return NextResponse.json({ investor: mapped, houses: mapped.houses })
    }

    // 관리자: 전체 목록
    return NextResponse.json(investors.map(toResponse))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/PUT는 Step 4.4에서 전환 예정 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `inv_${Date.now()}`
    const token = `i_${Math.random().toString(36).slice(2, 10)}`
    await appendRow('투자자', [id, body.투자자명 || '', body.연락처 || '', body.계좌정보 || '', body.생년월일 || '', token, body.메모 || ''])
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('투자자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[rowIndex]
    await updateRow('투자자', rowIndex, [
      e[0], data.투자자명 ?? e[1], data.연락처 ?? e[2], data.계좌정보 ?? e[3],
      data.생년월일 ?? e[4], e[5], data.메모 ?? (e[6] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
