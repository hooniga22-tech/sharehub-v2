import { google } from 'googleapis'
import { config } from 'dotenv'

config({ path: '.env.local' })

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const SHEET_ID = process.env.GOOGLE_SHEETS_ID

async function main() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const allSheets = res.data.sheets

  console.log('현재 탭 목록:')
  allSheets.forEach(s => console.log(`  - ${s.properties.title} (ID: ${s.properties.sheetId})`))

  const deleteRequests = []

  for (const name of ['납부', '당번교환']) {
    const sheet = allSheets.find(s => s.properties.title === name)
    if (sheet) {
      deleteRequests.push({ deleteSheet: { sheetId: sheet.properties.sheetId } })
      console.log(`🗑️ 삭제 예정: ${name}`)
    } else {
      console.log(`⚠️ 없음 (스킵): ${name}`)
    }
  }

  const sunapSheets = allSheets.filter(s => s.properties.title === '수납')
  if (sunapSheets.length > 1) {
    deleteRequests.push({ deleteSheet: { sheetId: sunapSheets[1].properties.sheetId } })
    console.log(`🗑️ 삭제 예정: 수납 (중복)`)
  }

  if (deleteRequests.length === 0) {
    console.log('✅ 삭제할 탭 없음. 이미 정리됨.')
    return
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: deleteRequests }
  })

  console.log(`\n✅ ${deleteRequests.length}개 탭 삭제 완료!`)

  const finalRes = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const finalSheets = finalRes.data.sheets
  console.log(`\n최종 탭 목록 (${finalSheets.length}개):`)
  finalSheets.forEach(s => console.log(`  ✅ ${s.properties.title}`))
}

main().catch(console.error)
