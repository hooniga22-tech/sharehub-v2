import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const data = JSON.parse(fs.readFileSync('./scripts/parsed_data.json', 'utf-8'));

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function clearAndWrite(sheets, sheetName, rows) {
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${sheetName}!A2:Z` });
  if (!rows.length) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
  console.log(`${sheetName}: ${rows.length}행 완료`);
}

const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

await clearAndWrite(sheets, '지점', data.houses);
await clearAndWrite(sheets, '방', data.rooms);
await clearAndWrite(sheets, '입주자', data.tenants);

console.log('\nGoogle Sheets 업로드 완료!');
