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

const normalize = (name) => name.replace(/하우스$/, '').trim().toLowerCase();

const RENT_DATA = {
  '워너비': 950000, '영동': 1500000, '삼중': 2900000, '반포': 2800000,
  '신사': 2350000, '선릉': 1300000, '대학': 850000, '샤네': 850000,
  '낙성': 1100000, '쌍용': 1600000, '이문': 950000, '빠방': 900000,
  '청량': 1800000, '휘경': 900000, '회기': 1050000, '시립': 700000,
  '외대': 1200000, '광흥': 1900000, '와이지': 0, '샛별': 1100000,
  '신촌': 1300000, '아현': 700000, '소녀': 870000, '허브': 950000,
  '단짠': 800000, '다정': 700000, '아리': 0, '한성': 0,
  '상상': 1050000, '샤샤': 1020000, '브루': 900000, '영삼': 750000,
  '영이': 750000, '영영1': 800000, '영영2': 600000, '트리': 782000,
  '당산': 1000000, '숙녀': 910000, '동지': 1000000, '동일': 1000000,
  '동이': 1000000, '동삼': 1000000, '동동': 1000000,
};

// normalize key map
const rentByKey = new Map();
for (const [name, rent] of Object.entries(RENT_DATA)) {
  rentByKey.set(normalize(name), rent);
}

const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

// 지점 탭 헤더 포함 읽기
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '지점!A1:Z',
});
const rows = res.data.values || [];
const headers = rows[0] || [];

console.log('헤더:', headers.join(', '));

// 지점명 컬럼 인덱스 찾기
const nameIdx = headers.findIndex(h => h === '지점명');
if (nameIdx === -1) { console.error('지점명 컬럼을 찾을 수 없습니다'); process.exit(1); }

// 집월세 컬럼 인덱스 찾기
let rentIdx = headers.findIndex(h => h === '집월세');
if (rentIdx === -1) {
  // 마지막 컬럼 다음에 추가
  rentIdx = headers.length;
  const col = String.fromCharCode(65 + rentIdx); // A=65
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `지점!${col}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['집월세']] },
  });
  console.log(`집월세 컬럼 추가 (${col}열)`);
}

const rentCol = String.fromCharCode(65 + rentIdx);
console.log(`지점명: ${nameIdx}번째, 집월세: ${rentIdx}번째 (${rentCol}열)\n`);

let updated = 0;
let notFound = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const houseName = r[nameIdx] || '';
  const key = normalize(houseName);

  if (!rentByKey.has(key)) {
    notFound.push(houseName);
    continue;
  }

  const rent = rentByKey.get(key);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `지점!${rentCol}${i + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[rent]] },
  });

  console.log(`  ${houseName} → ${rent.toLocaleString()}원`);
  updated++;
}

console.log(`\n완료: ${updated}건 업데이트`);
if (notFound.length) {
  console.log(`매칭 안됨: ${notFound.join(', ')}`);
}
