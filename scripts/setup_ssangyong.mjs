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
  console.log('=== 작업 1: 쌍용하우스 입주자 등록 ===');
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
    row[tc('구')] = '구로구';
    row[tc('지점명')] = '쌍용하우스';
    row[tc('보증금')] = '0';
    row[tc('링크토큰')] = `tenant_${rand8()}`;
    for (const [k, v] of Object.entries(fields)) { if (tc(k) >= 0) row[tc(k)] = v; }
    return row;
  }

  const tenants = [
    mkT({ 방코드: 'A', 방타입: '1인실', 이름: '박민영', 입주일: '2026-02-28', 상태: '입주중', 월세: '500000', 관리비: '120000' }),
    mkT({ 방코드: 'B', 방타입: '1인실', 이름: '이수현', 입주일: '2026-03-01', 상태: '입주중', 월세: '500000', 관리비: '120000' }),
    mkT({ 방코드: 'C', 방타입: '1인실', 이름: '유수정', 입주일: '2025-09-01', 상태: '입주중', 월세: '650000', 관리비: '120000', 메모: '3월 이전 월세 620000' }),
    mkT({ 방코드: 'D', 방타입: '1인실', 이름: '전수연', 입주일: '2025-09-30', 상태: '입주중', 월세: '630000', 관리비: '120000' }),
    mkT({ 방코드: 'E', 방타입: '1인실', 이름: '황채련', 입주일: '2025-04-12', 상태: '입주중', 월세: '650000', 관리비: '120000' }),
    mkT({ 방코드: 'A', 방타입: '1인실', 이름: '장하늘', 입주일: '2025-08-31', 퇴실일: '2026-02-25', 상태: '퇴실완료', 월세: '520000', 관리비: '140000' }),
    mkT({ 방코드: 'B', 방타입: '1인실', 이름: '노예서', 입주일: '2025-03-22', 퇴실일: '2026-01-22', 상태: '퇴실완료', 월세: '490000', 관리비: '120000', 메모: '중도퇴실' }),
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

  // ========== 작업 2: 투자지점 ==========
  console.log('\n=== 작업 2: 투자지점 등록 ===');
  const invRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자자!A1:Z' });
  const invAll = invRes.data.values || [];
  const invH = invAll[0];
  const ic = (n) => invH.indexOf(n);
  const hyogil = invAll.slice(1).find(r => (r[ic('투자자명')] || '') === '이효길');
  const hyogilId = hyogil ? hyogil[ic('투자자ID')] : '';
  console.log('이효길 ID:', hyogilId);

  const ipRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자지점!A1:Z' });
  const ipAll = ipRes.data.values || [];
  const ipH = ipAll[0];
  const ipc = (n) => ipH.indexOf(n);

  let maxIp = 0;
  for (const r of ipAll.slice(1)) {
    const m = (r[ipc('투자ID')] || '').match(/invest_(\d+)/);
    if (m) maxIp = Math.max(maxIp, parseInt(m[1]));
  }

  const ipRow = new Array(ipH.length).fill('');
  ipRow[ipc('투자ID')] = `invest_${String(maxIp + 1).padStart(3, '0')}`;
  ipRow[ipc('투자자ID')] = hyogilId;
  ipRow[ipc('투자자명')] = '이효길';
  ipRow[ipc('지점명')] = '쌍용하우스';
  ipRow[ipc('투자자비율')] = '80';
  ipRow[ipc('유재훈비율')] = '20';
  ipRow[ipc('공동여부')] = 'N';

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '투자지점!A:Z', valueInputOption: 'RAW',
    requestBody: { values: [ipRow] },
  });
  console.log(`✓ 투자지점: ${ipRow[ipc('투자ID')]} 이효길-쌍용하우스 (80:20)`);

  // ========== 작업 3: 수납 ==========
  console.log('\n=== 작업 3: 수납 21건 등록 ===');
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const sAll = sRes.data.values || [];
  const sH = sAll[0];
  const sc = (n) => sH.indexOf(n);

  let maxP = 0;
  for (const r of sAll.slice(1)) {
    const m = (r[sc('수납ID')] || '').match(/pay_(\d+)/);
    if (m) maxP = Math.max(maxP, parseInt(m[1]));
  }

  let pn = maxP;
  function pay(name, room, month, amount, memo) {
    const tid = idMap[name];
    if (!tid) { console.error(`✗ ID 못 찾음: ${name}`); return null; }
    const row = new Array(sH.length).fill('');
    row[sc('수납ID')] = `pay_${String(++pn).padStart(3, '0')}`;
    row[sc('입주자ID')] = tid;
    row[sc('지점명')] = '쌍용하우스';
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
    pay('장하늘', 'A', '2026-01', 660000, '월세520000+관리비140000'),
    pay('노예서', 'B', '2026-01', 610000, '월세490000+관리비120000'),
    pay('유수정', 'C', '2026-01', 740000, '월세620000+관리비120000'),
    pay('전수연', 'D', '2026-01', 750000, '월세630000+관리비120000'),
    pay('황채련', 'E', '2026-01', 770000, '월세650000+관리비120000'),
    // 2월
    pay('장하늘', 'A', '2026-02', 655000, '월세520000+관리비135000(2/25퇴실일할+추가공과금50000)'),
    pay('박민영', 'A', '2026-02', 22143, '월세17857+관리비4286(2/28입주하루치)'),
    pay('노예서', 'B', '2026-02', 544643, '중도퇴실위약금(월세437500+관리비107143)'),
    pay('유수정', 'C', '2026-02', 740000, '월세620000+관리비120000'),
    pay('전수연', 'D', '2026-02', 750000, '월세630000+관리비120000'),
    pay('황채련', 'E', '2026-02', 770000, '월세650000+관리비120000'),
    // 3월
    pay('박민영', 'A', '2026-03', 620000, '월세500000+관리비120000'),
    pay('이수현', 'B', '2026-03', 620000, '월세500000+관리비120000(3/1입주)'),
    pay('유수정', 'C', '2026-03', 770000, '월세650000+관리비120000(월세인상적용)'),
    pay('전수연', 'D', '2026-03', 750000, '월세630000+관리비120000'),
    pay('황채련', 'E', '2026-03', 770000, '월세650000+관리비120000'),
    // 4월
    pay('박민영', 'A', '2026-04', 620000, '월세500000+관리비120000'),
    pay('이수현', 'B', '2026-04', 620000, '월세500000+관리비120000'),
    pay('유수정', 'C', '2026-04', 770000, '월세650000+관리비120000'),
    pay('전수연', 'D', '2026-04', 750000, '월세630000+관리비120000'),
    pay('황채련', 'E', '2026-04', 770000, '월세650000+관리비120000'),
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
  console.log(`\n투자지점: ${ipRow[ipc('투자ID')]} 이효길-쌍용하우스 (80:20)`);
  console.log(`\n수납 ${payments.length}건: ${firstPay} ~ ${lastPay}`);
}

main().catch(e => { console.error(e); process.exit(1); });
