import { google } from 'googleapis';
import dotenv from 'dotenv';
import crypto from 'crypto';
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

const workers = [
  { name: '이인실', phone: '010-3285-3277', account: '농협 100120-56-185140', field: '청소', type: '정규' },
  { name: '이미경', phone: '010-6861-0923', account: '국민 830210128041', field: '청소', type: '정규' },
  { name: '이한나', phone: '010-3566-9257', account: '카카오뱅크 이한나 3333041198645', field: '청소', type: '정규' },
  { name: '진진수', phone: '010-2433-6613', account: '국민 460210664883', field: '수리', type: '정규' },
  { name: '김기진', phone: '010-2930-9801', account: '케이 100197580163', field: '수리', type: '정규' },
];

const existing = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID, range: '용역담당자!A2:H'
});
const existingRows = existing.data.values || [];
const existingNames = existingRows.map(r => r[1]);

for (const w of workers) {
  if (existingNames.includes(w.name)) {
    const idx = existingNames.indexOf(w.name);
    const row = existingRows[idx];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `용역담당자!A${idx + 2}:H${idx + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[
        row[0], w.name, w.phone, w.account,
        w.field, w.type, row[6] || crypto.randomBytes(8).toString('hex'),
        row[7] || '50000'
      ]] }
    });
    console.log(`✅ ${w.name} 업데이트 (토큰: ${row[6]})`);
  } else {
    const id = `worker_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const token = crypto.randomBytes(8).toString('hex');
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [[id, w.name, w.phone, w.account, w.field, w.type, token, '50000']] }
    });
    console.log(`✅ ${w.name} 신규 등록 (토큰: ${token})`);
    console.log(`   URL: https://sharehub-v2.vercel.app/worker/${token}`);
    await new Promise(r => setTimeout(r, 100));
  }
}
console.log('✅ 담당자 정보 완료');
