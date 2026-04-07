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

const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const sheetNames = meta.data.sheets?.map(s => s.properties?.title) || [];

for (const name of ['당번', '당번교환']) {
  if (!sheetNames.includes(name)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] }
    });
    console.log(`${name} 시트 생성`);
  }
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '당번!A1:K1',
  valueInputOption: 'RAW',
  requestBody: { values: [[
    '당번ID', '지점명', '입주자ID', '입주자명', '방코드',
    '주차시작일', '주차종료일', '완료여부', '완료일', '벌금여부', '비고'
  ]] }
});

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '당번교환!A1:J1',
  valueInputOption: 'RAW',
  requestBody: { values: [[
    '교환ID', '지점명', '신청자ID', '신청자명', '신청주차시작',
    '상대자ID', '상대자명', '상대주차시작', '상태', '등록일'
  ]] }
});

console.log('✅ 당번 시트 헤더 완료');
