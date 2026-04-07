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

// 시트 생성
try {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: '납부' } } }]
    }
  });
  console.log('납부 시트 생성 완료');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('납부 시트가 이미 존재합니다');
  } else {
    throw e;
  }
}

// 헤더: 납부ID, 입주자ID, 입주자명, 지점명, 방코드, 납부타입, 납부예정일, 월세금액, 관리비금액, 월세완납, 관리비완납, 메모
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '납부!A1:L1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '납부ID', '입주자ID', '입주자명', '지점명', '방코드',
      '납부타입', '납부예정일', '월세금액', '관리비금액',
      '월세완납', '관리비완납', '메모'
    ]]
  }
});

console.log('✅ 납부 시트 헤더 세팅 완료');
