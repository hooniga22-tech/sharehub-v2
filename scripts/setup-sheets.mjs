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

async function getSheetList() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  return res.data.sheets.map(s => s.properties.title)
}

async function addSheet(title) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }]
    }
  })
  console.log(`✅ 시트 추가: ${title}`)
}

async function setHeader(sheetName, headers) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] }
  })
  console.log(`✅ 헤더 세팅: ${sheetName} (${headers.length}개 컬럼)`)
}

async function main() {
  const existingSheets = await getSheetList()
  console.log('현재 시트 목록:', existingSheets)

  // ── 기존 시트 헤더 재세팅 ───────────────────

  if (existingSheets.includes('지점')) {
    await setHeader('지점', [
      '지점ID', '지점명', '구', '주소', '현관비번', '와이파이SSID', '와이파이PW',
      '집월세', '투자자토큰', '총방수', '건물주명', '건물주연락처', '메모'
    ])
  }

  if (existingSheets.includes('방')) {
    await setHeader('방', [
      '방ID', '지점ID', '지점명', '방코드', '방타입', '현재상태', '메모'
    ])
  }

  if (existingSheets.includes('입주자')) {
    await setHeader('입주자', [
      '입주자ID', '지점명', '방코드', '이름', '연락처', '국적',
      '월세', '관리비', '보증금', '입주일', '퇴실일', '상태', '메모', '링크토큰'
    ])
  }

  if (existingSheets.includes('공과금')) {
    await setHeader('공과금', [
      'ID', '지점명', '연도', '월', '전기', '가스', '수도', '인터넷', '정수기', '메모'
    ])
  }

  if (existingSheets.includes('이슈')) {
    await setHeader('이슈', [
      '이슈ID', '지점명', '방코드', '제목', '내용', '카테고리',
      '상태', '담당자', '등록일', '완료일', '비용', '메모'
    ])
  }

  if (existingSheets.includes('용역')) {
    await setHeader('용역', [
      '용역ID', '담당자명', '지점명', '작업종류', '예정일',
      '완료여부', '정산금액', '메모', '링크토큰'
    ])
  }

  if (existingSheets.includes('투자자')) {
    await setHeader('투자자', [
      '투자자ID', '투자자명', '연락처', '지점명', '배분비율', '링크토큰', '메모'
    ])
  }

  // ── 신규 시트 추가 + 헤더 세팅 ─────────────

  if (!existingSheets.includes('수납')) await addSheet('수납')
  await setHeader('수납', [
    '수납ID', '입주자ID', '지점명', '방코드', '입주자명',
    '연도', '월', '월세금액', '관리비금액', '납부여부',
    '납부일', '납부방법', '메모'
  ])

  if (!existingSheets.includes('공실')) await addSheet('공실')
  await setHeader('공실', [
    '공실ID', '지점명', '방코드', '공실유형',
    '공실시작일', '퇴실예정일',
    '예정자명', '예정자연락처', '예정입주일', '보증금상태',
    '메모', '상태'
  ])

  if (!existingSheets.includes('당번')) await addSheet('당번')
  await setHeader('당번', [
    '당번ID', '지점명', '주차시작일', '방코드', '입주자명',
    '당번유형', '완료여부', '완료일시', '완료처리자',
    '면제여부', '면제사유', '메모'
  ])

  if (!existingSheets.includes('운영지출')) await addSheet('운영지출')
  await setHeader('운영지출', [
    '지출ID', '지점명', '날짜', '카테고리',
    '금액', '내용', '담당자', '메모'
  ])

  console.log('\n🎉 모든 시트 세팅 완료!')
  console.log('총 11개 탭: 지점/방/입주자/공과금/이슈/용역/투자자/수납/공실/당번/운영지출')
}

main().catch(console.error)
