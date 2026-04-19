import { google } from 'googleapis'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// 할일 시트의 기존 행을 새 상태 정책으로 일괄 정리.
// 정책: 상태 ∈ {예정, 완료}는 그대로 두고, 그 외(접수/잠수/공백 등)는
//   마감일이 있으면 '예정', 없으면 '인벤토리'로 보정.
const SHEET_ID = process.env.GOOGLE_SHEETS_ID!
const TAB = '할일'

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const all = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB}!A1:Z`,
  })
  const rows = all.data.values || []
  if (rows.length < 2) { console.log('데이터 없음'); return }
  const header = rows[0] as string[]
  const idCol = header.findIndex(h => (h||'').trim() === '할일ID')
  const dueCol = header.findIndex(h => (h||'').trim() === '마감일')
  const statusCol = header.findIndex(h => (h||'').trim() === '상태')
  if (idCol < 0 || dueCol < 0 || statusCol < 0) {
    throw new Error('필수 헤더(할일ID/마감일/상태) 누락')
  }

  const KEEP = new Set(['예정', '완료'])
  const updates: { row: number; col: number; v: string }[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r[idCol]) continue
    const cur = (r[statusCol] || '').trim()
    if (KEEP.has(cur)) continue
    const due = (r[dueCol] || '').trim()
    const next = due ? '예정' : '인벤토리'
    if (next === cur) continue
    updates.push({ row: i + 1, col: statusCol, v: next })
    console.log(`row ${i + 1} (${r[idCol]}): '${cur}' → '${next}' (due='${due}')`)
  }
  if (updates.length === 0) {
    console.log('변경할 행 없음')
    return
  }
  const data = updates.map(u => ({
    range: `${TAB}!${String.fromCharCode(65 + u.col)}${u.row}`,
    values: [[u.v]],
  }))
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data },
  })
  console.log(`업데이트 ${updates.length}건 완료`)
}
main().catch(e => { console.error(e); process.exit(1) })
