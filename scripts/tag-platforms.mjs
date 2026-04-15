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

function detectPlatform(name) {
  const lower = (name || '').toLowerCase()
  if (lower.includes('(우주)')) return '우주'
  if (lower.includes('(앤코)') || lower.includes('(엔코)')) return '앤코'
  if (lower.includes('(맘스테이)')) return '맘스테이'
  return ''
}

async function main() {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // 1. 입주자 탭 전체 읽기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!A1:Z',
  })
  const allRows = res.data.values || []
  const headers = allRows[0]
  const data = allRows.slice(1)

  console.log(`입주자 탭: ${data.length}개 row`)

  // 2. 헤더에서 인덱스 찾기
  const iName = headers.indexOf('이름')
  let iPlatform = headers.indexOf('플랫폼')

  console.log(`컬럼 인덱스 - 이름:${iName}, 플랫폼:${iPlatform}`)

  // 3. 플랫폼 컬럼 없으면 추가
  if (iPlatform < 0) {
    iPlatform = headers.length
    const col = String.fromCharCode(65 + iPlatform)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `입주자!${col}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['플랫폼']] },
    })
    console.log(`플랫폼 컬럼 추가: ${col}열`)
  }

  // 4. 각 행 태깅
  const tagged = { 우주: [], 앤코: [], 맘스테이: [] }
  const updates = []

  data.forEach((row, idx) => {
    const name = row[iName] || ''
    const platform = detectPlatform(name)
    if (!platform) return

    const sheetRow = idx + 2 // 1-based, skip header
    const col = String.fromCharCode(65 + iPlatform)

    tagged[platform].push(name)
    updates.push({
      range: `입주자!${col}${sheetRow}`,
      values: [[platform]],
    })
  })

  // 5. batchUpdate
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    })
  }

  // 결과 출력
  console.log(`\n우주 태깅: ${tagged.우주.length}명`)
  tagged.우주.forEach(n => console.log(`  - ${n}`))

  console.log(`\n앤코 태깅: ${tagged.앤코.length}명`)
  tagged.앤코.forEach(n => console.log(`  - ${n}`))

  console.log(`\n맘스테이 태깅: ${tagged.맘스테이.length}명`)
  tagged.맘스테이.forEach(n => console.log(`  - ${n}`))

  console.log(`\n총 태깅: ${updates.length}명`)
}

main().catch(e => { console.error(e); process.exit(1) })
