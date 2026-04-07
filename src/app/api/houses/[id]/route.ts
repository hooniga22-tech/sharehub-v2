import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rows = await getSheetData('지점')
    const row = rows.find(r => r[0] === id)
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({
      id: row[0], name: row[1], district: row[2], address: row[3],
      doorPassword: row[4], wifiSsid: row[5], wifiPassword: row[6],
      buildingRent: Number(row[7]) || 0,
      investorRatio: Number(row[8]) || 0,
      operatorRatio: Number(row[9]) || 0,
      landlordName: row[10], landlordPhone: row[11], memo: row[12],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('지점')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    await updateRow('지점', rowIndex, [
      id,
      body.name ?? existing[1],
      body.district ?? existing[2],
      body.address ?? existing[3],
      body.doorPassword ?? existing[4],
      body.wifiSsid ?? existing[5],
      body.wifiPassword ?? existing[6],
      body.buildingRent ?? existing[7],
      body.investorRatio ?? existing[8],
      body.operatorRatio ?? existing[9],
      body.landlordName ?? existing[10],
      body.landlordPhone ?? existing[11],
      body.memo ?? existing[12],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
