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

function rand8() {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // ========== 작업 1: 입주자 ==========
  console.log('=== 작업 1: 낙성하우스 입주자 등록 ===');
  const tRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const tAll = tRes.data.values || [];
  const tH = tAll[0];
  const tData = tAll.slice(1);
  const tc = (n) => tH.indexOf(n);

  let maxT = 0;
  for (const r of tData) {
    const m = (r[tc('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxT = Math.max(maxT, parseInt(m[1]));
  }
  console.log('기존 최대 tenant ID:', maxT);

  let tn = maxT;
  function mkT(fields) {
    const row = new Array(tH.length).fill('');
    row[tc('입주자ID')] = `tenant_${String(++tn).padStart(3, '0')}`;
    row[tc('구')] = '관악구';
    row[tc('지점명')] = '낙성하우스';
    row[tc('보증금')] = '0';
    row[tc('링크토큰')] = `tenant_${rand8()}`;
    for (const [k, v] of Object.entries(fields)) { if (tc(k) >= 0) row[tc(k)] = v; }
    return row;
  }

  const tenants = [
    // 입주중 5명
    mkT({ 방코드: 'A-1', 방타입: '1인실', 이름: '김위', 입주일: '2026-02-22', 상태: '입주중', 월세: '550000', 관리비: '100000' }),
    mkT({ 방코드: 'B-1', 방타입: '1인실', 이름: '여민서', 입주일: '2026-02-23', 상태: '입주중', 월세: '450000', 관리비: '100000' }),
    mkT({ 방코드: 'B-2', 방타입: '1인실', 이름: 'Sofiia Futuima', 입주일: '2025-01-01', 상태: '입주중', 월세: '420000', 관리비: '100000' }),
    mkT({ 방코드: 'C-1', 방타입: '1인실', 이름: '강수민', 입주일: '2025-01-01', 상태: '입주중', 월세: '400000', 관리비: '100000', 메모: '3월 이전 월세 420000' }),
    mkT({ 방코드: 'C-2', 방타입: '1인실', 이름: '이다현', 입주일: '2026-02-24', 상태: '입주중', 월세: '420000', 관리비: '100000' }),
    // 퇴실 2명
    mkT({ 방코드: 'A-1', 방타입: '1인실', 이름: '김민재', 입주일: '2024-02-23', 퇴실일: '2026-02-22', 상태: '퇴실완료', 월세: '420000', 관리비: '100000', 메모: '대학생할인' }),
    mkT({ 방코드: 'C-2', 방타입: '1인실', 이름: '오은지', 입주일: '2025-02-24', 퇴실일: '2026-02-23', 상태: '퇴실완료', 월세: '390000', 관리비: '100000' }),
    // 계약취소 1명
    mkT({ 방코드: 'A-1', 방타입: '1인실', 이름: '(앤코)Shekerova Vasilena', 상태: '계약취소', 월세: '0', 관리비: '0', 메모: '계약취소 위약금 813737' }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: tenants },
  });

  const idMap = {};
  for (const r of tenants) {
    idMap[r[tc('이름')]] = r[tc('입주자ID')];
    console.log(`✓ ${r[tc('입주자ID')]} ${r[tc('이름')]} [${r[tc('방코드')]}] ${r[tc('상태')]}`);
  }

  // ========== 작업 2: 수납 ==========
  console.log('\n=== 작업 2: 수납 22건 등록 ===');
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const sAll = sRes.data.values || [];
  const sH = sAll[0];
  const sc = (n) => sH.indexOf(n);

  let maxP = 0;
  for (const r of sAll.slice(1)) {
    const m = (r[sc('수납ID')] || '').match(/pay_(\d+)/);
    if (m) maxP = Math.max(maxP, parseInt(m[1]));
  }
  console.log('기존 최대 수납ID:', maxP);

  let pn = maxP;
  function pay(name, room, month, amount, memo) {
    const tid = idMap[name];
    if (!tid) { console.error(`✗ ID 못 찾음: ${name}`); return null; }
    const row = new Array(sH.length).fill('');
    row[sc('수납ID')] = `pay_${String(++pn).padStart(3, '0')}`;
    row[sc('입주자ID')] = tid;
    row[sc('지점명')] = '낙성하우스';
    row[sc('방코드')] = room;
    row[sc('이름')] = name;
    row[sc('연월')] = month;
    row[sc('청구액')] = String(amount);
    row[sc('납부액')] = String(amount);
    row[sc('상태')] = '납부완료';
    row[sc('메모')] = memo;
    return row;
  }

  const payments = [
    // 1월
    pay('김민재', 'A-1', '2026-01', 520000, '월세420000+관리비100000'),
    pay('Sofiia Futuima', 'B-2', '2026-01', 520000, '월세420000+관리비100000'),
    pay('강수민', 'C-1', '2026-01', 520000, '월세420000+관리비100000'),
    pay('오은지', 'C-2', '2026-01', 490000, '월세390000+관리비100000'),
    // 2월
    pay('김민재', 'A-1', '2026-02', 408572, '월세330000+관리비78572(2/22퇴실일할)'),
    pay('김위', 'A-1', '2026-02', 162500, '월세137500+관리비25000(2/22입주일할)'),
    pay('(앤코)Shekerova Vasilena', 'A-1', '2026-02', 813737, '계약취소위약금(임대료715338+관리비98399)'),
    pay('여민서', 'B-1', '2026-02', 117858, '월세96429+관리비21429(2/23입주일할)'),
    pay('Sofiia Futuima', 'B-2', '2026-02', 320000, '월세220000+관리비100000(겨울방학할인)'),
    pay('강수민', 'C-1', '2026-02', 520000, '월세420000+관리비100000'),
    pay('오은지', 'C-2', '2026-02', 370858, '월세295004+관리비75854(2/23퇴실일할)'),
    pay('이다현', 'C-2', '2026-02', 92857, '월세75000+관리비17857(2/24입주일할)'),
    // 3월
    pay('김위', 'A-1', '2026-03', 650000, '월세550000+관리비100000'),
    pay('여민서', 'B-1', '2026-03', 550000, '월세450000+관리비100000'),
    pay('Sofiia Futuima', 'B-2', '2026-03', 520000, '월세420000+관리비100000'),
    pay('강수민', 'C-1', '2026-03', 500000, '월세400000+관리비100000(월세인하적용)'),
    pay('이다현', 'C-2', '2026-03', 520000, '월세420000+관리비100000'),
    // 4월
    pay('김위', 'A-1', '2026-04', 650000, '월세550000+관리비100000'),
    pay('여민서', 'B-1', '2026-04', 550000, '월세450000+관리비100000'),
    pay('Sofiia Futuima', 'B-2', '2026-04', 520000, '월세420000+관리비100000'),
    pay('강수민', 'C-1', '2026-04', 500000, '월세400000+관리비100000'),
    pay('이다현', 'C-2', '2026-04', 520000, '월세420000+관리비100000'),
  ].filter(Boolean);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '수납!A:Z', valueInputOption: 'RAW',
    requestBody: { values: payments },
  });

  const firstPay = payments[0][sc('수납ID')];
  const lastPay = payments[payments.length - 1][sc('수납ID')];

  console.log(`\n========== 결과 ==========`);
  console.log(`\n입주자 ${tenants.length}명:`);
  for (const r of tenants) console.log(`  ${r[tc('입주자ID')]} ${r[tc('이름')]} — ${r[tc('상태')]}`);
  console.log(`\n수납 ${payments.length}건: ${firstPay} ~ ${lastPay}`);
}

main().catch(e => { console.error(e); process.exit(1); });
