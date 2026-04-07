import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const CONSIGNMENT = ['와이지', '아리', '한성'];

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

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '지점!A:N',
});
const rows = res.data.values || [];

const updates = [];
for (let i = 1; i < rows.length; i++) {
  const name = rows[i][1]?.trim();
  if (CONSIGNMENT.includes(name)) {
    updates.push({ range: `지점!M${i + 1}`, values: [['위탁운영']] });
    console.log(`${name} → 위탁운영 표시`);
  }
}

if (updates.length > 0) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: updates },
  });
}
console.log('완료');
