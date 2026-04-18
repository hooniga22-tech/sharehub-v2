import { google } from 'googleapis'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// 할일 시트를 신규 생성하고 헤더를 기록한다. 이미 있으면 헤더만 보장.
const SHEET_ID = process.env.GOOGLE_SHEETS_ID!
const TAB = '할일'
const HEADERS = [
  '할일ID', '지점명', '방코드', '제목', '태그',
  '담당자명', '시작일', '마감일', '상태',
  '금액', '담당자메모', '등록일', '완료일',
]

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const existing = meta.data.sheets?.find(s => s.properties?.title === TAB)

  if (!existing) {
    console.log(`'${TAB}' 탭 신규 생성`)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: TAB } } }],
      },
    })
  } else {
    console.log(`'${TAB}' 탭 이미 존재 — 헤더만 확인`)
  }

  const cur = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1:Z1`,
  })
  const curHeaders = (cur.data.values?.[0] || []) as string[]
  const same = HEADERS.every((h, i) => (curHeaders[i] || '').trim() === h)
  if (same) {
    console.log('헤더 동일 — 변경 없음')
    return
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  })
  console.log('헤더 기록 완료:', HEADERS.join(', '))
}
main().catch(e => { console.error(e); process.exit(1) })
