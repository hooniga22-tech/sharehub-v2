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

const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const sheetNames = meta.data.sheets?.map(s => s.properties?.title) || [];

if (!sheetNames.includes('용역담당자')) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: '용역담당자' } } }] }
  });
  console.log('용역담당자 시트 생성');
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '용역담당자!A1:H1',
  valueInputOption: 'RAW',
  requestBody: { values: [['담당자ID', '이름', '연락처', '계좌번호', '분야', '구분', '토큰', '기본금액']] }
});

// 용역 시트에서 담당자 추출 (row[1] = 담당자명)
const workerRows = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID, range: '용역!A2:Z'
});
const rows = workerRows.data.values || [];
const names = [...new Set(rows.map(r => r[1]?.trim()).filter(Boolean))];
console.log('발견된 담당자:', names);

const existing = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID, range: '용역담당자!A2:H'
});
const existingNames = (existing.data.values || []).map(r => r[1]);

for (const name of names) {
  if (existingNames.includes(name)) {
    const row = (existing.data.values || []).find(r => r[1] === name);
    console.log(`⏭  ${name}: 이미 존재 (토큰: ${row?.[6]})`);
    continue;
  }
  const id = `wk_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const token = crypto.randomBytes(8).toString('hex');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: [[id, name, '', '', '청소', '정규', token, '55000']] }
  });
  console.log(`✅ ${name} 토큰: ${token}`);
  console.log(`   URL: https://sharehub-v2.vercel.app/worker/${token}`);
  await new Promise(r => setTimeout(r, 100));
}

// 내부 운영진도 추가
for (const name of ['유재훈']) {
  if (existingNames.includes(name)) continue;
  const id = `wk_${Date.now()}_mgr`;
  const token = crypto.randomBytes(8).toString('hex');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '용역담당자!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: [[id, name, '', '', '운영', '내부', token, '0']] }
  });
  console.log(`✅ ${name} (운영) 토큰: ${token}`);
}

console.log('\n완료!');
