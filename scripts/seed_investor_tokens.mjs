import { google } from 'googleapis';
import { randomUUID } from 'crypto';
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

// 투자자 탭 읽기 (헤더 포함)
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '투자자!A:G',
});
const rows = res.data.values || [];
// [0]투자자ID [1]투자자명 [2]연락처 [3]계좌정보 [4]생년월일 [5]링크토큰 [6]메모

console.log(`투자자 ${rows.length - 1}명 확인\n`);

let updated = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const name = r[1] || '';
  const existingToken = r[5] || '';

  if (existingToken) {
    console.log(`  [스킵] ${name} → ${existingToken}`);
    continue;
  }

  const newToken = randomUUID().slice(0, 16);

  // 행 전체를 업데이트 (시트 행 번호 = i + 1)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `투자자!F${i + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newToken]] },
  });

  console.log(`  [생성] ${name} → ${newToken}`);
  updated++;
}

console.log(`\n완료: ${updated}건 토큰 생성\n`);

// 최종 목록 출력
const finalRes = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '투자자!A:G',
});
const finalRows = finalRes.data.values || [];
console.log('=== 투자자 토큰 목록 ===');
for (let i = 1; i < finalRows.length; i++) {
  const r = finalRows[i];
  console.log(`  ${r[1] || '?'} → ${r[5] || '(없음)'}`);
}
