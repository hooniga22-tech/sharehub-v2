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

const RENT_MAP = {
  '워너비': 950000, '영동': 1500000, '삼중': 2900000,
  '반포': 2800000, '신사': 2350000, '선릉': 1300000,
  '대학': 850000, '샤네': 850000, '낙성': 1100000,
  '쌍용': 1600000, '이문': 950000, '빠방': 900000,
  '청량': 1800000, '휘경': 900000, '회기': 1050000,
  '시립': 700000, '외대': 1200000, '광흥': 1900000,
  '와이지': 0, '샛별': 1100000, '신촌': 1300000,
  '아현': 700000, '소녀': 870000, '허브': 950000,
  '단짠': 800000, '다정': 700000, '아리': 0,
  '한성': 0, '상상': 1050000, '샤샤': 1020000,
  '브루': 900000, '영삼': 750000, '영이': 750000,
  '영영1': 800000, '영영2': 600000, '트리': 782000,
  '당산': 1000000, '숙녀': 910000,
  '동동': 1000000, '동지': 1000000, '동일': 1000000,
  '동이': 1000000, '동삼': 1000000,
};

const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '지점!A:N',
});
const rows = res.data.values || [];
const updates = [];

for (let i = 1; i < rows.length; i++) {
  const name = rows[i][1]?.trim();
  if (RENT_MAP[name] !== undefined) {
    updates.push({ range: `지점!H${i + 1}`, values: [[RENT_MAP[name]]] });
    console.log(`${name}: ${RENT_MAP[name].toLocaleString()}원`);
  } else {
    console.log(`[미등록] ${name}`);
  }
}

if (updates.length > 0) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: updates },
  });
}
console.log(`\n총 ${updates.length}개 지점 업데이트 완료`);
