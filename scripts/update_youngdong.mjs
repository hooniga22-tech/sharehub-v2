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

  // 1. 헤더 + 전체 데이터 읽기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '입주자!A1:Z',
  });
  const allRows = res.data.values || [];
  const headers = allRows[0];
  console.log('헤더:', headers);

  const col = (name) => headers.indexOf(name);
  console.log('컬럼 인덱스:', {
    입주자ID: col('입주자ID'), 구: col('구'), 지점명: col('지점명'), 방코드: col('방코드'),
    방타입: col('방타입'), 이름: col('이름'), 입주일: col('입주일'), 퇴실일: col('퇴실일'),
    상태: col('상태'), 보증금: col('보증금'), 월세: col('월세'), 관리비: col('관리비'), 메모: col('메모'),
  });

  const data = allRows.slice(1); // 헤더 제외

  // === 작업 1: 수정 2건 ===

  // 1-1. Adia Arthur + 영동하우스 → 월세 600000
  const adia = data.findIndex(r => (r[col('이름')] || '').includes('Adia Arthur') && r[col('지점명')] === '영동하우스');
  if (adia === -1) { console.error('Adia Arthur 못 찾음'); return; }
  console.log(`\nAdia Arthur 현재 데이터:`, data[adia]);
  data[adia][col('월세')] = '600000';
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `입주자!A${adia + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [data[adia]] },
  });
  console.log('✓ Adia Arthur 월세 → 600000');

  // 1-2. 정다혜 + 영동하우스 → 입주일, 퇴실일, 월세, 메모
  const dahye = data.findIndex(r => (r[col('이름')] || '').includes('정다혜') && r[col('지점명')] === '영동하우스');
  if (dahye === -1) { console.error('정다혜 못 찾음'); return; }
  console.log(`\n정다혜 현재 데이터:`, data[dahye]);
  data[dahye][col('입주일')] = '2026-01-01';
  data[dahye][col('퇴실일')] = '2026-06-30';
  data[dahye][col('월세')] = '507300';
  data[dahye][col('메모')] = '우주 플랫폼';
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `입주자!A${dahye + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [data[dahye]] },
  });
  console.log('✓ 정다혜 입주일/퇴실일/월세/메모 수정 완료');

  // === 작업 2: 퇴실이력 4건 추가 ===

  // 기존 최대 ID 찾기
  let maxNum = 0;
  for (const r of data) {
    const id = r[col('입주자ID')] || '';
    const m = id.match(/tenant_(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  console.log(`\n기존 최대 ID 번호: ${maxNum}`);

  const totalCols = headers.length;
  function makeRow(id, fields) {
    const row = new Array(totalCols).fill('');
    row[col('입주자ID')] = id;
    for (const [k, v] of Object.entries(fields)) {
      if (col(k) >= 0) row[col(k)] = v;
    }
    return row;
  }

  const newRows = [
    makeRow(`tenant_${String(maxNum + 1).padStart(3, '0')}`, {
      구: '강남구', 지점명: '영동하우스', 방코드: 'C-1 윗층 왼', 방타입: '1인실',
      이름: '진승연', 입주일: '', 퇴실일: '2026-01-09', 상태: '퇴실완료',
      보증금: '2000000', 월세: '', 관리비: '100000', 메모: '2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 2).padStart(3, '0')}`, {
      구: '강남구', 지점명: '영동하우스', 방코드: 'B-1 주방 앞', 방타입: '1인실',
      이름: '헤바 Heba', 입주일: '', 퇴실일: '2026-01-31', 상태: '퇴실완료',
      보증금: '2000000', 월세: '587400', 관리비: '145000', 메모: '우주 플랫폼 · 2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 3).padStart(3, '0')}`, {
      구: '강남구', 지점명: '영동하우스', 방코드: 'E-1 화장실 우 오른쪽', 방타입: '2인실',
      이름: 'Laurine BLANCHON', 입주일: '', 퇴실일: '2026-01-10', 상태: '퇴실완료',
      보증금: '2000000', 월세: '154839', 관리비: '32258', 메모: '고고 플랫폼 · 2026년 이전 입주, 퇴실완료',
    }),
    makeRow(`tenant_${String(maxNum + 4).padStart(3, '0')}`, {
      구: '강남구', 지점명: '영동하우스', 방코드: 'E-2 화장실 우 왼쪽', 방타입: '2인실',
      이름: 'Cassandra BLANCHON', 입주일: '', 퇴실일: '2026-01-10', 상태: '퇴실완료',
      보증금: '2000000', 월세: '154839', 관리비: '32258', 메모: '고고 플랫폼 · 2026년 이전 입주, 퇴실완료',
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '입주자!A:Z',
    valueInputOption: 'RAW',
    requestBody: { values: newRows },
  });

  for (const r of newRows) {
    console.log(`✓ 추가: ${r[col('입주자ID')]} ${r[col('이름')]} (${r[col('방코드')]})`);
  }

  console.log('\n모든 작업 완료!');
}

main().catch(e => { console.error(e); process.exit(1); });
