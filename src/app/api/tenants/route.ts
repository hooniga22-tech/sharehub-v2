import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('입주자')
    // 헤더: ID[0] 지역[1] 하우스[2] 방코드[3] 구분[4] 이름[5] 시작일[6] 종료일[7] 상태[8] 보증금[9] 월세[10] 관리비[11] 메모[12] 연락처[13] 생년월일[14] 주소[15] 투자자[16] 투자자계좌[17] 투자자연락처[18]
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r[0] || '', district: r[1] || '', houseName: r[2] || '',
      roomCode: r[3] || '', roomType: r[4] || '', name: r[5] || '',
      startDate: r[6] || '', endDate: r[7] || '', status: r[8] || '',
      deposit: Number(r[9]) || 0, rent: Number(r[10]) || 0, managementFee: Number(r[11]) || 0,
      memo: r[12] || '', phone: r[13] || '', birthDate: r[14] || '', address: r[15] || '',
      investor: r[16] || '', investorAccount: r[17] || '', investorPhone: r[18] || '',
    })))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tenant_${Date.now()}`
    const token = Math.random().toString(36).slice(2, 10)
    await appendRow('입주자', [
      id,
      body.roomId || '',
      body.houseName || '',
      body.roomCode || '',
      body.name || '',
      body.phone || '',
      body.rent || 0,
      body.managementFee || 0,
      body.deposit || 0,
      body.startDate || '',
      body.endDate || '',
      body.status || '입주중',
      body.nationality || '',
      body.memo || '',
      token,
    ])
    return NextResponse.json({ ok: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
