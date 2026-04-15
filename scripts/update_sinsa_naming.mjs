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

function randomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'tenant_';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // 헤더 + 데이터 읽기
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const allRows = res.data.values || [];
  const headers = allRows[0];
  const data = allRows.slice(1);
  console.log('헤더:', headers);
  const c = (name) => headers.indexOf(name);

  // ========== 작업 1: 신사하우스 12명 추가 ==========
  console.log('\n=== 작업 1: 신사하우스 12명 추가 ===');

  let maxNum = 0;
  for (const r of data) {
    const m = (r[c('입주자ID')] || '').match(/tenant_(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  console.log('기존 최대 tenant ID:', maxNum);

  function makeRow(num, fields) {
    const row = new Array(headers.length).fill('');
    row[c('입주자ID')] = `tenant_${String(num).padStart(3, '0')}`;
    row[c('구')] = '강남구';
    row[c('지점명')] = '신사하우스';
    row[c('링크토큰')] = randomToken();
    for (const [k, v] of Object.entries(fields)) {
      if (c(k) >= 0) row[c(k)] = v;
    }
    return row;
  }

  let n = maxNum;
  const newRows = [
    // 현재 입주중 7명
    makeRow(++n, { 방코드: 'A-1', 방타입: '1인실', 이름: '이정연', 입주일: '2026-02-28', 상태: '입주중', 보증금: '0', 월세: '600000', 관리비: '100000' }),
    makeRow(++n, { 방코드: 'B-1', 방타입: '1인실', 이름: '황채원', 입주일: '2026-02-22', 상태: '입주중', 보증금: '0', 월세: '650000', 관리비: '100000' }),
    makeRow(++n, { 방코드: 'D-1', 방타입: '1인실', 이름: '(앤코)Nguyen Gia Han', 입주일: '2026-02-25', 상태: '입주중', 보증금: '0', 월세: '680000', 관리비: '100000', 메모: '앤코플랫폼' }),
    makeRow(++n, { 방코드: 'E-1', 방타입: '1.5인실', 이름: '(준오)구채민', 입주일: '2026-02-01', 퇴실일: '2026-07-03', 상태: '입주중', 보증금: '0', 월세: '520000', 관리비: '100000', 메모: '준오헤어양재1호점' }),
    makeRow(++n, { 방코드: 'E-2', 방타입: '1.5인실', 이름: '(준오)윤서희', 입주일: '2026-03-01', 상태: '입주중', 보증금: '0', 월세: '530000', 관리비: '100000', 메모: '준오헤어양재1호점' }),
    makeRow(++n, { 방코드: 'F-1', 방타입: '2인실', 이름: '(우주)이리안', 입주일: '2024-11-18', 상태: '입주중', 보증금: '0', 월세: '469920', 관리비: '100000', 메모: '우주플랫폼' }),
    makeRow(++n, { 방코드: 'F-2', 방타입: '2인실', 이름: '(우주)임가람', 입주일: '2025-01-01', 퇴실일: '2026-04-30', 상태: '입주중', 보증금: '0', 월세: '469920', 관리비: '100000', 메모: '우주플랫폼' }),
    // 퇴실이력 5명
    makeRow(++n, { 방코드: 'A-1', 방타입: '1인실', 이름: '이채림', 퇴실일: '2026-01-31', 상태: '퇴실완료', 보증금: '0', 월세: '650000', 관리비: '100000' }),
    makeRow(++n, { 방코드: 'B-1', 방타입: '1인실', 이름: '김채연', 입주일: '2024-03-02', 퇴실일: '2026-02-21', 상태: '퇴실완료', 보증금: '0', 월세: '650000', 관리비: '100000' }),
    makeRow(++n, { 방코드: 'C-1', 방타입: '1인실', 이름: '진승연', 입주일: '2026-01-09', 퇴실일: '2026-04-24', 상태: '퇴실완료', 보증금: '0', 월세: '460000', 관리비: '74194' }),
    makeRow(++n, { 방코드: 'D-1', 방타입: '1인실', 이름: '정나래', 입주일: '2024-01-25', 퇴실일: '2026-01-25', 상태: '퇴실완료', 보증금: '0', 월세: '650000', 관리비: '100000' }),
    makeRow(++n, { 방코드: 'E-1', 방타입: '1.5인실', 이름: '(준오)김태희', 입주일: '2026-01-04', 퇴실일: '2026-01-31', 상태: '퇴실완료', 보증금: '0', 월세: '520000', 관리비: '100000', 메모: '준오헤어양재1호점' }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '입주자!A:Z', valueInputOption: 'RAW',
    requestBody: { values: newRows },
  });
  for (const r of newRows) console.log(`✓ 추가: ${r[c('입주자ID')]} ${r[c('이름')]} [${r[c('방코드')]}] ${r[c('상태')]}`);

  // 새로 추가한 ID 목록 (작업 2에서 제외용)
  const newIds = new Set(newRows.map(r => r[c('입주자ID')]));

  // ========== 작업 2: 네이밍 룰 일괄 수정 ==========
  console.log('\n=== 작업 2: 네이밍 룰 일괄 수정 ===');

  // 다시 전체 데이터 읽기 (작업 1 반영)
  const res2 = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '입주자!A1:Z' });
  const allRows2 = res2.data.values || [];
  const data2 = allRows2.slice(1);

  const namingPatterns = [
    { regex: /^(.+)\(우주\)$/, replacement: '(우주)$1' },
    { regex: /^(.+)\(앤코\)$/, replacement: '(앤코)$1' },
    { regex: /^(.+)\(엔코\)$/, replacement: '(앤코)$1' },
    { regex: /^(.+)\(준오\)$/, replacement: '(준오)$1' },
  ];

  const batchUpdates = [];
  let changeCount = 0;

  for (let i = 0; i < data2.length; i++) {
    const row = data2[i];
    const id = row[c('입주자ID')] || '';
    if (newIds.has(id)) continue; // 작업 1에서 추가한 행 제외

    const name = row[c('이름')] || '';
    let newName = name;

    for (const { regex, replacement } of namingPatterns) {
      if (regex.test(newName)) {
        newName = newName.replace(regex, replacement);
        break;
      }
    }

    if (newName !== name) {
      console.log(`${name} → ${newName}`);
      row[c('이름')] = newName;
      while (row.length < headers.length) row.push('');
      batchUpdates.push({ range: `입주자!A${i + 2}`, values: [row] });
      changeCount++;
    }
  }

  if (batchUpdates.length > 0) {
    // batchUpdate max 100 per call
    for (let i = 0; i < batchUpdates.length; i += 100) {
      const chunk = batchUpdates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: chunk },
      });
    }
    console.log(`\n네이밍 수정 ${changeCount}건 완료`);
  } else {
    console.log('수정 대상 없음');
  }

  console.log('\n모든 작업 완료!');
}

main().catch(e => { console.error(e); process.exit(1); });
