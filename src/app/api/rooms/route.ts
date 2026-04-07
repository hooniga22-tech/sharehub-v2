import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const houseId = searchParams.get('houseId')
    const houseName = searchParams.get('houseName')
    const rows = await getSheetData('방')
    let rooms = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      houseId: row[1] || '',
      houseName: row[2] || '',
      roomCode: row[3] || '',
      roomType: row[4] || '',
      area: row[5] || '',
      baseRent: Number(row[6]) || 0,
      memo: row[7] || '',
    }))
    if (houseId) rooms = rooms.filter(r => r.houseId === houseId)
    if (houseName) rooms = rooms.filter(r => r.houseName === houseName)
    return NextResponse.json(rooms)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
