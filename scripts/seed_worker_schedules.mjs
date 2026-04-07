import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

const schedules = [
  { house: '샛별', worker: '이인실', type: '정기청소', date: '2026-03-05', amount: 60000, done: true },
  { house: '영삼', worker: '이인실', type: '정기청소', date: '2026-03-06', amount: 40000, done: true },
  { house: '영영1', worker: '이인실', type: '정기청소', date: '2026-03-06', amount: 40000, done: true },
  { house: '신촌', worker: '이인실', type: '정기청소', date: '2026-03-12', amount: 40000, done: true },
  { house: '샤네', worker: '이인실', type: '정기청소', date: '2026-03-13', amount: 40000, done: true },
  { house: '한성', worker: '이인실', type: '정기청소', date: '2026-03-14', amount: 40000, done: true },
  { house: '소녀', worker: '이인실', type: '정기청소', date: '2026-03-14', amount: 45000, done: true },
  { house: '청량', worker: '이인실', type: '정기청소', date: '2026-03-19', amount: 40000, done: true },
  { house: '워너비', worker: '이인실', type: '정기청소', date: '2026-03-20', amount: 40000, done: true },
  { house: '선릉', worker: '이인실', type: '정기청소', date: '2026-03-20', amount: 40000, done: true },
  { house: '아현', worker: '이인실', type: '정기청소', date: '2026-03-21', amount: 40000, done: true },
  { house: '낙성', worker: '이인실', type: '정기청소', date: '2026-03-21', amount: 40000, done: true },
  { house: '영동', worker: '이인실', type: '정기청소', date: '2026-03-25', amount: 50000, done: true },
  { house: '이문', worker: '이인실', type: '정기청소', date: '2026-03-25', amount: 60000, done: true },
  { house: '쌍용', worker: '이인실', type: '정기청소', date: '2026-03-26', amount: 50000, done: true },
  { house: '영이', worker: '이인실', type: '정기청소', date: '2026-03-31', amount: 0, done: true },
  { house: '대학', worker: '이인실', type: '정기청소', date: '2026-03-31', amount: 0, done: true },
  { house: '영영2', worker: '이인실', type: '정기청소', date: '2026-03-31', amount: 0, done: true },
  { house: '샛별', worker: '이인실', type: '정기청소', date: '2026-04-01', amount: 60000, done: true },
  { house: '영삼', worker: '이인실', type: '정기청소', date: '2026-04-02', amount: 40000, done: true },
  { house: '영영1', worker: '이인실', type: '정기청소', date: '2026-04-02', amount: 40000, done: true },
  { house: '신촌', worker: '이인실', type: '정기청소', date: '2026-04-08', amount: 40000, done: false },
  { house: '샤네', worker: '이인실', type: '정기청소', date: '2026-04-09', amount: 40000, done: false },
  { house: '청량', worker: '이인실', type: '정기청소', date: '2026-04-15', amount: 40000, done: false },
  { house: '워너비', worker: '이인실', type: '정기청소', date: '2026-04-16', amount: 40000, done: false },
  { house: '선릉', worker: '이인실', type: '정기청소', date: '2026-04-16', amount: 40000, done: false },
  { house: '아현', worker: '이인실', type: '정기청소', date: '2026-04-17', amount: 40000, done: false },
  { house: '낙성', worker: '이인실', type: '정기청소', date: '2026-04-17', amount: 40000, done: false },
  { house: '영동', worker: '이인실', type: '정기청소', date: '2026-04-22', amount: 50000, done: false },
  { house: '이문', worker: '이인실', type: '정기청소', date: '2026-04-23', amount: 50000, done: false },
  { house: '쌍용', worker: '이인실', type: '정기청소', date: '2026-04-24', amount: 50000, done: false },
  { house: '영이', worker: '이인실', type: '정기청소', date: '2026-04-30', amount: 0, done: false, memo: '4월 입주시 청소' },
  { house: '대학', worker: '이인실', type: '정기청소', date: '2026-04-30', amount: 0, done: false, memo: '4월 입주시 청소' },
  { house: '영영2', worker: '이인실', type: '정기청소', date: '2026-04-30', amount: 0, done: false, memo: '4월 입주시 청소' },
  { house: '삼중', worker: '이미경', type: '정기청소', date: '2026-03-05', amount: 60000, done: true },
  { house: '반포', worker: '이미경', type: '정기청소', date: '2026-03-11', amount: 60000, done: true },
  { house: '신사', worker: '이미경', type: '정기청소', date: '2026-03-13', amount: 50000, done: true },
  { house: '브루', worker: '이미경', type: '정기청소', date: '2026-03-18', amount: 40000, done: true },
  { house: '샤샤', worker: '이미경', type: '정기청소', date: '2026-03-18', amount: 40000, done: true },
  { house: '와이지', worker: '이미경', type: '정기청소', date: '2026-03-19', amount: 40000, done: true },
  { house: '숙녀', worker: '이미경', type: '정기청소', date: '2026-03-20', amount: 40000, done: true },
  { house: '광흥', worker: '이미경', type: '정기청소', date: '2026-03-25', amount: 40000, done: true },
  { house: '당산', worker: '이미경', type: '정기청소', date: '2026-03-26', amount: 40000, done: true },
  { house: '샤샤', worker: '이미경', type: '정기청소', date: '2026-03-27', amount: 40000, done: true },
  { house: '신사', worker: '이미경', type: '정기청소', date: '2026-03-27', amount: 50000, done: true },
  { house: '삼중', worker: '이미경', type: '정기청소', date: '2026-03-31', amount: 60000, done: true },
  { house: '반포', worker: '이미경', type: '정기청소', date: '2026-03-31', amount: 60000, done: true },
  { house: '삼중', worker: '이미경', type: '정기청소', date: '2026-04-02', amount: 60000, done: false },
  { house: '트리', worker: '이미경', type: '입주청소', date: '2026-04-03', amount: 30000, done: false, memo: '김혜연 입주청소' },
  { house: '반포', worker: '이미경', type: '정기청소', date: '2026-04-08', amount: 60000, done: false },
  { house: '신사', worker: '이미경', type: '정기청소', date: '2026-04-10', amount: 50000, done: false },
  { house: '브루', worker: '이미경', type: '정기청소', date: '2026-04-15', amount: 40000, done: false },
  { house: '샤샤', worker: '이미경', type: '정기청소', date: '2026-04-15', amount: 40000, done: false },
  { house: '와이지', worker: '이미경', type: '정기청소', date: '2026-04-16', amount: 40000, done: false },
  { house: '숙녀', worker: '이미경', type: '정기청소', date: '2026-04-17', amount: 40000, done: false },
  { house: '광흥', worker: '이미경', type: '정기청소', date: '2026-04-22', amount: 40000, done: false },
  { house: '당산', worker: '이미경', type: '정기청소', date: '2026-04-23', amount: 40000, done: false },
  { house: '샤샤', worker: '이미경', type: '정기청소', date: '2026-04-24', amount: 40000, done: false },
  { house: '트리', worker: '이미경', type: '입주청소', date: '2026-04-26', amount: 40000, done: false, memo: '4월 입주시 청소' },
  { house: '신사', worker: '이미경', type: '정기청소', date: '2026-04-28', amount: 50000, done: false },
  { house: '삼중', worker: '이미경', type: '정기청소', date: '2026-04-29', amount: 60000, done: false },
  { house: '반포', worker: '이미경', type: '정기청소', date: '2026-04-30', amount: 60000, done: false },
  { house: '영이', worker: '이한나', type: '정기청소', date: '2026-03-06', amount: 40000, done: true },
  { house: '영삼', worker: '이한나', type: '정기청소', date: '2026-03-06', amount: 40000, done: true },
  { house: '영영1', worker: '이한나', type: '정기청소', date: '2026-03-12', amount: 40000, done: true },
  { house: '당산', worker: '이한나', type: '정기청소', date: '2026-03-13', amount: 40000, done: true },
  { house: '영영2', worker: '이한나', type: '정기청소', date: '2026-03-19', amount: 40000, done: true },
  { house: '영이', worker: '이한나', type: '정기청소', date: '2026-03-25', amount: 40000, done: true },
  { house: '영삼', worker: '이한나', type: '정기청소', date: '2026-03-26', amount: 40000, done: true },
  { house: '영이', worker: '이한나', type: '정기청소', date: '2026-04-03', amount: 40000, done: false },
  { house: '영삼', worker: '이한나', type: '정기청소', date: '2026-04-09', amount: 40000, done: false },
  { house: '영영1', worker: '이한나', type: '정기청소', date: '2026-04-10', amount: 40000, done: false },
  { house: '당산', worker: '이한나', type: '정기청소', date: '2026-04-16', amount: 40000, done: false },
  { house: '영영2', worker: '이한나', type: '정기청소', date: '2026-04-23', amount: 40000, done: false },
  { house: '영이', worker: '이한나', type: '정기청소', date: '2026-04-30', amount: 40000, done: false },
  { house: '워너비', worker: '진진수', type: '수리', date: '2026-03-08', amount: 50000, done: true, memo: '보일러 수리' },
  { house: '반포', worker: '진진수', type: '수리', date: '2026-03-14', amount: 80000, done: true, memo: '도어락 교체' },
  { house: '삼중', worker: '진진수', type: '수리', date: '2026-03-20', amount: 60000, done: true, memo: '에어컨 수리' },
  { house: '이문', worker: '진진수', type: '수리', date: '2026-03-25', amount: 40000, done: true, memo: '형광등 교체' },
  { house: '광흥', worker: '진진수', type: '수리', date: '2026-04-05', amount: 70000, done: false, memo: '수도 누수' },
  { house: '신사', worker: '진진수', type: '수리', date: '2026-04-12', amount: 50000, done: false, memo: '도어락 수리' },
  { house: '당산', worker: '진진수', type: '수리', date: '2026-04-20', amount: 60000, done: false, memo: '보일러 점검' },
];

// 기존 데이터 확인 (중복 방지)
const existing = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID, range: '용역!A2:K'
});
const existingRows = existing.data.values || [];
const existingKeys = new Set(existingRows.map(r => `${r[1]}_${r[2]}_${r[4]}`));

const today = '2026-04-07';
const newRows = [];
const counts = {};

for (const s of schedules) {
  const key = `${s.worker}_${s.house}_${s.date}`;
  if (existingKeys.has(key)) continue;

  const isDone = s.done || s.date < today;
  const doneAt = isDone ? s.date : '';
  const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;

  newRows.push([id, s.worker, s.house, s.type, s.date, isDone ? 'Y' : 'N', s.amount, '', s.memo || '', '', today]);

  const month = s.date.slice(0, 7);
  const k = `${s.worker}_${month}`;
  counts[k] = (counts[k] || 0) + 1;
}

if (newRows.length > 0) {
  // Batch append in chunks of 20
  for (let i = 0; i < newRows.length; i += 20) {
    const chunk = newRows.slice(i, i + 20);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: '용역!A:K',
      valueInputOption: 'RAW',
      requestBody: { values: chunk }
    });
    console.log(`배치 ${Math.floor(i/20)+1}: ${chunk.length}건 추가`);
    if (i + 20 < newRows.length) await new Promise(r => setTimeout(r, 2000));
  }
}

console.log(`\n✅ 총 ${newRows.length}건 등록 완료\n`);

console.log('=== 담당자별 건수 ===');
Object.entries(counts).sort().forEach(([k, v]) => console.log(`${k}: ${v}건`));

const mar_inshil = schedules.filter(s => s.worker === '이인실' && s.date.startsWith('2026-03')).reduce((sum, s) => sum + s.amount, 0);
const mar_mikyung = schedules.filter(s => s.worker === '이미경' && s.date.startsWith('2026-03')).reduce((sum, s) => sum + s.amount, 0);
const mar_hanna = schedules.filter(s => s.worker === '이한나' && s.date.startsWith('2026-03')).reduce((sum, s) => sum + s.amount, 0);
const mar_jinsu = schedules.filter(s => s.worker === '진진수' && s.date.startsWith('2026-03')).reduce((sum, s) => sum + s.amount, 0);
console.log(`\n=== 3월 합계 ===`);
console.log(`이인실: ${mar_inshil.toLocaleString()}원`);
console.log(`이미경: ${mar_mikyung.toLocaleString()}원`);
console.log(`이한나: ${mar_hanna.toLocaleString()}원`);
console.log(`진진수: ${mar_jinsu.toLocaleString()}원`);
