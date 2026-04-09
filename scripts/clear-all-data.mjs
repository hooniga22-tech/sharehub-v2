import { google } from 'googleapis'
import dotenv from 'dotenv'
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

// 모든 시트 목록 가져오기
async function getAllSheetNames() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  return meta.data.sheets?.map(s => s.properties?.title).filter(Boolean) || []
}

async function clearSheet(sheetName) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`
    })
    const rows = res.data.values || []
    if (rows.length <= 1) {
      console.log(`  ${sheetName}: 데이터 없음 (헤더만)`)
      return
    }
    const clearRange = `${sheetName}!A2:Z${rows.length + 1}`
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: clearRange
    })
    console.log(`✅ ${sheetName}: ${rows.length - 1}행 삭제 완료`)
  } catch (e) {
    console.log(`❌ ${sheetName}: ${e.message}`)
  }
}

async function main() {
  console.log('🗑️  전체 데이터 삭제 시작...\n')
  const allSheets = await getAllSheetNames()
  console.log(`발견된 시트: ${allSheets.join(', ')}\n`)
  for (const name of allSheets) {
    await clearSheet(name)
  }
  console.log('\n✨ 완료! 모든 시트에 헤더만 남아있어요.')
}
main()
