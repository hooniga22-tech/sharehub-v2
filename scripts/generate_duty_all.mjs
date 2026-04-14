import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

async function getSheetData(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values || []).slice(1);
}

async function appendRows(sheetName, rows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

// ── 메인 로직 ──

console.log('데이터 로드 중...');
const [tenantRows, workerRows, dutyRows] = await Promise.all([
  getSheetData('입주자'),
  getSheetData('용역'),
  getSheetData('당번'),
]);

// 기존 당번ID 세트 (중복 방지)
const existingIds = new Set(dutyRows.map(r => r[0]).filter(Boolean));
console.log(`기존 당번 ${existingIds.size}건`);

// 지점명 목록 추출
const houseNames = [...new Set(tenantRows.map(r => r[2]).filter(Boolean))].sort();
console.log(`지점 ${houseNames.length}개\n`);

// 이번주 월요일 계산
const today = new Date();
const dow = today.getDay();
const monday = new Date(today);
monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
monday.setHours(0, 0, 0, 0);

const WEEKS_AHEAD = 8;
const allRows = [];
const summary = {};

for (const house of houseNames) {
  const tenants = tenantRows
    .filter(r => r[2] === house && (r[8] === '입주중' || r[8] === '계약중'))
    .sort((a, b) => (a[3] || '').localeCompare(b[3] || '', 'ko'));

  if (tenants.length === 0) {
    summary[house] = 0;
    continue;
  }

  const cleanDates = workerRows
    .filter(r => r[2] === house && (r[4] || '').includes('청소'))
    .map(r => r[1] || '');

  let tenantIdx = 0;
  let created = 0;

  for (let w = 0; w < WEEKS_AHEAD; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + w * 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const dutyId = `duty_${house}_${weekStartStr}`;

    if (existingIds.has(dutyId)) continue;

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const isCleaningWeek = cleanDates.some(d => {
      const date = new Date(d);
      return date >= weekStart && date <= weekEnd;
    });

    let row;
    if (isCleaningWeek) {
      row = [dutyId, house, weekStartStr, '', '', '청소주', '스킵', '', '', 'N', '', ''];
    } else {
      const t = tenants[tenantIdx % tenants.length];
      row = [dutyId, house, weekStartStr, t[3] || '', t[5] || '', '당번', '미완료', '', '', 'N', '', ''];
      tenantIdx++;
    }

    allRows.push(row);
    existingIds.add(dutyId);
    created++;
  }

  summary[house] = created;
}

// 배치로 한 번에 저장 (rate limit 회피)
if (allRows.length > 0) {
  console.log(`총 ${allRows.length}건 일괄 저장 중...`);
  await appendRows('당번', allRows);
  console.log('저장 완료!\n');
} else {
  console.log('새로 생성할 당번이 없습니다.\n');
}

// 결과 출력
for (const [house, count] of Object.entries(summary)) {
  if (count > 0) console.log(`  ${house}: ${count}건`);
}

const totalCreated = allRows.length;
console.log(`\n=== 완료: ${houseNames.length}개 지점, ${totalCreated}건 생성 ===`);

const skipped = Object.entries(summary).filter(([, c]) => c === 0).map(([h]) => h);
if (skipped.length > 0) {
  console.log(`건너뜀: ${skipped.join(', ')}`);
}
