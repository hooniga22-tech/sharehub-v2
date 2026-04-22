import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)
    const houseFilter = searchParams.get('house')
    const ym = `${year}-${String(month).padStart(2, '0')}`

    const supabase = createAdminClient()

    const [tenants, branches, expenses, investors] = await Promise.all([
      listOrEmpty<any>(supabase.from('tenants').select('*, rooms(room_code, branch_id, branches(name, district))').eq('status', 'active')),
      listOrEmpty<any>(supabase.from('branches').select('id, name, district, contract_rent, investor_id, investor_share_pct')),
      listOrEmpty<any>(supabase.from('expenses').select('*').eq('year_month', ym)),
      listOrEmpty<any>(supabase.from('investors').select('id, name, access_token')),
    ])

    // Group tenants by branch
    const tenantsByBranch = new Map<string, any[]>()
    for (const t of tenants) {
      const bid = t.rooms?.branch_id
      if (!bid) continue
      if (!tenantsByBranch.has(bid)) tenantsByBranch.set(bid, [])
      tenantsByBranch.get(bid)!.push(t)
    }

    // Expense by branch
    const expenseByBranch = new Map<string, number>()
    for (const e of expenses) {
      expenseByBranch.set(e.branch_id, (expenseByBranch.get(e.branch_id) || 0) + (e.amount || 0))
    }

    const investorMap = new Map<string, any>()
    for (const inv of investors) investorMap.set(inv.id, inv)

    const houses = branches.map((b, idx) => {
      const ht = tenantsByBranch.get(b.id) || []
      const rentTotal = ht.reduce((s: number, t: any) => s + (t.monthly_rent || 0), 0)
      const mgmtTotal = ht.reduce((s: number, t: any) => s + (t.maintenance_fee || 0), 0)
      const revenue = rentTotal + mgmtTotal
      const expenseTotal = expenseByBranch.get(b.id) || 0
      const profit = revenue - expenseTotal

      const invRatio = (b.investor_share_pct || 0) / 100
      const inv = b.investor_id ? investorMap.get(b.investor_id) : null
      const invShare = inv ? Math.round(profit * invRatio) : 0

      return {
        id: idx + 1, house: b.name, gu: b.district || '',
        tenantCount: ht.length, revenue, rentTotal, mgmtTotal,
        expense: expenseTotal, utilTotal: 0, workerTotal: 0, opexTotal: expenseTotal,
        profit, ownShare: profit - invShare,
        investor: inv ? { name: inv.name, token: inv.access_token, ratio: invRatio, share: invShare } : null,
        tenants: ht.map((t: any) => ({ '\uBC29\uCF54\uB4DC': t.rooms?.room_code || '', '\uC774\uB984': t.name || '', '\uC6D4\uC138': String(t.monthly_rent || 0), '\uAD00\uB9AC\uBE44': String(t.maintenance_fee || 0) })),
        utilDetail: null, workerDetail: [], opexDetail: [],
      }
    })

    const result = houseFilter ? houses.filter(h => h.house === houseFilter) : houses
    return NextResponse.json({ year, month, houses: result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
