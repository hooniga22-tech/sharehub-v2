import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const ym = `${year}-${String(month).padStart(2, '0')}`

    const supabase = createAdminClient()

    const [tenants, branches, issues, expenses] = await Promise.all([
      listOrEmpty<any>(supabase.from('tenants').select('*, rooms(room_code, branch_id, branches(name))')),
      listOrEmpty<any>(supabase.from('branches').select('id, name, contract_rent')),
      listOrEmpty<any>(supabase.from('issues').select('*')),
      listOrEmpty<any>(supabase.from('expenses').select('*').eq('year_month', ym)),
    ])

    const totalRooms = tenants.length
    const activeTenants = tenants.filter((t: any) => t.status === 'active')
    const exitSoon = tenants.filter((t: any) => {
      if (t.status !== 'active') return false
      const end = t.contract_end
      if (!end) return false
      const diff = (new Date(end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    })
    const vacant = tenants.filter((t: any) => t.status === 'moved_out' || t.status === 'cancelled')

    const expiringTenants = exitSoon
      .map((t: any) => ({
        name: t.name, houseName: t.rooms?.branches?.name || '', roomCode: t.rooms?.room_code || '',
        endDate: t.contract_end, tenantId: t.id,
        dDay: Math.ceil((new Date(t.contract_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a: any, b: any) => a.dDay - b.dDay)

    const pendingIssues = issues
      .filter((i: any) => i.status === 'pending' || i.status === 'in_progress')
      .map((i: any) => ({ id: i.id, houseName: '', title: i.title, category: i.category, status: i.status, createdAt: i.created_at }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Income by branch
    const incomeMap: Record<string, { rent: number; mgmt: number }> = {}
    for (const t of activeTenants) {
      const hn = t.rooms?.branches?.name || ''
      if (!hn) continue
      if (!incomeMap[hn]) incomeMap[hn] = { rent: 0, mgmt: 0 }
      incomeMap[hn].rent += t.monthly_rent || 0
      incomeMap[hn].mgmt += t.maintenance_fee || 0
    }

    // Expense by branch
    const expenseMap: Record<string, number> = {}
    for (const e of expenses) {
      const branch = branches.find((b: any) => b.id === e.branch_id)
      const hn = branch?.name || ''
      if (hn) expenseMap[hn] = (expenseMap[hn] || 0) + (e.amount || 0)
    }

    // Building rent map
    const buildingRentMap: Record<string, number> = {}
    for (const b of branches) buildingRentMap[b.name] = b.contract_rent || 0

    const profitRanking = Object.keys(incomeMap).map(hn => {
      const inc = incomeMap[hn]
      const totalIncome = inc.rent + inc.mgmt
      const expense = (buildingRentMap[hn] || 0) + (expenseMap[hn] || 0)
      return { houseName: hn, totalIncome, expense, profit: totalIncome - expense }
    }).sort((a, b) => b.profit - a.profit).slice(0, 5)

    const totalIncome = Object.values(incomeMap).reduce((s, v) => s + v.rent + v.mgmt, 0)
    const totalExpense = Object.keys(incomeMap).reduce((s, hn) => s + (buildingRentMap[hn] || 0) + (expenseMap[hn] || 0), 0)

    return NextResponse.json({
      summary: {
        totalRooms, activeTenants: activeTenants.length, exitSoon: exitSoon.length,
        vacantRooms: vacant.length, pendingIssues: pendingIssues.length, pendingWorkers: 0,
      },
      finance: {
        totalIncome, totalRent: Object.values(incomeMap).reduce((s, v) => s + v.rent, 0),
        totalMgmt: Object.values(incomeMap).reduce((s, v) => s + v.mgmt, 0),
        totalExpense, totalProfit: totalIncome - totalExpense, year, month,
      },
      expiringTenants,
      pendingIssues: pendingIssues.slice(0, 5),
      profitRanking,
      workerSummary: { total: 0, pending: 0, completed: 0, paymentTotal: 0 },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
