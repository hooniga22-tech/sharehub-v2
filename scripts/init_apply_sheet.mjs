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

if (!sheetNames.includes('투어신청')) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: '투어신청' } } }] }
  });
  console.log('투어신청 시트 생성');
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '투어신청!A1:O1',
  valueInputOption: 'RAW',
  requestBody: { values: [[
    '신청ID', '이름', '연락처', '성별', '희망지역', '희망하우스',
    '방타입', '희망입주일', '계약기간', '투어날짜', '투어시간',
    '추가문의', '투어비입금', '상태', '신청일'
  ]] }
});

console.log('✅ 투어신청 시트 헤더 완료');
