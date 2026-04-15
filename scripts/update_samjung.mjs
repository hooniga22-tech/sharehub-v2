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

  // ========== 입주자 탭 ==========
  const tRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const tAll = tRes.data.values || [];
  const tH = tAll[0];
  const tData = tAll.slice(1);
  console.log('입주자 헤더:', tH);
  const tc = (name) => tH.indexOf(name);

  // --- 작업 1: 수정 5건 ---

  function findAndUpdate(nameMatch, house, updates, label) {
    const idx = tData.findIndex(r => (r[tc('이름')] || '').includes(nameMatch) && r[tc('지점명')] === house);
    if (idx === -1) { console.error(`✗ ${label} 못 찾음`); return null; }
    const row = tData[idx];
    // ensure row has enough columns
    while (row.length < tH.length) row.push('');
    for (const [k, v] of Object.entries(updates)) {
      if (tc(k) >= 0) row[tc(k)] = v;
    }
    console.log(`✓ ${label} (row ${idx + 2}):`, Object.entries(updates).map(([k,v]) => `${k}=${v}`).join(', '));
    return { idx, row };
  }

  const updates = [
    findAndUpdate('김유미나', '삼중하우스', { 입주일: '2026-03-08', 퇴실일: '2026-06-07', 월세: '620000', 보증금: '500000', 관리비: '100000', 연락처: '01089199697', 메모: '계약일 2026-02-13' }, '김유미나'),
    findAndUpdate('Gregoratti Greta', '삼중하우스', { 입주일: '2026-02-28', 퇴실일: '2026-10-24', 월세: '550000', 연락처: '3285965979', 메모: '앤코 플랫폼 · Greta.Gregoratti@gmail.com · ST95C35AC4D7' }, 'Gregoratti Greta'),
    findAndUpdate('Dafne Carolina', '삼중하우스', { 입주일: '2026-03-15' }, 'Dafne Carolina'),
    findAndUpdate('차지수', '삼중하우스', { 입주일: '2026-03-21', 월세: '570000' }, '차지수'),
    findAndUpdate('나선일', '삼중하우스', { 입주일: '2026-04-04', 월세: '420000' }, '나선일'),
  ].filter(Boolean);

  // batch update
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates.map(u => ({ range: `입주자!A${u.idx + 2}`, values: [u.row] })),
      },
    });
    console.log(`\n입주자 수정 ${updates.length}건 완료`);
  }

  // Gregoratti Greta의 입주자ID 저장
  const gretaIdx = tData.findIndex(r => (r[tc('이름')] || '').includes('Gregoratti Greta') && r[tc('지점명')] === '삼중하우스');
  const gretaId = gretaIdx >= 0 ? tData[gretaIdx][tc('입주자ID')] : '';
  console.log('Gregoratti Greta ID:', gretaId);

  // --- 작업 2: 퇴실이력 3건 추가 ---
  let maxNum = 0;
  for (const r of tData) {
    const m = (r[tc('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  console.log(`\n기존 최대 tenant ID: ${maxNum}`);

  function makeRow(id, fields) {
    const row = new Array(tH.length).fill('');
    row[tc('입주자ID')] = id;
    for (const [k, v] of Object.entries(fields)) {
      if (tc(k) >= 0) row[tc(k)] = v;
    }
    return row;
  }

  const newTenants = [
    makeRow(`tenant_${String(maxNum + 1).padStart(3, '0')}`, {
      구: '강남구', 지점명: '삼중하우스', 방코드: 'D-1 주방 옆 문쪽', 방타입: '2인실',
      이름: '신한나', 퇴실일: '2026-01-31', 상태: '퇴실완료',
      보증금: '2000000', 월세: '470000', 관리비: '100000', 메모: '2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 2).padStart(3, '0')}`, {
      구: '강남구', 지점명: '삼중하우스', 방코드: 'B-1 거실 오른쪽', 방타입: '1인실',
      이름: 'MOSSISA AYANTU TESHOME', 퇴실일: '2026-02-28', 상태: '퇴실완료',
      보증금: '2000000', 월세: '620000', 관리비: '150000', 메모: '2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 3).padStart(3, '0')}`, {
      구: '강남구', 지점명: '삼중하우스', 방코드: 'E-1 입구방 오른쪽', 방타입: '2인실',
      이름: '허나겸', 퇴실일: '2026-03-22', 상태: '퇴실완료',
      보증금: '2000000', 월세: '420000', 관리비: '150000', 메모: '2026년 이전 입주, 퇴실완료',
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: newTenants },
  });
  for (const r of newTenants) console.log(`✓ 추가: ${r[tc('입주자ID')]} ${r[tc('이름')]}`);

  // ========== 수납 탭 ==========
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const sAll = sRes.data.values || [];
  const sH = sAll[0];
  console.log('\n수납 헤더:', sH);
  const sc = (name) => sH.indexOf(name);

  // 수납ID 최대값
  let maxSnum = 0;
  for (const r of sAll.slice(1)) {
    const m = (r[sc('수납ID')] || '').match(/pay_(\d+)/);
    if (m) maxSnum = Math.max(maxSnum, parseInt(m[1]));
  }
  console.log('기존 최대 수납ID:', maxSnum);

  function makePayRow(id, fields) {
    const row = new Array(sH.length).fill('');
    row[sc('수납ID')] = id;
    for (const [k, v] of Object.entries(fields)) {
      if (sc(k) >= 0) row[sc(k)] = v;
    }
    return row;
  }

  const payRows = [
    makePayRow(`pay_${String(maxSnum + 1).padStart(3, '0')}`, {
      입주자ID: gretaId, 지점명: '삼중하우스', 방코드: 'D-2 주방 옆 안쪽', 이름: 'Gregoratti Greta',
      연월: '2026-02', 청구액: '550000', 납부액: '650000', 납부일: '2026-01-13',
      상태: '납부완료', 납부방법: '앤코플랫폼', 메모: '1/7 일괄계약 첫회차',
    }),
    makePayRow(`pay_${String(maxSnum + 2).padStart(3, '0')}`, {
      입주자ID: gretaId, 지점명: '삼중하우스', 방코드: 'D-2 주방 옆 안쪽', 이름: 'Gregoratti Greta',
      연월: '2026-03', 청구액: '550000', 납부액: '650000', 납부일: '2026-03-01',
      상태: '납부완료', 납부방법: '앤코플랫폼', 메모: '2/7',
    }),
    makePayRow(`pay_${String(maxSnum + 3).padStart(3, '0')}`, {
      입주자ID: gretaId, 지점명: '삼중하우스', 방코드: 'D-2 주방 옆 안쪽', 이름: 'Gregoratti Greta',
      연월: '2026-04', 청구액: '550000', 납부액: '650000', 납부일: '2026-03-30',
      상태: '납부완료', 납부방법: '앤코플랫폼', 메모: '3/7',
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '수납!A:Z', valueInputOption: 'RAW',
    requestBody: { values: payRows },
  });
  for (const r of payRows) console.log(`✓ 수납 추가: ${r[sc('수납ID')]} ${r[sc('연월')]} ${r[sc('메모')]}`);

  console.log('\n모든 작업 완료!');
}

main().catch(e => { console.error(e); process.exit(1); });
