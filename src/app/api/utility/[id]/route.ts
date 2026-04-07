import { NextResponse } from 'next/server'
import { getUtilityCosts, updateUtilityCost } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getUtilityCosts()
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const { houseName, houseId, year, month, electricity, gas, water, internet, waterPurifier, cleaning, others, memo } = body
    await updateUtilityCost(rowIndex, [
      id, houseId || '', houseName, year, month,
      electricity || 0, gas || 0, water || 0, internet || 0, waterPurifier || 0,
      cleaning || 0, others || 0, memo || '', rows[rowIndex][13] || ''
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
