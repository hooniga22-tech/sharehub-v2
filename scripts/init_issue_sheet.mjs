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

// Check current headers
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '이슈!A1:L1',
});

const current = res.data.values?.[0] || [];
console.log('현재 헤더:', current);

const HEADERS = ['이슈ID', '지점명', '방코드', '제목', '내용', '카테고리', '상태', '담당자', '등록일', '완료일', '처리비용', '메모'];

if (current.length === 0 || current[0] !== HEADERS[0]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: '이슈!A1:L1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
  console.log('헤더 설정 완료:', HEADERS);
} else {
  console.log('헤더가 이미 존재합니다');
}
