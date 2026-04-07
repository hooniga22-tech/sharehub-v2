import { NextResponse } from 'next/server'
import { getUtilityCosts, addUtilityCost } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getUtilityCosts()
    const costs = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      houseId: row[1] || '',
      houseName: row[2] || '',
      year: Number(row[3]) || 0,
      month: Number(row[4]) || 0,
      electricity: Number(row[5]) || 0,
      gas: Number(row[6]) || 0,
      water: Number(row[7]) || 0,
      internet: Number(row[8]) || 0,
      waterPurifier: Number(row[9]) || 0,
      cleaning: Number(row[10]) || 0,
      others: Number(row[11]) || 0,
      memo: row[12] || '',
      createdAt: row[13] || '',
    }))
    return NextResponse.json(costs)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { houseName, houseId, year, month, electricity, gas, water, internet, waterPurifier, cleaning, others, memo } = body
    const id = `util_${Date.now()}`
    await addUtilityCost([
      id, houseId || '', houseName, year, month,
      electricity || 0, gas || 0, water || 0, internet || 0, waterPurifier || 0,
      cleaning || 0, others || 0, memo || '', new Date().toISOString().split('T')[0]
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
