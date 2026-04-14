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

// ── 1. 투자지점 탭 생성 (없으면) ──
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const sheetNames = meta.data.sheets.map(s => s.properties.title);

if (!sheetNames.includes('투자지점')) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: '투자지점' } } }] },
  });
  console.log('투자지점 탭 생성 완료');
}

// 헤더 세팅
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '투자지점!A1:H1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [['투자ID', '투자자ID', '투자자명', '지점명', '투자자비율', '유재훈비율', '공동여부', '메모']],
  },
});
console.log('헤더 세팅 완료');

// ── 2. 기존 데이터 확인 (중복 방지) ──
const existing = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '투자지점!A:A',
});
const existingIds = new Set((existing.data.values || []).slice(1).map(r => r[0]));
console.log(`기존 투자지점 데이터: ${existingIds.size}건`);

// ── 3. 데이터 정의 ──
function makeId(invId, house) {
  return `invest_${invId}_${house}`;
}

function rows(invId, name, houses, investorRatio, yooRatio, isJoint = '', memo = '') {
  return houses.map(house => {
    const id = makeId(invId, house);
    return { id, row: [id, invId, name, house, investorRatio, yooRatio, isJoint, memo] };
  });
}

const allRows = [
  // 강연수
  ...rows('inv_001', '강연수', ['워너비', '소녀', '허브', '단짠', '다정', '샤샤', '숙녀', '브루'], 100, 0),
  // 이승민
  ...rows('inv_002', '이승민', ['영동', '삼중', '반포', '이문', '휘경'], 70, 30),
  // 유재훈
  ...rows('inv_003', '유재훈', ['신사', '청량', '광흥', '영영1', '영영2'], 100, 0),
  // 유재훈+강연수 공동
  ...rows('inv_003', '유재훈+강연수', ['낙성', '빠방', '시립', '외대', '신촌', '아현', '상상', '트리', '동지', '동일', '동이', '동삼'], 50, 50, 'Y'),
  // 이효길 - 선릉, 당산
  ...rows('inv_004', '이효길', ['선릉', '당산'], 70, 30),
  // 이효길 - 쌍용
  ...rows('inv_004', '이효길', ['쌍용'], 80, 20),
  // 박성운
  ...rows('inv_005', '박성운', ['대학'], 70, 30),
  // 김태화
  ...rows('inv_006', '김태화', ['샤네'], 75, 25),
  // 박미선
  ...rows('inv_016', '박미선', ['회기'], 80, 20),
  ...rows('inv_016', '박미선', ['동동'], 50, 50),
  // 이현수
  ...rows('inv_011', '이현수', ['와이지'], 85, 15),
  // 전경자
  ...rows('inv_012', '전경자', ['샛별'], 70, 30),
  // 최지연
  ...rows('inv_013', '최지연', ['아리', '한성'], 80, 20),
  // 양성원
  ...rows('inv_014', '양성원', ['영삼', '영이'], 70, 30),
];

// 중복 스킵
const newRows = allRows.filter(r => {
  if (existingIds.has(r.id)) {
    console.log(`  스킵 (이미 존재): ${r.id}`);
    return false;
  }
  return true;
});

if (newRows.length > 0) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '투자지점!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: newRows.map(r => r.row) },
  });
  console.log(`투자지점 ${newRows.length}건 추가 완료`);
} else {
  console.log('추가할 투자지점 없음 (모두 중복)');
}

// ── 4. 박미선 투자자 탭 추가 ──
const investorRes = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '투자자!A:A',
});
const investorIds = new Set((investorRes.data.values || []).slice(1).map(r => r[0]));

if (investorIds.has('inv_016')) {
  console.log('박미선 (inv_016) 이미 존재 - 스킵');
} else {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '투자자!A:G',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['inv_016', '박미선', '', '', '', '', '회기/동동']],
    },
  });
  console.log('투자자 탭에 박미선 (inv_016) 추가 완료');
}

console.log('\n모든 작업 완료');
