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

function randToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'tenant_';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randToken8() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // ========== 작업 1: 입주자 5명 ==========
  console.log('=== 작업 1: 선릉하우스 입주자 5명 등록 ===');
  const tRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const tAll = tRes.data.values || [];
  const tH = tAll[0];
  const tData = tAll.slice(1);
  console.log('입주자 헤더:', tH);
  const tc = (name) => tH.indexOf(name);

  let maxT = 0;
  for (const r of tData) {
    const m = (r[tc('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxT = Math.max(maxT, parseInt(m[1]));
  }
  console.log('기존 최대 tenant ID:', maxT);

  let n = maxT;
  function mkTenant(fields) {
    const row = new Array(tH.length).fill('');
    row[tc('입주자ID')] = `tenant_${String(++n).padStart(3, '0')}`;
    row[tc('구')] = '강남구';
    row[tc('지점명')] = '선릉하우스';
    row[tc('보증금')] = '0';
    row[tc('링크토큰')] = randToken();
    for (const [k, v] of Object.entries(fields)) {
      if (tc(k) >= 0) row[tc(k)] = v;
    }
    return row;
  }

  const tenants = [
    mkTenant({ 방코드: 'A', 방타입: '1인실', 이름: 'Fulvia Verna', 입주일: '2024-11-24', 상태: '입주중', 월세: '680000', 관리비: '100000' }),
    mkTenant({ 방코드: 'B', 방타입: '1인실', 이름: '권민경', 입주일: '2026-01-10', 상태: '입주중', 월세: '580000', 관리비: '100000' }),
    mkTenant({ 방코드: 'C-2', 방타입: '2인실', 이름: '최연지', 입주일: '2025-05-25', 상태: '입주중', 월세: '490000', 관리비: '100000', 메모: '3월 이전 480000' }),
    mkTenant({ 방코드: 'B', 방타입: '1인실', 이름: '(앤코)Anamaria Diana Lupascu', 입주일: '2025-08-22', 퇴실일: '2026-01-10', 상태: '퇴실완료', 월세: '680000', 관리비: '100000', 메모: '앤코플랫폼' }),
    mkTenant({ 방코드: 'C-1', 방타입: '2인실', 이름: '곽은혜', 입주일: '2025-03-30', 퇴실일: '2026-03-31', 상태: '퇴실완료', 월세: '450000', 관리비: '100000' }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: tenants },
  });

  // ID 매핑
  const idMap = {};
  for (const r of tenants) {
    idMap[r[tc('이름')]] = r[tc('입주자ID')];
    console.log(`✓ ${r[tc('입주자ID')]} ${r[tc('이름')]} [${r[tc('방코드')]}] ${r[tc('상태')]}`);
  }

  // ========== 작업 2: 투자자 + 투자지점 ==========
  console.log('\n=== 작업 2: 투자자 및 투자지점 등록 ===');

  // 투자자 시트
  const invRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자자!A1:Z' });
  const invAll = invRes.data.values || [];
  const invH = invAll[0];
  const invData = invAll.slice(1);
  console.log('투자자 헤더:', invH);
  const ic = (name) => invH.indexOf(name);

  let investorId = '';
  const existing = invData.find(r => (r[ic('투자자명')] || '') === '이효길');
  if (existing) {
    investorId = existing[ic('투자자ID')];
    console.log(`이효길 이미 존재: ${investorId}`);
  } else {
    let maxInv = 0;
    for (const r of invData) {
      const m = (r[ic('투자자ID')] || '').match(/investor_(\d+)/);
      if (m) maxInv = Math.max(maxInv, parseInt(m[1]));
    }
    investorId = `investor_${String(maxInv + 1).padStart(3, '0')}`;
    const invRow = new Array(invH.length).fill('');
    invRow[ic('투자자ID')] = investorId;
    invRow[ic('투자자명')] = '이효길';
    if (ic('링크토큰') >= 0) invRow[ic('링크토큰')] = `investor_${randToken8()}`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: '투자자!A:Z', valueInputOption: 'RAW',
      requestBody: { values: [invRow] },
    });
    console.log(`✓ 투자자 추가: ${investorId} 이효길`);
  }

  // 투자지점 시트
  const ipRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자지점!A1:Z' });
  const ipAll = ipRes.data.values || [];
  const ipH = ipAll[0];
  console.log('투자지점 헤더:', ipH);
  const ipc = (name) => ipH.indexOf(name);

  let maxIp = 0;
  for (const r of ipAll.slice(1)) {
    const m = (r[ipc('투자ID')] || '').match(/invest_(\d+)/);
    if (m) maxIp = Math.max(maxIp, parseInt(m[1]));
  }

  const ipRow = new Array(ipH.length).fill('');
  ipRow[ipc('투자ID')] = `invest_${String(maxIp + 1).padStart(3, '0')}`;
  ipRow[ipc('투자자ID')] = investorId;
  ipRow[ipc('투자자명')] = '이효길';
  ipRow[ipc('지점명')] = '선릉하우스';
  ipRow[ipc('투자자비율')] = '70';
  ipRow[ipc('유재훈비율')] = '30';
  ipRow[ipc('공동여부')] = 'N';
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '투자지점!A:Z', valueInputOption: 'RAW',
    requestBody: { values: [ipRow] },
  });
  console.log(`✓ 투자지점 추가: ${ipRow[ipc('투자ID')]} 이효길-선릉하우스 (70:30)`);

  // ========== 작업 3: 수납 16건 ==========
  console.log('\n=== 작업 3: 수납 16건 등록 ===');
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const sAll = sRes.data.values || [];
  const sH = sAll[0];
  console.log('수납 헤더:', sH);
  const sc = (name) => sH.indexOf(name);

  let maxP = 0;
  for (const r of sAll.slice(1)) {
    const m = (r[sc('수납ID')] || '').match(/pay_(\d+)/);
    if (m) maxP = Math.max(maxP, parseInt(m[1]));
  }
  console.log('기존 최대 수납ID:', maxP);

  let p = maxP;
  function pay(name, roomCode, month, amount, memo) {
    const tid = idMap[name];
    if (!tid) { console.error(`✗ ID 못 찾음: ${name}`); return null; }
    const row = new Array(sH.length).fill('');
    row[sc('수납ID')] = `pay_${String(++p).padStart(3, '0')}`;
    row[sc('입주자ID')] = tid;
    row[sc('지점명')] = '선릉하우스';
    row[sc('방코드')] = roomCode;
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
    pay('Fulvia Verna', 'A', '2026-01', 780000, '월세680000+관리비100000'),
    pay('(앤코)Anamaria Diana Lupascu', 'B', '2026-01', 226451, '월세197419+관리비29032(1/1~1/9퇴실일할)'),
    pay('권민경', 'B', '2026-01', 483523, '월세412194+관리비70968(1/10~1/31입주일할)+관리비차액361'),
    pay('곽은혜', 'C-1', '2026-01', 550000, '월세450000+관리비100000'),
    pay('최연지', 'C-2', '2026-01', 580000, '월세480000+관리비100000'),
    // 2월
    pay('Fulvia Verna', 'A', '2026-02', 780000, '월세680000+관리비100000'),
    pay('권민경', 'B', '2026-02', 680000, '월세580000+관리비100000'),
    pay('곽은혜', 'C-1', '2026-02', 550000, '월세450000+관리비100000'),
    pay('최연지', 'C-2', '2026-02', 580000, '월세480000+관리비100000'),
    // 3월
    pay('Fulvia Verna', 'A', '2026-03', 780000, '월세680000+관리비100000'),
    pay('권민경', 'B', '2026-03', 680000, '월세580000+관리비100000'),
    pay('곽은혜', 'C-1', '2026-03', 550000, '월세450000+관리비100000(3/31퇴실 전월납부)'),
    pay('최연지', 'C-2', '2026-03', 590000, '월세490000+관리비100000(3월부터 월세인상)'),
    // 4월
    pay('Fulvia Verna', 'A', '2026-04', 780000, '월세680000+관리비100000'),
    pay('권민경', 'B', '2026-04', 680000, '월세580000+관리비100000'),
    pay('최연지', 'C-2', '2026-04', 590000, '월세490000+관리비100000'),
  ].filter(Boolean);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '수납!A:Z', valueInputOption: 'RAW',
    requestBody: { values: payments },
  });

  const firstPay = payments[0][sc('수납ID')];
  const lastPay = payments[payments.length - 1][sc('수납ID')];

  console.log(`\n========== 결과 ==========`);
  console.log(`입주자: ${tenants.length}명`);
  for (const r of tenants) console.log(`  ${r[tc('입주자ID')]} ${r[tc('이름')]}`);
  console.log(`투자자: ${investorId} 이효길`);
  console.log(`투자지점: ${ipRow[ipc('투자ID')]}`);
  console.log(`수납: ${payments.length}건 (${firstPay} ~ ${lastPay})`);
}

main().catch(e => { console.error(e); process.exit(1); });
