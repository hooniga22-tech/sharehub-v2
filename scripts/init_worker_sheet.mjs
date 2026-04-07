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

// 현재 용역 시트 헤더 확인
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '용역!A1:K1',
});

const existing = res.data.values?.[0] || [];
console.log('현재 헤더:', existing);

// 헤더가 없거나 다르면 세팅
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '용역!A1:K1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '용역ID', '담당자명', '지점명', '작업종류',
      '예정일', '완료여부', '정산금액', '이슈ID', '메모', '링크토큰', '등록일'
    ]]
  }
});

console.log('✅ 용역 시트 헤더 세팅 완료');
