import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('지점')
    // 헤더: ID[0] 하우스명[1] 지역[2] 주소[3] 비번[4] 와이파이[5] 메모[6]
    const houses = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      name: row[1] || '',
      district: row[2] || '',
      address: row[3] || '',
      doorPassword: row[4] || '',
      wifiSsid: row[5] || '',
      memo: row[6] || '',
    }))
    return NextResponse.json(houses)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
