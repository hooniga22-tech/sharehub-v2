import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const [tenantRows, utilityRows, houseRows, opexRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('공과금'),
      getSheetData('지점'),
      getSheetData('운영지출'),
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
      if (row[8] === '퇴실') continue
      const houseName = row[2]?.trim()
      if (!houseName) continue
      const rent = Number(row[10]) || 0
      const mgmt = Number(row[11]) || 0
      if (!incomeMap[houseName]) incomeMap[houseName] = { rent: 0, mgmt: 0, count: 0 }
      incomeMap[houseName].rent += rent
      incomeMap[houseName].mgmt += mgmt
      incomeMap[houseName].count += 1
    }

    const expenseMap: Record<string, number> = {}
    for (const row of utilityRows) {
      // 공과금: [0]ID [1]지점명 [2]연도 [3]월 [4]전기 [5]가스 [6]수도 [7]인터넷 [8]정수기 [9]메모 [10]청소 [11]기타
      if (Number(row[2]) !== year || Number(row[3]) !== month) continue
      const houseName = row[1]?.trim()
      if (!houseName) continue
      const total = [4, 5, 6, 7, 8, 10, 11].reduce((sum, i) => sum + (Number(row[i]) || 0), 0)
      expenseMap[houseName] = (expenseMap[houseName] || 0) + total
    }

    // 기타지출(운영지출) 집계
    // 운영지출: [0]지출ID [1]지점명 [2]날짜 [3]카테고리 [4]금액 [5]내용 [6]담당자 [7]메모 [8]월 [9]메모
    const opexMap: Record<string, number> = {}
    for (const row of opexRows) {
      const dateStr = row[2] || ''
      const d = dateStr ? new Date(dateStr) : null
      const rowYear = d ? d.getFullYear() : 0
      const rowMonth = Number(row[8]) || (d ? d.getMonth() + 1 : 0)
      if (rowYear !== year || rowMonth !== month) continue
      if (row[9] === '삭제됨' || Number(row[4]) === 0) continue
      const hn = row[1]?.trim()
      if (!hn) continue
      opexMap[hn] = (opexMap[hn] || 0) + (Number(row[4]) || 0)
    }

    const results = Object.keys(houseMap).map(houseName => {
      const house = houseMap[houseName]
      const income = incomeMap[houseName] || { rent: 0, mgmt: 0, count: 0 }
      const utilityExpense = expenseMap[houseName] || 0
      const opexExpense = opexMap[houseName] || 0
      const buildingRent = house.buildingRent
      const totalIncome = income.rent + income.mgmt
      const totalExpense = buildingRent + utilityExpense + opexExpense
      const profit = totalIncome - totalExpense
      return {
        houseId: house.id, houseName, district: house.district,
        isConsignment: house.isConsignment, tenantCount: income.count,
        rent: income.rent, managementFee: income.mgmt, totalIncome,
        buildingRent, utilityExpense, opexExpense, totalExpense, profit,
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
      opexExpense: acc.opexExpense + r.opexExpense,
      totalExpense: acc.totalExpense + r.totalExpense,
      profit: acc.profit + r.profit,
    }), { tenantCount: 0, totalIncome: 0, totalRent: 0, totalMgmt: 0, buildingRent: 0, utilityExpense: 0, opexExpense: 0, totalExpense: 0, profit: 0 })

    return NextResponse.json({ year, month, results, totals })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
