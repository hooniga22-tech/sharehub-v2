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

    // 입주자: [0]ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름 [6]입주일 [7]퇴실일
    //         [8]상태 [9]보증금 [10]월세 [11]관리비 [12]메모 [13]연락처 [14]생년월일
    //         [15]주소 [16]투자자 [17]투자자계좌 [18]투자자연락처 [19]링크토큰
    const tenantRow = tenantRows.find(r => r[19] === token)
    if (!tenantRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const houseName = tenantRow[2]?.trim()
    const houseRow = houseRows.find(r => r[1]?.trim() === houseName)

    const myIssues = issueRows
      .filter(r => r[1]?.trim() === houseName && r[2]?.trim() === tenantRow[3]?.trim())
      .map(r => ({
        id: r[0], title: r[3], category: r[5],
        status: r[6], createdAt: r[8],
      }))

    const endDate = tenantRow[7]
    const dDay = endDate
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      tenant: {
        id: tenantRow[0],
        houseName,
        roomCode: tenantRow[3],
        name: tenantRow[5],
        phone: tenantRow[13],
        rent: Number(tenantRow[10]) || 0,
        managementFee: Number(tenantRow[11]) || 0,
        deposit: Number(tenantRow[9]) || 0,
        startDate: tenantRow[6],
        endDate: tenantRow[7],
        status: tenantRow[8],
        nationality: tenantRow[14] || '',
        memo: tenantRow[12],
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
