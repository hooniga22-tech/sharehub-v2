import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 투자자 시트 (7열): [0]투자자ID [1]투자자명 [2]연락처 [3]지점명 [4]배분비율 [5]링크토큰 [6]메모

function rowToInvestor(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    투자자ID: r[0] || '',
    투자자명: r[1] || '',
    연락처: r[2] || '',
    지점명: r[3] || '',
    배분비율: r[4] || '0',
    링크토큰: r[5] || '',
    메모: r[6] || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)

    const rows = await getSheetData('투자자')
    const investors = rows.map((r, i) => rowToInvestor(r, i))

    if (token) {
      const investor = investors.find(i => i.링크토큰 === token)
      if (!investor) return NextResponse.json({ error: '없음' }, { status: 404 })

      const myHouses = investors.filter(i => i.투자자명 === investor.투자자명)
      const monthPad = String(month).padStart(2, '0')
      const prefix = `${year}-${monthPad}`

      const [tenantRows, utilRows, opexRows, workerRows] = await Promise.all([
        getSheetData('입주자'), getSheetData('공과금'), getSheetData('운영지출'), getSheetData('용역'),
      ])

      const tenants = tenantRows.filter(r => r[8] === '입주중' || r[8] === '계약중')
      const utilities = utilRows.filter(r => r[2] === year && r[3] === month)
      const opex = opexRows.filter(r => (r[2] || '').startsWith(prefix))
      const workers = workerRows.filter(r => (r[1] || '').startsWith(prefix) && r[7] === 'Y')

      const houseResults = myHouses.map(inv => {
        const houseName = inv.지점명
        const ratio = (Number(inv.배분비율) || 0) / 100
        const ht = tenants.filter(r => r[2] === houseName)
        const revenue = ht.reduce((a, r) => a + (Number(r[10]) || 0) + (Number(r[11]) || 0), 0)
        const util = utilities.find(r => r[1] === houseName)
        const utilTotal = util ? [4, 5, 6, 7, 8].reduce((a, i) => a + (Number(util[i]) || 0), 0) : 0
        const workerTotal = workers.filter(r => r[2] === houseName).reduce((a, r) => a + (Number(r[5]) || 0), 0)
        const opexTotal = opex.filter(r => r[1] === houseName).reduce((a, r) => a + (Number(r[4]) || 0), 0)
        const profit = revenue - utilTotal - workerTotal - opexTotal
        const myShare = Math.round(profit * ratio)
        return { houseName, ratio, profit, myShare }
      })

      return NextResponse.json({
        investor, houses: houseResults,
        totalShare: houseResults.reduce((a, h) => a + h.myShare, 0),
        totalProfit: houseResults.reduce((a, h) => a + h.profit, 0),
        year, month,
      })
    }

    return NextResponse.json(investors)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `inv_${Date.now()}`
    const token = `i_${Math.random().toString(36).slice(2, 10)}`
    await appendRow('투자자', [id, body.투자자명 || '', body.연락처 || '', body.지점명 || '', body.배분비율 || '0', token, body.메모 || ''])
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
      e[0], data.투자자명 ?? e[1], data.연락처 ?? e[2], data.지점명 ?? e[3],
      data.배분비율 ?? e[4], e[5], data.메모 ?? (e[6] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
