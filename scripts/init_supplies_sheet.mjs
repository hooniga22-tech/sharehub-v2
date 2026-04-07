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

// 시트가 없으면 생성
try {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        addSheet: { properties: { title: '비품신청' } }
      }]
    }
  });
  console.log('비품신청 시트 생성 완료');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('비품신청 시트가 이미 존재합니다');
  } else {
    throw e;
  }
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '비품신청!A1:J1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '신청ID', '입주자ID', '입주자명', '지점명', '방코드',
      '신청항목', '수량', '요청사항', '상태', '신청일'
    ]]
  }
});

console.log('✅ 비품신청 시트 헤더 완료');
