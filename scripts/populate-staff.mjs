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

  // 용역 탭에서 unique 담당자명 추출
  const workRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역!A:H',
  })
  const workData = (workRes.data.values || []).slice(1)
  const workerNames = [...new Set(workData.map(r => (r[3] || '').trim()).filter(Boolean))]
  console.log(`용역 시트 담당자 ${workerNames.length}명:`, workerNames)

  // 용역담당자 탭 기존 데이터
  const staffRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
  })
  const staffData = (staffRes.data.values || []).slice(1)
  const existingNames = new Set(staffData.map(r => (r[1] || '').trim()))
  console.log(`용역담당자 탭 기존: ${staffData.length}명`)

  // 누락된 담당자만 추가
  const toAdd = workerNames.filter(n => !existingNames.has(n))
  console.log(`\n추가 대상: ${toAdd.length}명 —`, toAdd)

  if (toAdd.length === 0) {
    console.log('추가할 담당자 없음.')
    return
  }

  // 행 구성: [담당자ID, 이름, 연락처, 계좌번호, 분야, 구분, 링크토큰, 기본금액]
  const now = Date.now()
  const rows = toAdd.map((name, i) => {
    const id = `staff_${now}_${i}`
    const token = `w_${Math.random().toString(36).slice(2, 10)}`
    return [id, name, '', '', '', '', token, '']
  })

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '용역담당자!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })

  console.log(`\n${toAdd.length}명 추가 완료:`)
  rows.forEach(r => console.log(`  [${r[1]}] ID=${r[0]}, 토큰=${r[6]}`))
}

main().catch(e => { console.error(e); process.exit(1) })
