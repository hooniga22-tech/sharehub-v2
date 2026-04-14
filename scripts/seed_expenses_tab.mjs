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

// 탭 존재 확인
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const exists = meta.data.sheets?.some(s => s.properties?.title === '운영지출');

if (exists) {
  console.log('운영지출 탭이 이미 존재합니다. 스킵합니다.');
  process.exit(0);
}

// 탭 생성
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: {
    requests: [{
      addSheet: { properties: { title: '운영지출' } },
    }],
  },
});

// 헤더 추가
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '운영지출!A1:G1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [['지출ID', '날짜', '유형', '지점명', '카테고리', '금액', '메모']],
  },
});

console.log('운영지출 탭 생성 완료 (헤더: 지출ID, 날짜, 유형, 지점명, 카테고리, 금액, 메모)');
