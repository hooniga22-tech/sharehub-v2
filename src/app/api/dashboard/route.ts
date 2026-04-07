import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const today = now.toISOString().split('T')[0]

    const [tenantRows, houseRows, issueRows, workerRows, utilityRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('지점'),
      getSheetData('이슈'),
      getSheetData('용역'),
      getSheetData('공과금'),
    ])

    // 전체 방 수 (입주자 시트 기반)
    const totalRooms = tenantRows.length
    const activeTenants = tenantRows.filter(r => r[11] === '입주중')
    const exitSoon = tenantRows.filter(r => {
      if (r[11] !== '입주중') return false
      const end = r[10]
      if (!end) return false
      const diff = (new Date(end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    })
    const vacant = tenantRows.filter(r => r[11] === '퇴실' || r[11] === '공실')

    // 만료임박 30일 이내 (D-day 계산 포함)
    const expiringTenants = tenantRows
      .filter(r => {
        if (r[11] !== '입주중') return false
        const end = r[10]
        if (!end) return false
        const diff = Math.ceil((new Date(end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff >= 0 && diff <= 30
      })
      .map(r => {
        const diff = Math.ceil((new Date(r[10]).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          name: r[4],
          houseName: r[2],
          roomCode: r[3],
          endDate: r[10],
          dDay: diff,
          tenantId: r[0],
        }
      })
      .sort((a, b) => a.dDay - b.dDay)

    // 미처리 이슈 (접수 + 진행중)
    const pendingIssues = issueRows
      .filter(r => r[6] === '접수' || r[6] === '진행중')
      .map(r => ({
        id: r[0],
        houseName: r[1],
        title: r[3],
        category: r[5],
        status: r[6],
        createdAt: r[8],
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 이번달 용역 현황
    const thisMonthWorkers = workerRows.filter(r => {
      const d = r[4]
      if (!d) return false
      return d.startsWith(`${year}-${String(month).padStart(2, '0')}`)
    })
    const pendingWorkers = thisMonthWorkers.filter(r => r[5] !== 'Y')
    const completedWorkers = thisMonthWorkers.filter(r => r[5] === 'Y')
    const workerPaymentTotal = thisMonthWorkers.reduce((sum, r) => sum + (Number(r[6]) || 0), 0)

    // 이번달 수입 집계
    const incomeMap: Record<string, { rent: number; mgmt: number }> = {}
    for (const row of tenantRows) {
      if (row[11] === '퇴실') continue
      const hn = row[2]?.trim()
      if (!hn) continue
      if (!incomeMap[hn]) incomeMap[hn] = { rent: 0, mgmt: 0 }
      incomeMap[hn].rent += Number(row[6]) || 0
      incomeMap[hn].mgmt += Number(row[7]) || 0
    }

    // 이번달 공과금 집계
    const expenseMap: Record<string, number> = {}
    for (const row of utilityRows) {
      if (Number(row[3]) !== year || Number(row[4]) !== month) continue
      const hn = row[2]?.trim()
      if (!hn) continue
      expenseMap[hn] = (expenseMap[hn] || 0) + [5, 6, 7, 8, 9, 10, 11].reduce((s, i) => s + (Number(row[i]) || 0), 0)
    }

    // 집월세 집계
    const buildingRentMap: Record<string, number> = {}
    for (const row of houseRows) {
      buildingRentMap[row[1]?.trim()] = Number(row[7]) || 0
    }

    // 지점별 순이익 TOP5
    const profitRanking = Object.keys(incomeMap).map(hn => {
      const income = incomeMap[hn]
      const totalIncome = income.rent + income.mgmt
      const expense = (buildingRentMap[hn] || 0) + (expenseMap[hn] || 0)
      return { houseName: hn, totalIncome, expense, profit: totalIncome - expense }
    })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)

    // 전체 합계
    const totalIncome = Object.values(incomeMap).reduce((s, v) => s + v.rent + v.mgmt, 0)
    const totalExpense = Object.keys(incomeMap).reduce((s, hn) => {
      return s + (buildingRentMap[hn] || 0) + (expenseMap[hn] || 0)
    }, 0)
    const totalProfit = totalIncome - totalExpense
    const totalRent = Object.values(incomeMap).reduce((s, v) => s + v.rent, 0)
    const totalMgmt = Object.values(incomeMap).reduce((s, v) => s + v.mgmt, 0)

    return NextResponse.json({
      summary: {
        totalRooms,
        activeTenants: activeTenants.length,
        exitSoon: exitSoon.length,
        vacantRooms: vacant.length,
        pendingIssues: pendingIssues.length,
        pendingWorkers: pendingWorkers.length,
      },
      finance: {
        totalIncome,
        totalRent,
        totalMgmt,
        totalExpense,
        totalProfit,
        year,
        month,
      },
      expiringTenants,
      pendingIssues: pendingIssues.slice(0, 5),
      profitRanking,
      workerSummary: {
        total: thisMonthWorkers.length,
        pending: pendingWorkers.length,
        completed: completedWorkers.length,
        paymentTotal: workerPaymentTotal,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
