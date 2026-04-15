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

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '수납!A1:Z' });
  const allRows = res.data.values || [];
  const headers = allRows[0];
  console.log('헤더:', headers);
  const c = (name) => headers.indexOf(name);

  // 최대 수납ID
  let maxNum = 0;
  for (const r of allRows.slice(1)) {
    const m = (r[c('수납ID')] || '').match(/pay_(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  console.log('기존 최대 수납ID:', maxNum);

  let n = maxNum;
  function pay(tenantId, roomCode, name, month, amount, memo) {
    const row = new Array(headers.length).fill('');
    row[c('수납ID')] = `pay_${String(++n).padStart(3, '0')}`;
    row[c('입주자ID')] = tenantId;
    row[c('지점명')] = '신사하우스';
    row[c('방코드')] = roomCode;
    row[c('이름')] = name;
    row[c('연월')] = month;
    row[c('청구액')] = String(amount);
    row[c('납부액')] = String(amount);
    row[c('상태')] = '납부완료';
    row[c('메모')] = memo;
    return row;
  }

  const rows = [
    // 1월
    pay('tenant_200', 'A-1', '이채림', '2026-01', 750000, '월세650000+관리비100000'),
    pay('tenant_201', 'B-1', '김채연', '2026-01', 750000, '월세650000+관리비100000'),
    pay('tenant_202', 'C-1', '진승연', '2026-01', 534194, '월세460000+관리비74194(1/9입주일할)'),
    pay('tenant_203', 'D-1', '정나래', '2026-01', 564143, '월세485196+관리비78947(1/25퇴실일할)'),
    pay('tenant_204', 'E-1', '(준오)김태희', '2026-01', 560000, '월세469677+관리비90323(1/4입주일할)'),
    pay('tenant_198', 'F-1', '(우주)이리안', '2026-01', 569920, '월세469920+관리비100000'),
    pay('tenant_199', 'F-2', '(우주)임가람', '2026-01', 569920, '월세469920+관리비100000'),
    // 2월
    pay('tenant_193', 'A-1', '이정연', '2026-02', 25000, '월세21429+관리비3571(2/28입주일할)'),
    pay('tenant_201', 'B-1', '김채연', '2026-02', 652500, '월세487500+관리비165000(2/21퇴실일할+추가공과금65000)'),
    pay('tenant_194', 'B-1', '황채원', '2026-02', 187500, '월세162500+관리비25000(2/22입주일할)'),
    pay('tenant_202', 'C-1', '진승연', '2026-02', 785000, '월세620000+관리비165000(추가공과금65000)'),
    pay('tenant_195', 'D-1', '(앤코)Nguyen Gia Han', '2026-02', 780000, '월세680000+관리비100000(2/25입주)'),
    pay('tenant_196', 'E-1', '(준오)구채민', '2026-02', 620000, '월세520000+관리비100000'),
    pay('tenant_198', 'F-1', '(우주)이리안', '2026-02', 634920, '월세469920+관리비165000(추가공과금65000)'),
    pay('tenant_199', 'F-2', '(우주)임가람', '2026-02', 634920, '월세469920+관리비165000(추가공과금65000)'),
    // 3월
    pay('tenant_193', 'A-1', '이정연', '2026-03', 700000, '월세600000+관리비100000'),
    pay('tenant_194', 'B-1', '황채원', '2026-03', 750000, '월세650000+관리비100000'),
    pay('tenant_202', 'C-1', '진승연', '2026-03', 720000, '월세620000+관리비100000'),
    pay('tenant_195', 'D-1', '(앤코)Nguyen Gia Han', '2026-03', 780000, '월세680000+관리비100000'),
    pay('tenant_196', 'E-1', '(준오)구채민', '2026-03', 620000, '월세520000+관리비100000'),
    pay('tenant_197', 'E-2', '(준오)윤서희', '2026-03', 630000, '월세530000+관리비100000(3/1입주)'),
    pay('tenant_198', 'F-1', '(우주)이리안', '2026-03', 569920, '월세469920+관리비100000'),
    pay('tenant_199', 'F-2', '(우주)임가람', '2026-03', 569920, '월세469920+관리비100000'),
    // 4월
    pay('tenant_193', 'A-1', '이정연', '2026-04', 700000, '월세600000+관리비100000'),
    pay('tenant_194', 'B-1', '황채원', '2026-04', 750000, '월세650000+관리비100000'),
    pay('tenant_202', 'C-1', '진승연', '2026-04', 576000, '월세496000+관리비80000(4/24퇴실일할)'),
    pay('tenant_195', 'D-1', '(앤코)Nguyen Gia Han', '2026-04', 780000, '월세680000+관리비100000'),
    pay('tenant_196', 'E-1', '(준오)구채민', '2026-04', 620000, '월세520000+관리비100000'),
    pay('tenant_197', 'E-2', '(준오)윤서희', '2026-04', 630000, '월세530000+관리비100000'),
    pay('tenant_198', 'F-1', '(우주)이리안', '2026-04', 569920, '월세469920+관리비100000'),
    pay('tenant_199', 'F-2', '(우주)임가람', '2026-04', 569920, '월세469920+관리비100000'),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: '수납!A:Z', valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  const firstId = rows[0][c('수납ID')];
  const lastId = rows[rows.length - 1][c('수납ID')];
  console.log(`\n총 ${rows.length}건 입력 완료`);
  console.log(`수납ID 범위: ${firstId} ~ ${lastId}`);
}

main().catch(e => { console.error(e); process.exit(1); });
