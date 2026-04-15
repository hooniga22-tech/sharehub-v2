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

  // ========== 작업 1: 입주자 탭 대학하우스 구 확인 ==========
  console.log('===== 작업 1: 입주자 탭 대학하우스 구 확인 =====\n')

  const tenantRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!A1:Z',
  })
  const tenantAll = tenantRes.data.values || []
  const tenantHeaders = tenantAll[0]
  const tenantData = tenantAll.slice(1)

  const iDistrict = tenantHeaders.indexOf('구')
  const iHouseName = tenantHeaders.indexOf('지점명')

  console.log(`입주자 헤더 - 구:${iDistrict}, 지점명:${iHouseName}`)

  const daehakTenants = []
  tenantData.forEach((row, idx) => {
    if ((row[iHouseName] || '').trim() === '대학하우스') {
      daehakTenants.push({ row, sheetRow: idx + 2, district: (row[iDistrict] || '').trim() })
    }
  })

  console.log(`\n대학하우스 입주자 ${daehakTenants.length}개:`)
  daehakTenants.forEach(t => {
    console.log(`  행${t.sheetRow}: 구=${t.district}, ID=${t.row[0]}, 방=${t.row[3]}, 이름=${t.row[5]}`)
  })

  const wrongDistrict = daehakTenants.filter(t => t.district !== '관악구')
  console.log(`\n구가 '관악구'가 아닌 row: ${wrongDistrict.length}개`)
  wrongDistrict.forEach(t => {
    console.log(`  행${t.sheetRow}: 구='${t.district}' → '관악구'로 수정 필요`)
  })

  // 수정 실행
  if (wrongDistrict.length > 0) {
    console.log(`\n구 수정 실행...`)
    for (const t of wrongDistrict) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `입주자!${String.fromCharCode(65 + iDistrict)}${t.sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['관악구']] },
      })
      console.log(`  행${t.sheetRow} 구: '${t.district}' → '관악구' 완료`)
    }
  }

  // ========== 작업 2: 방 탭 대학하우스 중복 제거 ==========
  console.log('\n\n===== 작업 2: 방 탭 대학하우스 중복 제거 =====\n')

  const roomRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '방!A1:Z',
  })
  const roomAll = roomRes.data.values || []
  const roomHeaders = roomAll[0]
  const roomData = roomAll.slice(1)

  const rHouseName = roomHeaders.indexOf('지점명')
  const rRoomCode = roomHeaders.indexOf('방코드')
  const rRoomType = roomHeaders.indexOf('방타입')

  console.log(`방 헤더 - 지점명:${rHouseName}, 방코드:${rRoomCode}, 방타입:${rRoomType}`)

  const daehakRooms = []
  roomData.forEach((row, idx) => {
    if ((row[rHouseName] || '').trim() === '대학하우스') {
      daehakRooms.push({ row, sheetRow: idx + 2, roomCode: (row[rRoomCode] || '').trim(), roomType: (row[rRoomType] || '').trim() })
    }
  })

  console.log(`\n대학하우스 방 ${daehakRooms.length}개:`)
  daehakRooms.forEach(r => {
    console.log(`  행${r.sheetRow}: ID=${r.row[0]}, 방코드='${r.roomCode}', 방타입='${r.roomType}'`)
  })

  // 방코드 기준으로 중복 판별 - 짧은 코드(A,B,C,D)와 긴 코드(A 1인실 입구 등)가 있으면
  // 짧은 코드를 삭제 대상으로 봄 (긴 코드가 더 정보가 많음)
  const codeGroups = {}
  daehakRooms.forEach(r => {
    // 방코드 첫 글자로 그룹핑 (A, B, C, D)
    const base = r.roomCode.charAt(0)
    if (!codeGroups[base]) codeGroups[base] = []
    codeGroups[base].push(r)
  })

  console.log(`\n방코드 그룹:`)
  const toDelete = []
  for (const [base, group] of Object.entries(codeGroups)) {
    console.log(`  ${base}: ${group.map(g => `'${g.roomCode}'(행${g.sheetRow})`).join(', ')}`)
    if (group.length > 1) {
      // 긴 코드(관악구 버전) 유지, 짧은 코드(서대문구 버전) 삭제
      const sorted = group.sort((a, b) => b.roomCode.length - a.roomCode.length)
      const keep = sorted[0]
      const remove = sorted.slice(1)
      console.log(`    → 유지: '${keep.roomCode}'(행${keep.sheetRow}), 삭제: ${remove.map(r => `'${r.roomCode}'(행${r.sheetRow})`).join(', ')}`)
      toDelete.push(...remove)
    }
  }

  if (toDelete.length > 0) {
    // 삭제는 아래 행부터 해야 인덱스가 안 밀림
    toDelete.sort((a, b) => b.sheetRow - a.sheetRow)

    console.log(`\n삭제 실행 (${toDelete.length}개, 아래 행부터):`)

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
    const roomSheet = meta.data.sheets.find(s => s.properties.title === '방')
    const sheetId = roomSheet.properties.sheetId

    for (const r of toDelete) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: r.sheetRow - 1, // 0-based
                endIndex: r.sheetRow,
              },
            },
          }],
        },
      })
      console.log(`  행${r.sheetRow} 삭제: '${r.roomCode}' 완료`)
    }
  }

  // 최종 확인
  console.log('\n\n===== 최종 확인 =====\n')
  const finalRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '방!A1:Z',
  })
  const finalAll = finalRes.data.values || []
  const finalDaehak = finalAll.slice(1).filter(r => (r[rHouseName] || '').trim() === '대학하우스')
  console.log(`대학하우스 방 최종 ${finalDaehak.length}개:`)
  finalDaehak.forEach(r => {
    console.log(`  ID=${r[0]}, 방코드='${r[rRoomCode]}', 방타입='${r[rRoomType]}'`)
  })

  console.log(`\n방 탭 전체: ${finalAll.length - 1}개 방`)
}

main().catch(e => { console.error(e); process.exit(1) })
