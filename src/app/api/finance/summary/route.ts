import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1
    const ym = `${year}-${String(month).padStart(2, '0')}`

    const supabase = createAdminClient()

    const [tenants, branches, expenses] = await Promise.all([
      listOrEmpty<any>(supabase.from('tenants').select('*, rooms(branch_id)').eq('status', 'active')),
      listOrEmpty<any>(supabase.from('branches').select('id, name, district, contract_rent, memo')),
      listOrEmpty<any>(supabase.from('expenses').select('*').eq('year_month', ym)),
    ])

    const houseMap: Record<string, { id: string; district: string; buildingRent: number; isConsignment: boolean }> = {}
    for (const b of branches) {
      houseMap[b.name] = { id: b.id, district: b.district || '', buildingRent: b.contract_rent || 0, isConsignment: false }
    }

    const incomeMap: Record<string, { rent: number; mgmt: number; count: number }> = {}
    for (const t of tenants) {
      const branch = branches.find((b: any) => b.id === t.rooms?.branch_id)
      const hn = branch?.name
      if (!hn) continue
      if (!incomeMap[hn]) incomeMap[hn] = { rent: 0, mgmt: 0, count: 0 }
      incomeMap[hn].rent += t.monthly_rent || 0
      incomeMap[hn].mgmt += t.maintenance_fee || 0
      incomeMap[hn].count += 1
    }

    // expenses grouped by branch
    const expenseMap: Record<string, number> = {}
    for (const e of expenses) {
      const branch = branches.find((b: any) => b.id === e.branch_id)
      const hn = branch?.name || ''
      if (hn) expenseMap[hn] = (expenseMap[hn] || 0) + (e.amount || 0)
    }

    const results = Object.keys(houseMap).map(houseName => {
      const house = houseMap[houseName]
      const income = incomeMap[houseName] || { rent: 0, mgmt: 0, count: 0 }
      const utilityExpense = 0 // utilities table doesn't exist separately in Supabase
      const opexExpense = expenseMap[houseName] || 0
      const totalIncome = income.rent + income.mgmt
      const totalExpense = house.buildingRent + utilityExpense + opexExpense
      return {
        houseId: house.id, houseName, district: house.district, isConsignment: house.isConsignment,
        tenantCount: income.count, rent: income.rent, managementFee: income.mgmt, totalIncome,
        buildingRent: house.buildingRent, utilityExpense, opexExpense, totalExpense,
        profit: totalIncome - totalExpense, hasUtility: false,
      }
    }).sort((a, b) => b.profit - a.profit)

    const totals = results.reduce((acc, r) => ({
      tenantCount: acc.tenantCount + r.tenantCount, totalIncome: acc.totalIncome + r.totalIncome,
      totalRent: acc.totalRent + r.rent, totalMgmt: acc.totalMgmt + r.managementFee,
      buildingRent: acc.buildingRent + r.buildingRent, utilityExpense: acc.utilityExpense + r.utilityExpense,
      opexExpense: acc.opexExpense + r.opexExpense, totalExpense: acc.totalExpense + r.totalExpense,
      profit: acc.profit + r.profit,
    }), { tenantCount: 0, totalIncome: 0, totalRent: 0, totalMgmt: 0, buildingRent: 0, utilityExpense: 0, opexExpense: 0, totalExpense: 0, profit: 0 })

    return NextResponse.json({ year, month, results, totals })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
