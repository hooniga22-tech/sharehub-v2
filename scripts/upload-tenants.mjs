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

// 엑셀 읽기
const wb = xlsx.readFile('/Users/jay/Downloads/입주자정보....xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(ws, { defval: '' })

console.log(`엑셀 시트: ${wb.SheetNames[0]}`)
console.log(`총 행수: ${rows.length}`)
if (rows.length > 0) console.log('컬럼:', Object.keys(rows[0]).join(', '))

// 날짜 포맷 변환
function fmtDate(val) {
  if (!val) return ''
  const s = String(val).trim()
  // 2026. 4. 1 형태
  const m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  // 엑셀 시리얼넘버 (45000 이상이면 날짜로 간주)
  if (typeof val === 'number' && val > 40000) {
    const d = new Date((val - 25569) * 86400000)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  return s
}

function getStatus(row) {
  const v = String(row['공실'] || '').trim()
  if (v === '공실') return '공실'
  if (v === '공실예정') return '공실예정'
  if (v === '운영종료') return '운영종료'
  if (!row['계약자'] || String(row['계약자']).trim() === '') return '공실'
  return '입주중'
}

const header = [
  'ID', '지역', '하우스', '방코드', '구분', '이름', '시작일', '종료일',
  '상태', '보증금', '월세', '관리비', '메모', '연락처', '생년월일',
  '주소', '투자자', '투자자계좌', '투자자연락처'
]

const dataRows = rows.map((r, i) => {
  const houseName = String(r['하우스'] || '').trim()
  return [
    `tenant_${String(i+1).padStart(3,'0')}`,
    r['지역'] || '',
    houseName ? houseName + (houseName.endsWith('하우스') ? '' : '하우스') : '',
    r['자리'] || '',
    r['구분'] || '',
    r['계약자'] || '',
    fmtDate(r['계약시작']),
    fmtDate(r['계약종료']),
    getStatus(r),
    r['보증금'] || '',
    r['월세'] || '',
    r['관리비'] || '',
    r['메모'] || '',
    r['연락처'] || '',
    r['생년월일'] || '',
    r['주소'] || '',
    r['투자자'] || '',
    r['투자자 계좌'] || r['투자자계좌'] || '',
    r['투자자 연락처'] || r['투자자연락처'] || '',
  ]
})

async function main() {
  console.log(`\n📊 총 ${dataRows.length}행 업로드 시작...`)

  // 기존 데이터 삭제
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: '입주자!A2:Z1000'
  })

  // 헤더 업데이트
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '입주자!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [header] }
  })

  // 데이터 업로드 (100행씩)
  const batchSize = 100
  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `입주자!A${i + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: batch }
    })
    console.log(`  ✅ ${Math.min(i + batchSize, dataRows.length)}/${dataRows.length} 완료`)
    if (i + batchSize < dataRows.length) await new Promise(r => setTimeout(r, 1000))
  }

  // 결과 요약
  const byStatus = {}
  dataRows.forEach(r => { byStatus[r[8]] = (byStatus[r[8]]||0) + 1 })
  console.log('\n📋 업로드 완료!')
  console.log('상태별:', JSON.stringify(byStatus, null, 2))

  // 샘플 출력
  console.log('\n샘플 3행:')
  dataRows.slice(0, 3).forEach(r => console.log(`  ${r[2]} ${r[3]} ${r[5]} ${r[8]} 월세:${r[10]} 시작:${r[6]} 종료:${r[7]}`))
}

main().catch(console.error)
