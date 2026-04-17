import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function main() {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // 용역 탭 담당자명
  const workRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역!A:H',
  })
  const workRows = workRes.data.values || []
  const workHeader = workRows[0]
  const workData = workRows.slice(1)
  console.log(`용역 탭 헤더:`, workHeader)
  const workerNames = [...new Set(workData.map(r => r[3] || '').filter(Boolean))]
  console.log(`\n용역 시트 담당자명 (${workerNames.length}개):`)
  workerNames.forEach(n => console.log(`  [${n}] (길이:${n.length}, 바이트:${[...n].map(c => c.charCodeAt(0)).join(',')})`))

  // 용역담당자 탭
  const staffRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
  })
  const staffRows = staffRes.data.values || []
  const staffHeader = staffRows[0]
  const staffData = staffRows.slice(1)
  console.log(`\n용역담당자 탭 헤더:`, staffHeader)
  console.log(`\n용역담당자 시트 (${staffData.length}명):`)
  staffData.forEach(r => {
    const name = r[1] || ''
    const token = r[6] || ''
    console.log(`  [${name}] (길이:${name.length}) → 토큰: ${token || '(없음)'}`)
  })

  // 매칭 분석
  console.log(`\n===== 매칭 분석 =====`)
  workerNames.forEach(wn => {
    const match = staffData.find(r => (r[1] || '') === wn)
    const matchTrim = staffData.find(r => (r[1] || '').trim() === wn.trim())
    if (match && match[6]) {
      console.log(`  ✓ [${wn}] 매칭 성공, 토큰=${match[6]}`)
    } else if (match && !match[6]) {
      console.log(`  △ [${wn}] 매칭 성공, but 토큰 없음`)
    } else if (matchTrim) {
      console.log(`  ⚠ [${wn}] → [${matchTrim[1]}] trim 후 매칭됨 (공백 문제)`)
    } else {
      console.log(`  ✗ [${wn}] 매칭 실패 — 용역담당자에 없음`)
    }
  })
}

main().catch(e => { console.error(e); process.exit(1) })
