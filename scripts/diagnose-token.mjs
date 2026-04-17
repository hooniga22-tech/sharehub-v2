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

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
  })
  const rows = res.data.values || []
  console.log('=== 용역담당자 시트 G열(index 6, 링크토큰) raw 값 ===\n')
  rows.slice(1).forEach((r, i) => {
    const token = r[6]
    const rawDisplay = token === undefined ? '(undefined)' :
                       token === null ? '(null)' :
                       token === '' ? '(empty string)' :
                       `"${token}"`
    const codes = typeof token === 'string' ? [...token].map(c => c.charCodeAt(0)).join(',') : 'N/A'
    console.log(`  [${i}] 이름="${r[1]}" 링크토큰=${rawDisplay} (길이=${typeof token==='string'?token.length:'?'}, 코드=${codes})`)
  })

  // 특정 토큰 검색 시뮬레이션
  console.log('\n=== "w_6j4ac76i" 검색 시뮬레이션 ===')
  const target = 'w_6j4ac76i'
  const found = rows.slice(1).find(r => r[6] === target)
  console.log(`  전체 행 수(헤더 제외): ${rows.length - 1}`)
  console.log(`  r[6] === "${target}" 매칭: ${found ? `성공 - ${found[1]}` : '실패'}`)

  const foundTrim = rows.slice(1).find(r => (r[6] || '').trim() === target.trim())
  console.log(`  trim 후 매칭: ${foundTrim ? `성공 - ${foundTrim[1]}` : '실패'}`)

  const foundIncl = rows.slice(1).find(r => (r[6] || '').includes(target))
  console.log(`  includes 매칭: ${foundIncl ? `성공 - ${foundIncl[1]}` : '실패'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
