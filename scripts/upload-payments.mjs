import { google } from 'googleapis'
import * as dotenv from 'dotenv'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const xlsx = require('xlsx')

dotenv.config({ path: '.env.local' })

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEETS_ID

const wb = xlsx.readFile('/Users/jay/Downloads/2026 공과금 및 입주자 납부 현황.xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(ws, { defval: '' })

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY_MONTH = 4 // 4월까지 납부완료로 처리

// 이름 파싱: "이은서 3/31\n유은선 4/1~30" → [{name}]
function parseNames(raw) {
  if (!raw || String(raw).trim() === '') return []
  const parts = String(raw).split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  return parts.map(p => ({ name: p }))
}

const header = [
  'ID', '년월', '하우스', '방코드', '이름', '월세', '관리비',
  '월세납부', '관리비납부', '메모'
]

const dataRows = []
let idx = 1

rows.forEach(row => {
  const 구분 = String(row['구분'] || '').trim()
  if (구분 === '합계' || 구분 === '' || 구분 === '구분') return

  const 하우스raw = String(row['하우스'] || '').trim()
  if (!하우스raw) return

  // 하우스명 정리
  const houseName = 하우스raw.replace(/\(.*?\)/g, '').trim()

  MONTHS.forEach((mon, mi) => {
    const monthNum = mi + 1
    const 이름raw = row[`${mon} 이름`]
    const 월세 = row[`${mon} 월세`]
    const 관리비 = row[`${mon} 관리비`]

    if (!이름raw && !월세) return

    const names = parseNames(이름raw)
    const isPast = monthNum <= TODAY_MONTH

    if (names.length === 0 && 월세) {
      dataRows.push([
        `pay_${String(idx++).padStart(4,'0')}`,
        `2026-${String(monthNum).padStart(2,'0')}`,
        houseName, 구분, '',
        월세 || '', 관리비 || '',
        isPast ? 'Y' : '', isPast ? 'Y' : '', ''
      ])
    } else if (names.length === 1) {
      dataRows.push([
        `pay_${String(idx++).padStart(4,'0')}`,
        `2026-${String(monthNum).padStart(2,'0')}`,
        houseName, 구분, names[0].name,
        월세 || '', 관리비 || '',
        isPast ? 'Y' : '', isPast ? 'Y' : '', ''
      ])
    } else {
      names.forEach((n, ni) => {
        dataRows.push([
          `pay_${String(idx++).padStart(4,'0')}`,
          `2026-${String(monthNum).padStart(2,'0')}`,
          houseName, 구분, n.name,
          ni === names.length - 1 ? (월세 || '') : '',
          ni === names.length - 1 ? (관리비 || '') : '',
          isPast ? 'Y' : '', isPast ? 'Y' : '',
          names.length > 1 ? `${names.length}명 중 ${ni+1}번째` : ''
        ])
      })
    }
  })
})

async function main() {
  console.log(`📊 총 ${dataRows.length}행 업로드 시작...`)

  // 납부 시트에 업로드 (공과금 시트가 아닌 납부 시트)
  const targetSheet = '납부'

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${targetSheet}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [header] }
  })

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${targetSheet}!A2:Z10000`
  })

  const batchSize = 100
  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${targetSheet}!A${i + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: batch }
    })
    console.log(`  ✅ ${Math.min(i + batchSize, dataRows.length)}/${dataRows.length} 완료`)
    if (i + batchSize < dataRows.length) await new Promise(r => setTimeout(r, 1500))
  }

  const byMonth = {}
  dataRows.forEach(r => { byMonth[r[1]] = (byMonth[r[1]] || 0) + 1 })
  console.log('\n📋 업로드 완료! 월별 행수:')
  Object.entries(byMonth).sort().forEach(([m, c]) => console.log(`  ${m}: ${c}행`))

  console.log('\n샘플:')
  dataRows.slice(0, 3).forEach(r => console.log(`  ${r[2]} ${r[3]} ${r[4]} ${r[1]} 월세:${r[5]} 관리비:${r[6]} 납부:${r[7]}`))
}

main().catch(console.error)
