import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const supabase = createAdminClient()

    // 투자자 토큰 조회
    const { data: inv, error } = await supabase.from('investors').select('*').eq('access_token', token).single()
    if (error || !inv) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // 해당 투자자가 보유한 지점
    const myBranches = await listOrEmpty<any>(
      supabase.from('branches').select('id, name, contract_rent, investor_share_pct').eq('investor_id', inv.id)
    )

    // 활성 입주자 (방+지점 포함)
    const activeTenants = await listOrEmpty<any>(
      supabase.from('tenants').select('*, rooms(room_code, room_type, branch_id)').eq('status', 'active')
    )

    // 지점별 입주자 그룹
    const tenantsByBranch = new Map<string, any[]>()
    for (const t of activeTenants) {
      const bid = t.rooms?.branch_id
      if (!bid) continue
      if (!tenantsByBranch.has(bid)) tenantsByBranch.set(bid, [])
      tenantsByBranch.get(bid)!.push(t)
    }

    const houses = myBranches.map(b => {
      const pct = b.investor_share_pct || 0
      const houseTenants = tenantsByBranch.get(b.id) || []
      const rentRevenue = houseTenants.reduce((s: number, t: any) => s + (t.monthly_rent || 0), 0)
      const houseRent = b.contract_rent || 0
      const profit = rentRevenue - houseRent
      const investorShare = Math.round(profit * (pct / 100))
      const jaehoonShare = Math.round(profit * ((100 - pct) / 100))

      const tenants = houseTenants.map((t: any) => {
        const endRaw = t.contract_end || ''
        const endDate = endRaw ? endRaw.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_: string, y: string, m: string, d: string) => `${y.slice(2)}.${m}.${d}`) : ''
        return {
          name: t.name || '', roomCode: t.rooms?.room_code || '', roomType: t.rooms?.room_type || '',
          rent: t.monthly_rent || 0, endDate,
        }
      })

      return {
        investId: `${inv.id}_${b.id}`, houseName: b.name || '',
        investorRatio: pct, jaehoonRatio: 100 - pct, isJoint: pct > 0 && pct < 100,
        rentRevenue, houseRent, profit, investorShare, jaehoonShare, tenants,
      }
    })

    return NextResponse.json({
      investor: { id: inv.id, name: inv.name, phone: inv.phone || '', account: inv.account_info || '' },
      houses,
      totalShare: houses.reduce((s, h) => s + h.investorShare, 0),
      totalRentRevenue: houses.reduce((s, h) => s + h.rentRevenue, 0),
      totalProfit: houses.reduce((s, h) => s + h.profit, 0),
      houseCount: houses.length, year, month,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
