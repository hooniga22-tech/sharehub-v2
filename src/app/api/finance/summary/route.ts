import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const [tenantRows, utilityRows, houseRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('공과금'),
      getSheetData('지점'),
    ])

    const houseMap: Record<string, { id: string; district: string; buildingRent: number; isConsignment: boolean }> = {}
    for (const row of houseRows) {
      const name = row[1]?.trim()
      if (!name) continue
      houseMap[name] = {
        id: row[0],
        district: row[2] || '',
        buildingRent: Number(row[7]) || 0,
        isConsignment: (row[12]?.trim() || '') === '위탁운영',
      }
    }

    const incomeMap: Record<string, { rent: number; mgmt: number; count: number }> = {}
    for (const row of tenantRows) {
      if (row[11] === '퇴실') continue
      const houseName = row[2]?.trim()
      if (!houseName) continue
      const rent = Number(row[6]) || 0
      const mgmt = Number(row[7]) || 0
      if (!incomeMap[houseName]) incomeMap[houseName] = { rent: 0, mgmt: 0, count: 0 }
      incomeMap[houseName].rent += rent
      incomeMap[houseName].mgmt += mgmt
      incomeMap[houseName].count += 1
    }

    const expenseMap: Record<string, number> = {}
    for (const row of utilityRows) {
      if (Number(row[3]) !== year || Number(row[4]) !== month) continue
      const houseName = row[2]?.trim()
      if (!houseName) continue
      const total = [5, 6, 7, 8, 9, 10, 11].reduce((sum, i) => sum + (Number(row[i]) || 0), 0)
      expenseMap[houseName] = (expenseMap[houseName] || 0) + total
    }

    const results = Object.keys(houseMap).map(houseName => {
      const house = houseMap[houseName]
      const income = incomeMap[houseName] || { rent: 0, mgmt: 0, count: 0 }
      const utilityExpense = expenseMap[houseName] || 0
      const buildingRent = house.buildingRent
      const totalIncome = income.rent + income.mgmt
      const totalExpense = buildingRent + utilityExpense
      const profit = totalIncome - totalExpense
      return {
        houseId: house.id, houseName, district: house.district,
        isConsignment: house.isConsignment, tenantCount: income.count,
        rent: income.rent, managementFee: income.mgmt, totalIncome,
        buildingRent, utilityExpense, totalExpense, profit,
        hasUtility: !!expenseMap[houseName],
      }
    })

    results.sort((a, b) => b.profit - a.profit)

    const totals = results.reduce((acc, r) => ({
      tenantCount: acc.tenantCount + r.tenantCount,
      totalIncome: acc.totalIncome + r.totalIncome,
      totalRent: acc.totalRent + r.rent,
      totalMgmt: acc.totalMgmt + r.managementFee,
      buildingRent: acc.buildingRent + r.buildingRent,
      utilityExpense: acc.utilityExpense + r.utilityExpense,
      totalExpense: acc.totalExpense + r.totalExpense,
      profit: acc.profit + r.profit,
    }), { tenantCount: 0, totalIncome: 0, totalRent: 0, totalMgmt: 0, buildingRent: 0, utilityExpense: 0, totalExpense: 0, profit: 0 })

    return NextResponse.json({ year, month, results, totals })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
