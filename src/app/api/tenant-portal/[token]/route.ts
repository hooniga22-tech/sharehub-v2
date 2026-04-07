import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const [tenantRows, houseRows, issueRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('지점'),
      getSheetData('이슈'),
    ])

    const tenantRow = tenantRows.find(r => r[14] === token)
    if (!tenantRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const houseName = tenantRow[2]?.trim()
    const houseRow = houseRows.find(r => r[1]?.trim() === houseName)

    const myIssues = issueRows
      .filter(r => r[1]?.trim() === houseName && r[2]?.trim() === tenantRow[3]?.trim())
      .map(r => ({
        id: r[0], title: r[3], category: r[5],
        status: r[6], createdAt: r[8],
      }))

    const endDate = tenantRow[10]
    const dDay = endDate
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      tenant: {
        id: tenantRow[0],
        houseName,
        roomCode: tenantRow[3],
        name: tenantRow[4],
        phone: tenantRow[5],
        rent: Number(tenantRow[6]) || 0,
        managementFee: Number(tenantRow[7]) || 0,
        deposit: Number(tenantRow[8]) || 0,
        startDate: tenantRow[9],
        endDate: tenantRow[10],
        status: tenantRow[11],
        nationality: tenantRow[12],
        memo: tenantRow[13],
        dDay,
      },
      house: houseRow ? {
        name: houseRow[1],
        district: houseRow[2],
        address: houseRow[3],
        doorPassword: houseRow[4],
        wifiSsid: houseRow[5],
        wifiPassword: houseRow[6],
        landlordName: houseRow[10],
        memo: houseRow[12],
      } : null,
      myIssues,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
