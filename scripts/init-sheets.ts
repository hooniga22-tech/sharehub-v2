import { google } from 'googleapis'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

const SHEETS: Record<string, string[]> = {
  '지점': ['지점ID', '지점명', '구', '주소', '현관비번', '와이파이SSID', '와이파이PW', '집월세', '투자자비율', '운영자비율', '건물주명', '건물주연락처', '메모'],
  '방': ['방ID', '지점ID', '지점명', '방코드', '방타입', '면적', '기준월세', '메모'],
  '입주자': ['입주자ID', '방ID', '지점명', '방코드', '이름', '연락처', '월세', '관리비', '보증금', '입주일', '퇴실일', '상태', '국적', '메모', '링크토큰'],
  '공과금': ['ID', '지점ID', '지점명', '연도', '월', '전기', '가스', '수도', '인터넷', '정수기', '관리비', '청소', '수리기타', '메모'],
  '이슈': ['이슈ID', '지점명', '방코드', '제목', '내용', '카테고리', '상태', '담당자', '등록일', '완료일', '비용', '메모'],
  '용역': ['용역ID', '담당자명', '지점명', '작업종류', '예정일', '완료여부', '정산금액', '이슈ID', '메모', '링크토큰'],
  '투자자': ['투자자ID', '투자자명', '지점ID', '지점명', '투자비율', '링크토큰', '연락처', '메모'],
}

const SAMPLE_TENANTS = [
  ['T001', 'R001', '역삼하우스', '302호', '김민수', '010-1234-5678', '650000', '100000', '3000000', '2024-01-15', '2024-12-14', '입주중', '한국', '조용한 성격', ''],
  ['T002', 'R002', '강남하우스', '105호', '이지현', '010-3456-7890', '700000', '120000', '3000000', '2024-02-01', '2025-01-31', '입주중', '한국', '', ''],
  ['T003', 'R003', '서초하우스', '201호', '박서연', '010-2345-6789', '580000', '100000', '2000000', '2024-03-01', '2024-08-31', '퇴실예정', '한국', '8월 말 퇴실', ''],
]

const SAMPLE_ISSUES = [
  ['I001', '역삼하우스', '302호', '보일러 고장', '온수가 나오지 않음', '수리', '접수', '', '2024-04-05', '', '0', '긴급'],
  ['I002', '강남하우스', '공용', '수도 누수', '2층 공용화장실 세면대 아래', '수리', '진행중', '박배관', '2024-04-04', '', '80000', ''],
]

async function main() {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Check existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const existingSheets = meta.data.sheets?.map(s => s.properties?.title) || []

  // Create missing sheets
  const requests = []
  for (const name of Object.keys(SHEETS)) {
    if (!existingSheets.includes(name)) {
      requests.push({ addSheet: { properties: { title: name } } })
    }
  }
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } })
    console.log(`Created sheets: ${requests.map(r => r.addSheet?.properties?.title).join(', ')}`)
  }

  // Write headers to each sheet
  for (const [name, headers] of Object.entries(SHEETS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${name}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
    console.log(`[${name}] headers written (${headers.length} columns)`)
  }

  // Add sample tenants
  const tenantRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!A2:A',
  })
  if (!tenantRes.data.values || tenantRes.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: '입주자!A:Z',
      valueInputOption: 'RAW',
      requestBody: { values: SAMPLE_TENANTS },
    })
    console.log(`[입주자] ${SAMPLE_TENANTS.length} sample rows added`)
  } else {
    console.log(`[입주자] already has ${tenantRes.data.values.length} rows, skipping samples`)
  }

  // Add sample issues
  const issueRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '이슈!A2:A',
  })
  if (!issueRes.data.values || issueRes.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: '이슈!A:Z',
      valueInputOption: 'RAW',
      requestBody: { values: SAMPLE_ISSUES },
    })
    console.log(`[이슈] ${SAMPLE_ISSUES.length} sample rows added`)
  } else {
    console.log(`[이슈] already has ${issueRes.data.values.length} rows, skipping samples`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
