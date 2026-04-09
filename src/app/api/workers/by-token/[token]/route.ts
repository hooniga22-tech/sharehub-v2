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
  { params }: { params: { token: string } }
) {
  try {
    const workerName = WORKERS[params.token]
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
    const schedules = rows.slice(1)
      .map(r => ({
        id: r[0] || '',
        scheduledDate: r[1] || '',
        houseName: r[2] || '',
        name: r[3] || '',
        taskType: r[4] || '',
        cost: Number(r[5]) || 0,
        memo: r[6] || '',
        isDone: r[7] === 'Y',
      }))
      .filter(s => s.name === workerName)

    return NextResponse.json({ name: workerName, schedules })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
