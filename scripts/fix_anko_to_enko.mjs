import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = '1stlFQStThdaw-si05ICOhJ5phfvWyCS0RHjeNh08TY8';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const allRows = res.data.values || [];
  const headers = allRows[0];
  const data = allRows.slice(1);
  const c = (name) => headers.indexOf(name);
  const nameIdx = c('이름');

  const updates = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const name = row[nameIdx] || '';
    if (name.includes('(앤코)')) {
      const newName = name.replace(/\(앤코\)/g, '(엔코)');
      console.log(`${name} → ${newName}`);
      row[nameIdx] = newName;
      while (row.length < headers.length) row.push('');
      updates.push({ range: `입주자!A${i + 2}`, values: [row] });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    });
  }

  console.log(`\n수정 완료: ${updates.length}건`);
}

main().catch(e => { console.error(e); process.exit(1); });
