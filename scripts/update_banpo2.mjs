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

  function findAndUpdate(nameMatch, house, updates, label) {
    const idx = data.findIndex(r =>
      (r[c('이름')] || '').includes(nameMatch) && (r[c('지점명')] || '') === house
    );
    if (idx === -1) { console.error(`✗ ${label} 못 찾음`); return null; }
    const row = data[idx];
    while (row.length < headers.length) row.push('');
    for (const [k, v] of Object.entries(updates)) {
      if (c(k) >= 0) row[c(k)] = v;
    }
    console.log(`✓ ${label} (row ${idx + 2}): ${Object.entries(updates).map(([k,v])=>`${k}=${v}`).join(', ')}`);
    return { idx, row };
  }

  const mods = [
    findAndUpdate('이새롬', '반포하우스', {
      월세: '410000',
      메모: '1차연장(~26.05.31, 월세 410,000) / 2차연장(26.06.01~27.05.31, 월세 430,000) → 6월 1일부로 월세 430,000으로 변경 예정',
    }, '이새롬'),
    findAndUpdate('이서진', '반포하우스', {
      메모: '단기 입주 3/6~3/30 · 월정산 반영용 퇴실이력',
    }, '이서진'),
  ].filter(Boolean);

  if (mods.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: mods.map(u => ({ range: `입주자!A${u.idx + 2}`, values: [u.row] })),
      },
    });
    console.log(`\n수정 ${mods.length}건 완료`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
