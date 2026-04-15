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

  // Read all sheets
  const tRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const tAll = tRes.data.values || [];
  const tH = tAll[0];
  const tData = tAll.slice(1);
  const tc = (n) => tH.indexOf(n);
  console.log('입주자 헤더:', tH);

  let maxT = 0;
  for (const r of tData) {
    const m = (r[tc('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxT = Math.max(maxT, parseInt(m[1]));
  }
  console.log('기존 최대 tenant ID:', maxT);

  let tn = maxT;
  function mkT(gu, house, fields) {
    const row = new Array(tH.length).fill('');
    row[tc('입주자ID')] = `tenant_${String(++tn).padStart(3, '0')}`;
    row[tc('구')] = gu;
    row[tc('지점명')] = house;
    row[tc('보증금')] = '0';
    row[tc('링크토큰')] = `tenant_${rand8()}`;
    for (const [k, v] of Object.entries(fields)) { if (tc(k) >= 0) row[tc(k)] = v; }
    return row;
  }

  // ========== 대학하우스 입주자 ==========
  console.log('\n=== [대학하우스] 작업 1: 입주자 5명 ===');
  const dTenants = [
    mkT('서대문구', '대학하우스', { 방코드: 'A', 방타입: '1인실', 이름: '최가현', 입주일: '2024-02-18', 상태: '입주중', 월세: '430000', 관리비: '100000', 메모: '3월 이전 월세 300000 관리비 80000' }),
    mkT('서대문구', '대학하우스', { 방코드: 'D', 방타입: '1인실', 이름: '구서영', 입주일: '2026-02-28', 상태: '입주중', 월세: '420000', 관리비: '100000' }),
    mkT('서대문구', '대학하우스', { 방코드: 'B', 방타입: '1인실', 이름: '(우주)Alina Li', 입주일: '2025-02-28', 퇴실일: '2026-02-28', 상태: '퇴실완료', 월세: '462800', 관리비: '100000', 메모: '우주플랫폼' }),
    mkT('서대문구', '대학하우스', { 방코드: 'C', 방타입: '1인실', 이름: '유에리', 입주일: '2025-03-09', 퇴실일: '2026-02-25', 상태: '퇴실완료', 월세: '290000', 관리비: '100000' }),
    mkT('서대문구', '대학하우스', { 방코드: 'D', 방타입: '1인실', 이름: '이채은', 입주일: '2025-03-01', 퇴실일: '2026-02-28', 상태: '퇴실완료', 월세: '400000', 관리비: '80000' }),
  ];
  const dIdMap = {};
  for (const r of dTenants) { dIdMap[r[tc('이름')]] = r[tc('입주자ID')]; console.log(`✓ ${r[tc('입주자ID')]} ${r[tc('이름')]} [${r[tc('방코드')]}] ${r[tc('상태')]}`); }

  // ========== 샤네하우스 입주자 ==========
  console.log('\n=== [샤네하우스] 작업 4: 입주자 8명 ===');
  const sTenants = [
    mkT('강남구', '샤네하우스', { 방코드: 'A-1', 방타입: '2인실', 이름: '이지희', 입주일: '2026-03-01', 상태: '입주중', 월세: '510000', 관리비: '100000', 메모: 'B-1에서 이동' }),
    mkT('강남구', '샤네하우스', { 방코드: 'B-1', 방타입: '2인실', 이름: '김승은', 입주일: '2026-03-01', 상태: '입주중', 월세: '470000', 관리비: '100000', 메모: 'C-2에서 이동' }),
    mkT('강남구', '샤네하우스', { 방코드: 'C-1', 방타입: '2인실', 이름: '최솔', 입주일: '2026-02-28', 상태: '입주중', 월세: '420000', 관리비: '100000' }),
    mkT('강남구', '샤네하우스', { 방코드: 'A-1', 방타입: '2인실', 이름: '이연경', 입주일: '2025-02-26', 퇴실일: '2026-02-25', 상태: '퇴실완료', 월세: '510000', 관리비: '100000' }),
    mkT('강남구', '샤네하우스', { 방코드: 'B-1', 방타입: '2인실', 이름: '이지희(퇴)', 입주일: '2025-01-01', 퇴실일: '2026-02-25', 상태: '퇴실완료', 월세: '480000', 관리비: '80000', 메모: 'A-1으로 방이동' }),
    mkT('강남구', '샤네하우스', { 방코드: 'C-1', 방타입: '2인실', 이름: '정하연', 입주일: '2025-03-02', 퇴실일: '2026-01-31', 상태: '퇴실완료', 월세: '390000', 관리비: '100000' }),
    mkT('강남구', '샤네하우스', { 방코드: 'C-2', 방타입: '2인실', 이름: '김승은(퇴)', 입주일: '2025-01-01', 퇴실일: '2026-02-28', 상태: '퇴실완료', 월세: '380000', 관리비: '80000', 메모: 'B-1으로 방이동' }),
    mkT('강남구', '샤네하우스', { 방코드: 'B-1', 방타입: '2인실', 이름: '유진하', 상태: '계약취소', 월세: '0', 관리비: '0', 메모: '계약취소 위약금 500000' }),
  ];
  const sIdMap = {};
  for (const r of sTenants) { sIdMap[r[tc('이름')]] = r[tc('입주자ID')]; console.log(`✓ ${r[tc('입주자ID')]} ${r[tc('이름')]} [${r[tc('방코드')]}] ${r[tc('상태')]}`); }

  // Append all tenants
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: [...dTenants, ...sTenants] },
  });
  console.log(`\n입주자 총 ${dTenants.length + sTenants.length}명 등록 완료`);

  // ========== 투자자 ==========
  console.log('\n=== 작업 2+5: 투자자 등록 ===');
  const invRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자자!A1:Z' });
  const invAll = invRes.data.values || [];
  const invH = invAll[0];
  const invData = invAll.slice(1);
  const ic = (n) => invH.indexOf(n);

  let maxInv = 0;
  for (const r of invData) { const m = (r[ic('투자자ID')] || '').match(/inv_(\d+)/); if (m) maxInv = Math.max(maxInv, parseInt(m[1])); }

  function findOrCreateInvestor(name) {
    const ex = invData.find(r => (r[ic('투자자명')] || '') === name);
    if (ex) { console.log(`${name} 이미 존재: ${ex[ic('투자자ID')]}`); return ex[ic('투자자ID')]; }
    const id = `inv_${String(++maxInv).padStart(3, '0')}`;
    const row = new Array(invH.length).fill('');
    row[ic('투자자ID')] = id;
    row[ic('투자자명')] = name;
    if (ic('링크토큰') >= 0) row[ic('링크토큰')] = `investor_${rand8()}`;
    invData.push(row); // for next lookup
    return { id, row };
  }

  const park = findOrCreateInvestor('박성운');
  const kim = findOrCreateInvestor('김태화');

  const newInvestors = [];
  const parkId = typeof park === 'string' ? park : park.id;
  const kimId = typeof kim === 'string' ? kim : kim.id;
  if (typeof park !== 'string') newInvestors.push(park.row);
  if (typeof kim !== 'string') newInvestors.push(kim.row);

  if (newInvestors.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: '투자자!A:Z', valueInputOption: 'RAW',
      requestBody: { values: newInvestors },
    });
    for (const r of newInvestors) console.log(`✓ 투자자 추가: ${r[ic('투자자ID')]} ${r[ic('투자자명')]}`);
  }

  // 투자지점
  const ipRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '투자지점!A1:Z' });
  const ipAll = ipRes.data.values || [];
  const ipH = ipAll[0];
  const ipc = (n) => ipH.indexOf(n);

  let maxIp = 0;
  for (const r of ipAll.slice(1)) { const m = (r[ipc('투자ID')] || '').match(/invest_(\d+)/); if (m) maxIp = Math.max(maxIp, parseInt(m[1])); }

  function mkIp(invId, invName, house, ratio1, ratio2) {
    const row = new Array(ipH.length).fill('');
    row[ipc('투자ID')] = `invest_${String(++maxIp).padStart(3, '0')}`;
    row[ipc('투자자ID')] = invId;
    row[ipc('투자자명')] = invName;
    row[ipc('지점명')] = house;
    row[ipc('투자자비율')] = String(ratio1);
    row[ipc('유재훈비율')] = String(ratio2);
    row[ipc('공동여부')] = 'N';
    return row;
  }

  const ipRows = [
    mkIp(parkId, '박성운', '대학하우스', 70, 30),
    mkIp(kimId, '김태화', '샤네하우스', 75, 25),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '투자지점!A:Z', valueInputOption: 'RAW',
    requestBody: { values: ipRows },
  });
  for (const r of ipRows) console.log(`✓ 투자지점: ${r[ipc('투자ID')]} ${r[ipc('투자자명')]}-${r[ipc('지점명')]} (${r[ipc('투자자비율')]}:${r[ipc('유재훈비율')]})`);

  // ========== 수납 ==========
  console.log('\n=== 작업 3+6: 수납 등록 ===');
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const sAll = sRes.data.values || [];
  const sH = sAll[0];
  const sc = (n) => sH.indexOf(n);
  console.log('수납 헤더:', sH);

  let maxP = 0;
  for (const r of sAll.slice(1)) { const m = (r[sc('수납ID')] || '').match(/pay_(\d+)/); if (m) maxP = Math.max(maxP, parseInt(m[1])); }
  console.log('기존 최대 수납ID:', maxP);

  let pn = maxP;
  function mkPay(idMap, house, name, room, month, amount, memo) {
    const tid = idMap[name];
    if (!tid) { console.error(`✗ ID 못 찾음: ${name}`); return null; }
    const row = new Array(sH.length).fill('');
    row[sc('수납ID')] = `pay_${String(++pn).padStart(3, '0')}`;
    row[sc('입주자ID')] = tid;
    row[sc('지점명')] = house;
    row[sc('방코드')] = room;
    row[sc('이름')] = name;
    row[sc('연월')] = month;
    row[sc('청구액')] = String(amount);
    row[sc('납부액')] = String(amount);
    row[sc('상태')] = '납부완료';
    row[sc('메모')] = memo;
    return row;
  }

  const dPayments = [
    // 1월
    mkPay(dIdMap, '대학하우스', '최가현', 'A', '2026-01', 380000, '월세300000+관리비80000'),
    mkPay(dIdMap, '대학하우스', '(우주)Alina Li', 'B', '2026-01', 562800, '월세462800+관리비100000'),
    mkPay(dIdMap, '대학하우스', '유에리', 'C', '2026-01', 390000, '월세290000+관리비100000'),
    mkPay(dIdMap, '대학하우스', '이채은', 'D', '2026-01', 480000, '월세400000+관리비80000'),
    // 2월
    mkPay(dIdMap, '대학하우스', '최가현', 'A', '2026-02', 380000, '월세300000+관리비80000'),
    mkPay(dIdMap, '대학하우스', '(우주)Alina Li', 'B', '2026-02', 562800, '월세462800+관리비100000(2/28퇴실)'),
    mkPay(dIdMap, '대학하우스', '유에리', 'C', '2026-02', 348215, '월세258929+관리비89286(2/25퇴실일할)'),
    mkPay(dIdMap, '대학하우스', '이채은', 'D', '2026-02', 480000, '월세400000+관리비80000(2/28퇴실)'),
    mkPay(dIdMap, '대학하우스', '구서영', 'D', '2026-02', 18571, '월세15000+관리비3571(2/28입주하루치)'),
    // 3월
    mkPay(dIdMap, '대학하우스', '최가현', 'A', '2026-03', 530000, '월세430000+관리비100000(월세인상적용)'),
    mkPay(dIdMap, '대학하우스', '구서영', 'D', '2026-03', 520000, '월세420000+관리비100000'),
    // 4월
    mkPay(dIdMap, '대학하우스', '최가현', 'A', '2026-04', 530000, '월세430000+관리비100000'),
    mkPay(dIdMap, '대학하우스', '구서영', 'D', '2026-04', 520000, '월세420000+관리비100000'),
  ].filter(Boolean);

  // 샤네 수납 - 퇴실 이지희/김승은은 (퇴) suffix로 ID 매핑
  const sPayments = [
    // 1월
    mkPay(sIdMap, '샤네하우스', '이연경', 'A-1', '2026-01', 610000, '월세510000+관리비100000'),
    mkPay(sIdMap, '샤네하우스', '이지희(퇴)', 'B-1', '2026-01', 560000, '월세480000+관리비80000'),
    mkPay(sIdMap, '샤네하우스', '정하연', 'C-1', '2026-01', 490000, '월세390000+관리비100000'),
    mkPay(sIdMap, '샤네하우스', '김승은(퇴)', 'C-2', '2026-01', 460000, '월세380000+관리비80000'),
    // 2월
    mkPay(sIdMap, '샤네하우스', '이연경', 'A-1', '2026-02', 544643, '월세455357+관리비89286(2/25퇴실일할)'),
    mkPay(sIdMap, '샤네하우스', '이지희(퇴)', 'B-1', '2026-02', 560000, '월세480000+관리비80000(2/25퇴실)'),
    mkPay(sIdMap, '샤네하우스', '유진하', 'B-1', '2026-02', 500000, '계약취소위약금'),
    mkPay(sIdMap, '샤네하우스', '최솔', 'C-1', '2026-02', 18571, '월세15000+관리비3571(2/28입주하루치)'),
    mkPay(sIdMap, '샤네하우스', '김승은(퇴)', 'C-2', '2026-02', 360000, '월세280000+관리비80000(겨울방학할인)'),
    // 3월 - 이지희(입주중), 김승은(입주중)
    mkPay(sIdMap, '샤네하우스', '이지희', 'A-1', '2026-03', 610000, '월세510000+관리비100000(B-1에서이동)'),
    mkPay(sIdMap, '샤네하우스', '김승은', 'B-1', '2026-03', 570000, '월세470000+관리비100000(C-2에서이동)'),
    mkPay(sIdMap, '샤네하우스', '최솔', 'C-1', '2026-03', 520000, '월세420000+관리비100000'),
    // 4월
    mkPay(sIdMap, '샤네하우스', '이지희', 'A-1', '2026-04', 610000, '월세510000+관리비100000'),
    mkPay(sIdMap, '샤네하우스', '김승은', 'B-1', '2026-04', 570000, '월세470000+관리비100000'),
    mkPay(sIdMap, '샤네하우스', '최솔', 'C-1', '2026-04', 520000, '월세420000+관리비100000'),
  ].filter(Boolean);

  // Fix 수납 이름 - remove (퇴) suffix for display
  for (const r of sPayments) {
    if (r[sc('이름')].endsWith('(퇴)')) {
      r[sc('이름')] = r[sc('이름')].replace('(퇴)', '');
    }
  }

  const allPayments = [...dPayments, ...sPayments];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '수납!A:Z', valueInputOption: 'RAW',
    requestBody: { values: allPayments },
  });

  const dFirst = dPayments[0][sc('수납ID')];
  const dLast = dPayments[dPayments.length - 1][sc('수납ID')];
  const sFirst = sPayments[0][sc('수납ID')];
  const sLast = sPayments[sPayments.length - 1][sc('수납ID')];

  console.log(`\n========== 결과 ==========`);
  console.log(`\n[대학하우스]`);
  console.log(`입주자 ${dTenants.length}명:`);
  for (const r of dTenants) console.log(`  ${r[tc('입주자ID')]} ${r[tc('이름')]}`);
  console.log(`수납 ${dPayments.length}건: ${dFirst} ~ ${dLast}`);

  console.log(`\n[샤네하우스]`);
  console.log(`입주자 ${sTenants.length}명:`);
  for (const r of sTenants) console.log(`  ${r[tc('입주자ID')]} ${r[tc('이름')]}`);
  console.log(`수납 ${sPayments.length}건: ${sFirst} ~ ${sLast}`);

  console.log(`\n[투자자]`);
  console.log(`박성운: ${parkId}`);
  console.log(`김태화: ${kimId}`);
}

main().catch(e => { console.error(e); process.exit(1); });
