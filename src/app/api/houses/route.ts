import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('지점')
    const houses = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      name: row[1] || '',
      district: row[2] || '',
      address: row[3] || '',
      doorPassword: row[4] || '',
      wifiSsid: row[5] || '',
      wifiPassword: row[6] || '',
      buildingRent: Number(row[7]) || 0,
      investorRatio: Number(row[8]) || 0,
      operatorRatio: Number(row[9]) || 0,
      landlordName: row[10] || '',
      landlordPhone: row[11] || '',
      memo: row[12] || '',
    }))
    return NextResponse.json(houses)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
