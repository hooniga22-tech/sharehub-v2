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
  console.log('헤더:', headers);
  const c = (name) => headers.indexOf(name);

  // --- 작업 1: 수정 4건 ---
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
    findAndUpdate('장원영', '반포하우스', { 입주일: '2025-11-09', 퇴실일: '2026-05-15', 월세: '420000', 관리비: '100000', 연락처: '01025024559' }, '장원영'),
    findAndUpdate('정세아', '반포하우스', { 입주일: '2026-02-26', 퇴실일: '2027-02-25', 월세: '420000', 관리비: '100000', 연락처: '01027235526' }, '정세아'),
    findAndUpdate('김여원', '반포하우스', { 입주일: '2026-01-10', 퇴실일: '2026-07-09', 월세: '550000', 관리비: '100000', 연락처: '01020521872' }, '김여원'),
    findAndUpdate('이새롬', '반포하우스', { 퇴실일: '2027-05-31', 월세: '410000', 관리비: '100000', 연락처: '01020502037', 메모: '1차연장(~26.05.31, 월세410,000) / 2차연장(26.06.01~27.05.31, 월세430,000)' }, '이새롬'),
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

  // --- 작업 2: 신규 추가 2건 ---
  let maxNum = 0;
  for (const r of data) {
    const m = (r[c('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  console.log(`\n기존 최대 tenant ID: ${maxNum}`);

  function makeRow(id, fields) {
    const row = new Array(headers.length).fill('');
    row[c('입주자ID')] = id;
    for (const [k, v] of Object.entries(fields)) {
      if (c(k) >= 0) row[c(k)] = v;
    }
    return row;
  }

  const newRows = [
    makeRow(`tenant_${String(maxNum + 1).padStart(3, '0')}`, {
      구: '강남구', 지점명: '반포하우스', 방코드: 'E-1 거실화 왼', 방타입: '2인실',
      이름: '남현진', 입주일: '2026-04-26', 퇴실일: '2027-04-30', 상태: '입주중',
      보증금: '2000000', 월세: '430000', 관리비: '100000', 연락처: '01098160912',
      메모: '할인 50,000 적용',
    }),
    makeRow(`tenant_${String(maxNum + 2).padStart(3, '0')}`, {
      구: '강남구', 지점명: '반포하우스', 방코드: 'E-1 거실화 왼', 방타입: '2인실',
      이름: '이서진', 입주일: '2026-03-06', 퇴실일: '2026-03-30', 상태: '퇴실완료',
      관리비: '100000', 메모: '단기 입주 3/6~3/30, 계약서 없음',
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: newRows },
  });
  for (const r of newRows) console.log(`✓ 추가: ${r[c('입주자ID')]} ${r[c('이름')]}`);

  console.log('\n모든 작업 완료!');
}

main().catch(e => { console.error(e); process.exit(1); });
