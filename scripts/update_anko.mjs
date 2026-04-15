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
  function findAndUpdate(nameMatch, houseMatch, updates, label) {
    const idx = data.findIndex(r =>
      (r[c('이름')] || '').includes(nameMatch) &&
      (r[c('지점명')] || '').includes(houseMatch)
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
    findAndUpdate('Riya Mehra', '숙녀하우스', { 관리비: '100000' }, 'Riya Mehra'),
    findAndUpdate('Gregoratti', '삼중하우스', { 관리비: '100000' }, 'Gregoratti'),
    findAndUpdate('Henneken', '영동하우스', { 월세: '700000', 관리비: '100000' }, 'Henneken'),
    findAndUpdate('Nguyen', '신사하우스', { 관리비: '100000' }, 'Nguyen'),
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

  // --- 작업 2: 신규 추가 4건 ---
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
      구: '강남구', 지점명: '선릉하우스', 방코드: 'B-1 1인실', 방타입: '1인실',
      이름: 'Anamaria Diana Lupascu', 퇴실일: '2026-01-10', 상태: '퇴실완료',
      보증금: '0', 관리비: '100000', 연락처: 'anamarialupascu2004@gmail.com',
      메모: '앤코 플랫폼 · ST02CE266291 · 2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 2).padStart(3, '0')}`, {
      구: '강남구', 지점명: '반포하우스', 방코드: 'D-1 거실 가벽', 방타입: '1인실',
      이름: 'Adia Arthur', 퇴실일: '2026-01-10', 상태: '퇴실완료',
      보증금: '0', 관리비: '100000', 연락처: 'adiaarthur@gmail.com',
      메모: '앤코 플랫폼 · STD1B6699466 · 2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 3).padStart(3, '0')}`, {
      구: '강남구', 지점명: '반포하우스', 방코드: 'E-1 거실화 왼', 방타입: '2인실',
      이름: 'Elisabeth Frieda Margarete Fuchs', 퇴실일: '2026-03-01', 상태: '퇴실완료',
      보증금: '0', 월세: '550000', 관리비: '100000', 연락처: 'lissifuchs@mail.de',
      메모: '앤코 플랫폼 · ST3D932AE00F · 2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 4).padStart(3, '0')}`, {
      구: '강남구', 지점명: '반포하우스', 방코드: 'H-1 2인실 입구오 오른쪽', 방타입: '2인실',
      이름: 'Anne Marlene Soergel', 퇴실일: '2026-03-01', 상태: '퇴실완료',
      보증금: '0', 월세: '550000', 관리비: '100000', 연락처: 'anne.soergel@gmx.net',
      메모: '앤코 플랫폼 · STE098000C81 · 2026년 이전 입주, 퇴실완료',
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: newRows },
  });
  for (const r of newRows) console.log(`✓ 추가: ${r[c('입주자ID')]} ${r[c('이름')]} (${r[c('지점명')]})`);

  console.log('\n모든 작업 완료!');
}

main().catch(e => { console.error(e); process.exit(1); });
