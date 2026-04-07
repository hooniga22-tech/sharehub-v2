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

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '공과금!A1:N1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '공과금ID', '지점ID', '지점명', '연도', '월',
      '전기', '가스', '수도', '인터넷', '정수기',
      '청소', '기타', '합계메모', '입력일'
    ]]
  }
});

console.log('공과금 시트 헤더 세팅 완료');
