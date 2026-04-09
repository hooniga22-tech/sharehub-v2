import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rows = await getSheetData('입주자')
    const row = rows.find(r => r[0] === id)
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    // 헤더: ID[0] 지역[1] 하우스[2] 방코드[3] 구분[4] 이름[5] 시작일[6] 종료일[7] 상태[8] 보증금[9] 월세[10] 관리비[11] 메모[12] 연락처[13] 생년월일[14] 주소[15] 투자자[16] 투자자계좌[17] 투자자연락처[18]
    return NextResponse.json({
      id: row[0], district: row[1], houseName: row[2], roomCode: row[3],
      roomType: row[4], name: row[5],
      startDate: row[6], endDate: row[7], status: row[8],
      deposit: Number(row[9]) || 0, rent: Number(row[10]) || 0, managementFee: Number(row[11]) || 0,
      memo: row[12], phone: row[13], birthDate: row[14], address: row[15],
      investor: row[16], investorAccount: row[17], investorPhone: row[18],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('입주자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    // 헤더: ID[0] 지역[1] 하우스[2] 방코드[3] 구분[4] 이름[5] 시작일[6] 종료일[7] 상태[8] 보증금[9] 월세[10] 관리비[11] 메모[12] 연락처[13] 생년월일[14] 주소[15] 투자자[16] 투자자계좌[17] 투자자연락처[18]
    await updateRow('입주자', rowIndex, [
      id,
      body.district ?? existing[1],
      body.houseName ?? existing[2],
      body.roomCode ?? existing[3],
      body.roomType ?? existing[4],
      body.name ?? existing[5],
      body.startDate ?? existing[6],
      body.endDate ?? existing[7],
      body.status ?? existing[8],
      body.deposit ?? existing[9],
      body.rent ?? existing[10],
      body.managementFee ?? existing[11],
      body.memo ?? existing[12],
      body.phone ?? existing[13],
      body.birthDate ?? existing[14],
      body.address ?? existing[15],
      body.investor ?? existing[16],
      body.investorAccount ?? existing[17],
      body.investorPhone ?? existing[18],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
