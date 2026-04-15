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

  // 1. 입주자 탭 헤더 확인 및 추가
  console.log('===== 입주자 탭 헤더 확인 =====')
  const tenantRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!1:1',
  })
  const tenantHeaders = tenantRes.data.values?.[0] || []
  console.log(`현재 헤더 (${tenantHeaders.length}개):`, tenantHeaders)

  const hasPlatform = tenantHeaders.includes('플랫폼')
  const hasAccount = tenantHeaders.includes('이체계좌')

  if (!hasPlatform || !hasAccount) {
    const toAdd = []
    if (!hasPlatform) toAdd.push('플랫폼')
    if (!hasAccount) toAdd.push('이체계좌')

    const startCol = String.fromCharCode(65 + tenantHeaders.length)
    const endCol = String.fromCharCode(65 + tenantHeaders.length + toAdd.length - 1)

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `입주자!${startCol}1:${endCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [toAdd] },
    })
    console.log(`추가됨: ${toAdd.join(', ')} (${startCol}~${endCol} 열)`)
  } else {
    console.log('이미 플랫폼, 이체계좌 컬럼이 있습니다.')
  }

  // 2. 수납 탭 헤더 ��인 및 추가
  console.log('\n===== 수납 탭 헤더 확인 =====')
  const paymentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '수납!1:1',
  })
  const paymentHeaders = paymentRes.data.values?.[0] || []
  console.log(`현재 헤더 (${paymentHeaders.length}개):`, paymentHeaders)

  const hasTransferred = paymentHeaders.includes('이체완료')

  if (!hasTransferred) {
    const col = String.fromCharCode(65 + paymentHeaders.length)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `수납!${col}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['��체완료']] },
    })
    console.log(`추가��: 이체완료 (${col} 열)`)
  } else {
    console.log('이미 이체완료 컬럼이 있습니다.')
  }

  // 최종 확인
  console.log('\n===== 최종 확인 =====')
  const finalTenant = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!1:1' })
  console.log('입주자 헤더:', finalTenant.data.values?.[0])
  const finalPayment = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!1:1' })
  console.log('수납 헤더:', finalPayment.data.values?.[0])
}

main().catch(e => { console.error(e); process.exit(1) })
