import { google } from 'googleapis'
import * as dotenv from 'dotenv'
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

const PERSON_MAP = {
  '3a58e4686c944178a0b1027ac195fc42': '이인실',
  '22356175711380659f0df3a9790bf38e': '이한나',
  '7cb0e504323846aba5417b4e16e71228': '이미경',
  '065891f08d3f4f2391ca7219826ead2d': '진진수',
  'a160563b4d08485e8ad41274ad3ff035': '김기진',
  '24be3bdc9d644c3fa90fd94f85151ab4': '방역업체',
}

function extractHouse(title) {
  const m = title.match(/([가-힣a-zA-Z0-9]+하우스)/)
  return m ? m[1] : ''
}

const raw = [
  {title:'반포하우스 정기청소 2회차', date:'2026-04-30', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'영이하우스 정기청소', date:'2026-04-30', person:'7cb0e504323846aba5417b4e16e71228', cost:0, type:'정기청소'},
  {title:'대학하우스 정기청소', date:'2026-04-30', person:'7cb0e504323846aba5417b4e16e71228', cost:0, type:'정기청소'},
  {title:'영영하우스2 정기청소', date:'2026-04-30', person:'7cb0e504323846aba5417b4e16e71228', cost:0, type:'정기청소'},
  {title:'삼중하우스 정기청소 2회차', date:'2026-04-29', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'신사하우스 정기청소 2회차', date:'2026-04-28', person:'3a58e4686c944178a0b1027ac195fc42', cost:50000, type:'정기청소'},
  {title:'트리하우스 정기청소', date:'2026-04-26', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'샤샤하우스 정기청소 2회차', date:'2026-04-24', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'쌍용하우스 정기청소', date:'2026-04-24', person:'7cb0e504323846aba5417b4e16e71228', cost:50000, type:'정기청소'},
  {title:'당산하우스 정기청소', date:'2026-04-23', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'외대하우스 정기청소', date:'2026-04-23', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'시립하우스 정기청소', date:'2026-04-23', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'휘경하우스 정기청소', date:'2026-04-23', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'빠방하우스 정기청소', date:'2026-04-23', person:'22356175711380659f0df3a9790bf38e', cost:50000, type:'정기청소'},
  {title:'이문하우스 정기청소', date:'2026-04-23', person:'7cb0e504323846aba5417b4e16e71228', cost:50000, type:'정기청소'},
  {title:'광흥하우스 정기청소', date:'2026-04-22', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'한성하우스 정기청소', date:'2026-04-22', person:'22356175711380659f0df3a9790bf38e', cost:50000, type:'정기청소'},
  {title:'영동하우스 정기청소', date:'2026-04-22', person:'7cb0e504323846aba5417b4e16e71228', cost:50000, type:'정기청소'},
  {title:'숙녀하우스 정기청소', date:'2026-04-17', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'아현하우스 정기청소', date:'2026-04-17', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'낙성하우스 정기청소', date:'2026-04-17', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'와이지하우스 정기청소', date:'2026-04-16', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'상상하우스 정기청소', date:'2026-04-16', person:'22356175711380659f0df3a9790bf38e', cost:50000, type:'정기청소'},
  {title:'단짠하우스 정기청소', date:'2026-04-16', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'워너비하우스 정기청소', date:'2026-04-16', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'선릉하우스 정기청소', date:'2026-04-16', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'브루하우스 정기청소', date:'2026-04-15', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'샤샤하우스 정기청소 1회차', date:'2026-04-15', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'소녀하우스 정기청소', date:'2026-04-15', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'허브하우스 정기청소', date:'2026-04-15', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'청량하우스 정기청소', date:'2026-04-15', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'신사하우스 정기청소', date:'2026-04-10', person:'3a58e4686c944178a0b1027ac195fc42', cost:50000, type:'정기청소'},
  {title:'수리) 숙녀 샤워기 수리', date:'2026-04-09', person:'065891f08d3f4f2391ca7219826ead2d', cost:30000, type:'수리'},
  {title:'동동하우스 정기청소', date:'2026-04-09', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'동삼하우스 정기청소', date:'2026-04-09', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'샤네하우스 정기청소', date:'2026-04-09', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'반포하우스 정기청소 1회차', date:'2026-04-08', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'동일하우스 정기청소', date:'2026-04-08', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'동지하우스 정기청소', date:'2026-04-08', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'동이하우스 정기청소', date:'2026-04-08', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'신촌하우스 정기청소', date:'2026-04-08', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'수리) 트리 A룸 서랍장', date:'2026-04-06', person:'065891f08d3f4f2391ca7219826ead2d', cost:20000, type:'수리'},
  {title:'청소) 트리하우스 A 입주청소', date:'2026-04-03', person:'3a58e4686c944178a0b1027ac195fc42', cost:30000, type:'청소'},
  {title:'삼중하우스 정기청소 1회차', date:'2026-04-02', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'수리) 단짠하우스 해충방역', date:'2026-04-02', person:'24be3bdc9d644c3fa90fd94f85151ab4', cost:30000, type:'수리'},
  {title:'수리) 빠방하우스 해충방역', date:'2026-04-02', person:'24be3bdc9d644c3fa90fd94f85151ab4', cost:30000, type:'수리'},
  {title:'수리) 시립하우스 해충방역', date:'2026-04-02', person:'24be3bdc9d644c3fa90fd94f85151ab4', cost:30000, type:'수리'},
  {title:'수리) 외대하우스 해충방역', date:'2026-04-02', person:'24be3bdc9d644c3fa90fd94f85151ab4', cost:30000, type:'수리'},
  {title:'수리) 다정하우스 베란다 배수', date:'2026-04-02', person:'a160563b4d08485e8ad41274ad3ff035', cost:20000, type:'수리'},
  {title:'영삼하우스 정기청소', date:'2026-04-02', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'영영하우스1 정기청소', date:'2026-04-02', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'다정하우스 정기청소', date:'2026-04-01', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'샛별하우스 정기청소+계단청소', date:'2026-04-01', person:'7cb0e504323846aba5417b4e16e71228', cost:60000, type:'정기청소'},
  {title:'아리하우스 정기청소', date:'2026-04-01', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'수리)아리하우스 세면대 밸브교체', date:'2026-03-31', person:'a160563b4d08485e8ad41274ad3ff035', cost:30000, type:'수리'},
  {title:'삼중하우스 정기청소 2회차', date:'2026-03-27', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'수리) 당산하우스 비데 설치', date:'2026-03-27', person:'a160563b4d08485e8ad41274ad3ff035', cost:20000, type:'수리'},
  {title:'쌍용하우스 정기청소', date:'2026-03-27', person:'7cb0e504323846aba5417b4e16e71228', cost:50000, type:'정기청소'},
  {title:'한성하우스 정기청소', date:'2026-03-27', person:'22356175711380659f0df3a9790bf38e', cost:50000, type:'정기청소'},
  {title:'반포하우스 정기청소 2회차', date:'2026-03-26', person:'3a58e4686c944178a0b1027ac195fc42', cost:60000, type:'정기청소'},
  {title:'수리) 청량 베란다 문 손잡이 교체', date:'2026-03-26', person:'065891f08d3f4f2391ca7219826ead2d', cost:30000, type:'수리'},
  {title:'영동하우스 정기청소', date:'2026-03-26', person:'7cb0e504323846aba5417b4e16e71228', cost:50000, type:'정기청소'},
  {title:'외대하우스 정기청소', date:'2026-03-26', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'빠방하우스 정기청소', date:'2026-03-26', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'휘경 정기청소', date:'2026-03-26', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'시립하우스 정기청소', date:'2026-03-26', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'신사하우스 정기청소 2회차', date:'2026-03-25', person:'3a58e4686c944178a0b1027ac195fc42', cost:50000, type:'정기청소'},
  {title:'수리) 아리 C-2 화장대 서랍 수리', date:'2026-03-25', person:'065891f08d3f4f2391ca7219826ead2d', cost:25000, type:'수리'},
  {title:'이문하우스 정기청소', date:'2026-03-25', person:'7cb0e504323846aba5417b4e16e71228', cost:60000, type:'정기청소'},
  {title:'샤샤하우스 정기청소 2회차', date:'2026-03-24', person:'3a58e4686c944178a0b1027ac195fc42', cost:30000, type:'정기청소'},
  {title:'수리) 빠방하우스 욕실등 교체', date:'2026-03-24', person:'a160563b4d08485e8ad41274ad3ff035', cost:15000, type:'수리'},
  {title:'수리) 동삼 싱크볼 실리콘 외', date:'2026-03-24', person:'a160563b4d08485e8ad41274ad3ff035', cost:20000, type:'수리'},
  {title:'수리) 삼중 B룸 문 수리', date:'2026-03-24', person:'a160563b4d08485e8ad41274ad3ff035', cost:15000, type:'수리'},
  {title:'수리) 반포하우스 방역', date:'2026-03-21', person:'24be3bdc9d644c3fa90fd94f85151ab4', cost:30000, type:'수리'},
  {title:'수리) 워너비하우스 방등 수리', date:'2026-03-21', person:'065891f08d3f4f2391ca7219826ead2d', cost:25000, type:'수리'},
  {title:'광흥하우스 정기청소', date:'2026-03-20', person:'3a58e4686c944178a0b1027ac195fc42', cost:50000, type:'정기청소'},
  {title:'수리) 청량 블라인드,책상 폐기 외', date:'2026-03-20', person:'065891f08d3f4f2391ca7219826ead2d', cost:40000, type:'수리'},
  {title:'아현하우스 정기청소', date:'2026-03-20', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'낙성하우스 정기청소', date:'2026-03-20', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'상상하우스 정기청소', date:'2026-03-20', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'단짠하우스 정기청소', date:'2026-03-20', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'소녀하우스 정기청소', date:'2026-03-20', person:'22356175711380659f0df3a9790bf38e', cost:40000, type:'정기청소'},
  {title:'당산하우스 정기청소', date:'2026-03-19', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'수리) 빠방 D 서랍수리', date:'2026-03-19', person:'065891f08d3f4f2391ca7219826ead2d', cost:25000, type:'수리'},
  {title:'선릉하우스 정기청소', date:'2026-03-19', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'워너비하우스 정기청소', date:'2026-03-19', person:'7cb0e504323846aba5417b4e16e71228', cost:40000, type:'정기청소'},
  {title:'숙녀하우스 정기청소', date:'2026-03-18', person:'3a58e4686c944178a0b1027ac195fc42', cost:40000, type:'정기청소'},
  {title:'청량하우스 정기청소 + 베란다 청소', date:'2026-03-18', person:'7cb0e504323846aba5417b4e16e71228', cost:70000, type:'정기청소'},
]

const header = ['ID', '날짜', '하우스명', '담당자', '종류', '비용', '메모', '완료여부']

const dataRows = raw.map((r, i) => [
  `worker_${String(i + 1).padStart(4, '0')}`,
  r.date,
  extractHouse(r.title),
  PERSON_MAP[r.person] || r.person,
  r.type,
  r.cost,
  r.title,
  'Y'
])

async function main() {
  console.log(`📊 ${dataRows.length}건 업로드 시작...`)

  await sheets.spreadsheets.values.clear({ spreadsheetId, range: '용역!A2:Z2000' })
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: '용역!A1',
    valueInputOption: 'RAW', requestBody: { values: [header] }
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: '용역!A2',
    valueInputOption: 'RAW', requestBody: { values: dataRows }
  })

  console.log('✅ 완료!')

  const byMonth = {}
  const byPerson = {}
  dataRows.forEach(r => {
    const m = r[1].slice(0, 7)
    byMonth[m] = (byMonth[m] || 0) + 1
    byPerson[r[3]] = (byPerson[r[3]] || 0) + 1
  })
  console.log('\n월별:')
  Object.entries(byMonth).sort().forEach(([m, c]) => console.log(`  ${m}: ${c}건`))
  console.log('\n담당자별:')
  Object.entries(byPerson).sort((a, b) => b[1] - a[1]).forEach(([p, c]) => console.log(`  ${p}: ${c}건`))

  const totalCost = dataRows.reduce((s, r) => s + (Number(r[5]) || 0), 0)
  console.log(`\n총 비용: ${totalCost.toLocaleString()}원`)
}

main().catch(console.error)
