import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })
    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '용역!A:H'
    })

    const rows = res.data.values || []
    if (rows.length <= 1) return NextResponse.json([])

    // 헤더: ID(0) 날짜(1) 하우스명(2) 담당자(3) 종류(4) 비용(5) 메모(6) 완료여부(7)
    const data = rows.slice(1).map((r) => ({
      id: r[0] || '',
      scheduledDate: r[1] || '',
      houseName: r[2] || '',
      name: r[3] || '',
      taskType: r[4] || '',
      cost: Number(r[5]) || 0,
      memo: r[6] || '',
      isDone: r[7] === 'Y',
    }))

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
