import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const decoded = decodeURIComponent(slug)
    const houseRows = await getSheetData('지점')
    const tenantRows = await getSheetData('입주자')

    const houseRow = houseRows.find(r =>
      r[1]?.trim() === decoded || r[0]?.trim() === decoded
    )
    if (!houseRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const houseName = houseRow[1]?.trim()

    const activeCount = tenantRows.filter(r =>
      r[2]?.trim() === houseName && r[11] === '입주중'
    ).length

    return NextResponse.json({
      id: houseRow[0],
      name: houseName,
      district: houseRow[2] || '',
      address: houseRow[3] || '',
      doorPassword: houseRow[4] || '',
      wifiSsid: houseRow[5] || '',
      wifiPassword: houseRow[6] || '',
      landlordName: houseRow[10] || '',
      memo: houseRow[12] || '',
      activeCount,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
