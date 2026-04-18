import { google } from 'googleapis'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// 용역 시트에 요청사항 / 완료일 컬럼을 없으면 추가한다. idempotent.
const SHEET_ID = process.env.GOOGLE_SHEETS_ID!

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '용역!A1:Z1',
  })
  const headers = (res.data.values?.[0] || []).map(h => (h || '').trim())
  console.log('현재 헤더:', headers)
  const toAdd: string[] = []
  if (!headers.includes('요청사항')) toAdd.push('요청사항')
  if (!headers.includes('완료일')) toAdd.push('완료일')
  if (toAdd.length === 0) {
    console.log('추가할 컬럼 없음')
    return
  }
  const newHeaders = [...headers, ...toAdd]
  console.log('새 헤더:', newHeaders)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: '용역!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [newHeaders] },
  })
  console.log('완료:', toAdd.join(', '))
}
main().catch(e => { console.error(e); process.exit(1) })
