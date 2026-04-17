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

  // 1. 용역담당자 시트 (/api/workers/staff 응답의 소스)
  const staffRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
  })
  const staffRows = staffRes.data.values || []
  console.log('===== 용역담당자 시트 =====')
  console.log(`헤더: ${JSON.stringify(staffRows[0])}`)
  console.log(`데이터 행: ${staffRows.length - 1}`)
  console.log(`\n/api/workers/staff 샘플 응답 (상위 3건):`)
  staffRows.slice(1, 4).forEach((r, i) => {
    const obj = {
      담당자ID: r[0] || '', 이름: r[1] || '', 연락처: r[2] || '',
      계좌번호: r[3] || '', 분야: r[4] || '', 구분: r[5] || '',
      링크토큰: r[6] || '', 기본금액: r[7] || '',
    }
    console.log(`  [${i}]`, JSON.stringify(obj))
  })

  // 2. 용역 시트 [3]담당자명 샘플
  const workRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역!A:H',
  })
  const workRows = workRes.data.values || []
  console.log('\n===== 용역 시트 [3]담당자명 샘플 5건 =====')
  workRows.slice(1, 6).forEach((r, i) => {
    const n = r[3] || ''
    const codes = [...n].map(c => c.charCodeAt(0)).join(',')
    console.log(`  [${i}] "${n}" (길이=${n.length}, 코드=${codes})`)
  })

  // 3. unique 담당자명 전체 + 매칭 상태
  const workerNames = [...new Set(workRows.slice(1).map(r => r[3] || '').filter(Boolean))]
  console.log(`\n===== 담당자명 unique ${workerNames.length}개 × 용역담당자 매칭 =====`)
  workerNames.forEach(name => {
    const exact = staffRows.slice(1).find(r => (r[1] || '') === name)
    const trimmed = staffRows.slice(1).find(r => (r[1] || '').trim() === name.trim())
    const status = exact ? (exact[6] ? `✓ 토큰=${exact[6]}` : '△ 토큰 없음')
                         : trimmed ? `⚠ trim 후 매칭 (토큰=${trimmed[6] || '없음'})`
                         : '✗ 매칭 실패'
    console.log(`  "${name}" → ${status}`)
  })
}

main().catch(e => { console.error(e); process.exit(1) })
