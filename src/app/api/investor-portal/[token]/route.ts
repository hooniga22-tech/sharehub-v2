import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const [investorRows, houseRows, tenantRows, utilityRows] = await Promise.all([
      getSheetData('투자자'),
      getSheetData('지점'),
      getSheetData('입주자'),
      getSheetData('공과금'),
    ])

    const investorRow = investorRows.find(r => r[5] === token)
    if (!investorRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const investorName = investorRow[1]?.trim()
    const houseName = investorRow[3]?.trim()
    const ratio = Number(investorRow[4]) || 0

    const houseRow = houseRows.find(r => r[1]?.trim() === houseName)
    const buildingRent = Number(houseRow?.[7]) || 0
    const isConsignment = houseRow?.[12]?.trim() === '위탁운영'

    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    }

    const monthlyData = months.map(({ year: y, month: m }) => {
      const activeRent = tenantRows
        .filter(r => r[2]?.trim() === houseName && r[11] !== '퇴실')
        .reduce((sum, r) => sum + (Number(r[6]) || 0) + (Number(r[7]) || 0), 0)

      const utility = utilityRows
        .filter(r => Number(r[3]) === y && Number(r[4]) === m && r[2]?.trim() === houseName)
        .reduce((sum, r) => sum + [5, 6, 7, 8, 9, 10, 11].reduce((s, i) => s + (Number(r[i]) || 0), 0), 0)

      const totalExpense = buildingRent + utility
      const profit = activeRent - totalExpense
      const investorProfit = Math.round(profit * ratio / 100)

      return {
        year: y, month: m,
        income: activeRent,
        buildingRent,
        utility,
        totalExpense,
        profit,
        investorProfit,
        hasUtility: utility > 0,
      }
    })

    const currentMonth = monthlyData[monthlyData.length - 1]

    const activeTenants = tenantRows.filter(r =>
      r[2]?.trim() === houseName && r[11] === '입주중'
    ).length
    const exitSoon = tenantRows.filter(r => {
      if (r[2]?.trim() !== houseName || r[11] !== '입주중') return false
      const end = r[10]
      if (!end) return false
      const diff = Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 30
    }).length

    return NextResponse.json({
      investor: { name: investorName, houseName, ratio, phone: investorRow[6] || '' },
      house: { name: houseName, district: houseRow?.[2] || '', address: houseRow?.[3] || '', buildingRent, isConsignment },
      currentMonth,
      monthlyData,
      tenantSummary: { activeTenants, exitSoon },
      year, month,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
