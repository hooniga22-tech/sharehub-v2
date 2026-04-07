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
const existing = meta.data.sheets?.map(s => s.properties?.title) || [];

const newSheets = [
  { name: '방청소신청', headers: ['신청ID','이름','연락처','지점명','방타입','청소날짜','요청사항','상태','신청일'] },
  { name: '에어컨신청', headers: ['신청ID','이름','연락처','지점명','방코드','방타입','에어컨위치','요청사항','입금여부','상태','신청일'] },
  { name: '퇴실신청', headers: ['신청ID','이름','연락처','지점명','방코드','퇴실예정일','환불계좌','퇴실사유','메모','상태','신청일'] },
];

for (const s of newSheets) {
  if (!existing.includes(s.name)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: s.name } } }] }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${s.name}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [s.headers] }
  });
  console.log(`✅ ${s.name} 완료`);
}
