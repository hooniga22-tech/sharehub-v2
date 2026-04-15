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

  // 1. 입주자 탭 전체 읽기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!A1:Z',
  })
  const allRows = res.data.values || []
  const headers = allRows[0]
  const data = allRows.slice(1)

  console.log(`입주자 탭: 헤더 ${headers.length}개 컬럼, 데이터 ${data.length}개 row`)

  // 헤더 인덱스 찾기
  const iHouseName = headers.indexOf('지점명')
  const iRoomCode = headers.indexOf('방코드')
  const iRoomType = headers.indexOf('방타입')

  console.log(`컬럼 인덱스 - 지점명:${iHouseName}, 방코드:${iRoomCode}, 방타입:${iRoomType}`)

  if (iHouseName < 0 || iRoomCode < 0 || iRoomType < 0) {
    console.error('필수 컬럼을 찾을 수 없습니다.')
    process.exit(1)
  }

  // 2. 지점명 + 방코드 조합으로 고유 방 목록 추출
  const seen = new Set()
  const rooms = []

  for (const row of data) {
    const houseName = (row[iHouseName] || '').trim()
    const roomCode = (row[iRoomCode] || '').trim()
    const roomType = (row[iRoomType] || '').trim()

    if (!houseName || !roomCode) continue

    const key = `${houseName}__${roomCode}`
    if (seen.has(key)) continue
    seen.add(key)

    rooms.push({ houseName, roomCode, roomType })
  }

  // 지점명 → 방코드 순 정렬
  rooms.sort((a, b) => a.houseName.localeCompare(b.houseName) || a.roomCode.localeCompare(b.roomCode))

  console.log(`\n고유 방 ${rooms.length}개 추출`)

  // 3. 방 탭에 일괄 추가 (2행부터, 헤더 유지)
  const newRows = rooms.map((r, i) => {
    const id = `room_${String(i + 1).padStart(3, '0')}`
    return [id, '', r.houseName, r.roomCode, r.roomType, '', '']
  })

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: '방!A2',
    valueInputOption: 'RAW',
    requestBody: { values: newRows },
  })

  console.log(`\n방 탭에 ${newRows.length}개 row 추가 완료!`)

  // 지점별 방 개수 요약
  const summary = {}
  for (const r of rooms) {
    summary[r.houseName] = (summary[r.houseName] || 0) + 1
  }

  console.log(`\n--- 지점별 방 개수 ---`)
  const sortedEntries = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0]))
  for (const [name, count] of sortedEntries) {
    console.log(`  ${name}: ${count}개`)
  }
  console.log(`  합계: ${rooms.length}개`)
}

main().catch(e => { console.error(e); process.exit(1) })
