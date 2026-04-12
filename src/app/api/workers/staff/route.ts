import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

// 용역담당자 시트 (8열): [0]담당자ID [1]이름 [2]연락처 [3]계좌번호 [4]분야 [5]구분 [6]링크토큰 [7]기본금액

export async function GET() {
  try {
    const rows = await getSheetData('용역담당자')
    const staff = rows.map((r, i) => ({
      _rowIndex: i,
      담당자ID: r[0] || '',
      이름: r[1] || '',
      연락처: r[2] || '',
      계좌번호: r[3] || '',
      분야: r[4] || '',
      구분: r[5] || '',
      링크토큰: r[6] || '',
      기본금액: r[7] || '',
    }))
    return NextResponse.json(staff)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `staff_${Date.now()}`
    const token = `w_${Math.random().toString(36).slice(2, 10)}`
    const row = [
      id,
      body.이름 || '',
      body.연락처 || '',
      body.계좌번호 || '',
      body.분야 || '',
      body.구분 || '',
      token,
      body.기본금액 || '',
    ]
    await appendRow('용역담당자', row)
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
