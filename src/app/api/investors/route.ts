import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

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
    const auth = await requireAdmin(); if (auth.error) return auth.error
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

    // 관리자: 투자자 목록 (is_investor=false인 운영용 레코드 제외)
    const filtered = investors.filter(i => i.is_investor !== false)
    return NextResponse.json(filtered.map(toResponse))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `inv_${Date.now()}`
    const token = `i_${Math.random().toString(36).slice(2, 10)}`
    const { error } = await supabase.from('investors').insert({
      id, name: body.투자자명 || '', phone: body.연락처 || '',
      account_info: body.계좌정보 || '', birth_date: body.생년월일 || null,
      access_token: token, memo: body.메모 || '',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()
    const update: Record<string, any> = {}
    if (data.투자자명 !== undefined) update.name = data.투자자명
    if (data.연락처 !== undefined) update.phone = data.연락처
    if (data.계좌정보 !== undefined) update.account_info = data.계좌정보
    if (data.생년월일 !== undefined) update.birth_date = data.생년월일 || null
    if (data.메모 !== undefined) update.memo = data.메모
    const { error } = await supabase.from('investors').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
