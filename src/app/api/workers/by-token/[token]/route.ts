import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const WORKERS: Record<string, string> = {
  'b775a18c876534ee': '이인실',
  '4b594c769b0aa6ab': '이미경',
  'e8f27ed8eab30c68': '이한나',
  '2d79c5c07cfb8e4c': '진진수',
  '9a495582ad427525': '김기진',
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const workerName = WORKERS[token]
    if (!workerName) {
      return NextResponse.json({ error: 'invalid token' }, { status: 404 })
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })
    const sheets = google.sheets({ version: 'v4', auth })

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: '용역!A:H'
    })

    const rows = res.data.values || []
    // 헤더: ID(0) 날짜(1) 하우스명(2) 담당자(3) 종류(4) 비용(5) 메모(6) 완료여부(7)
    const schedules = rows.slice(1)
      .map(r => ({
        id: r[0] || '',
        date: r[1] || '',
        houseName: r[2] || '',
        workerName: r[3] || '',
        type: r[4] || '',
        amount: Number(r[5]) || 0,
        memo: r[6] || '',
        isDone: r[7] === 'Y',
      }))
      .filter(s => s.workerName === workerName)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    return NextResponse.json({
      worker: { name: workerName, token },
      schedules,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
