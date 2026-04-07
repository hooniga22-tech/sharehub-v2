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
const exists = meta.data.sheets?.some(s => s.properties?.title === '운영지출');

if (!exists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: '운영지출' } } }]
    }
  });
  console.log('운영지출 시트 생성됨');
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '운영지출!A1:J1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '지출ID', '지점명', '카테고리', '내용', '금액',
      '담당자', '날짜', '연도', '월', '메모'
    ]]
  }
});

console.log('✅ 운영지출 시트 헤더 완료');
