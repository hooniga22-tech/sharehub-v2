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

// 지점명: [현관비번, 와이파이SSID, 와이파이PW]
const DOOR_DATA = {
  '워너비':  ['4786*', '', '기계에 써 있음'],
  '영동':    ['0308', '', '기계에 써 있음'],
  '삼중':    ['8089별', '', '기계에 써 있음'],
  '반포':    ['9250별', '', '기계에 써 있음'],
  '신사':    ['0308별', '', '기계에 써 있음'],
  '선릉':    ['3971별', '', '기계에 써 있음'],
  '대학':    ['8299별', '', '기계에 써 있음'],
  '낙성':    ['0852+*', '', '기계에 써 있음'],
  '쌍용':    ['97959795* (1층:8277)', '', '기계에 써 있음'],
  '이문':    ['997001 (1층:9252)', '', '기계에 써 있음'],
  '빠방':    ['0852+*', '', '기계에 써 있음'],
  '휘경':    ['0852별', '', '기계에 써 있음'],
  '회기':    ['', '', '기계에 써 있음'],
  '시립':    ['2580', '', '기계에 써 있음'],
  '외대':    ['2580*', '', '기계에 써 있음'],
  '광흥':    ['현관 3567호출 / 102호 2486*', '', '기계에 써 있음'],
  '와이지':  ['별02941별', '', '기계에 써 있음'],
  '샛별':    ['3456별 (중문:9267별)', '', '비번없음(3개)'],
  '신촌':    ['2580별', '', '기계에 써 있음'],
  '아현':    ['15987*', '', '기계에 써 있음'],
  '소녀':    ['', '', '기계에 써 있음'],
  '허브':    ['', '', '기계에 써 있음'],
  '단짠':    ['3179*', '', '기계에 써 있음'],
  '다정':    ['1006별 (대문:246)', 'TP-Link_3850', '90323744'],
  '아리':    ['6589별', '', '기계에 써 있음'],
  '한성':    ['4148별', '', '기계에 써 있음'],
  '상상':    ['0308*', '', '기계에 써 있음'],
  '샤샤':    ['497012*', 'atti7777', '92072588'],
  '샤네':    ['', '', '기계에 써 있음'],
  '브루':    ['1578*', 'netis', '01086828299'],
  '영삼':    ['9250별 (1층:8253별)', '', '기계에 써 있음'],
  '영이':    ['0276별 (1층:8253별)', '', '기계에 써 있음'],
  '영영1':   ['4578별', '', '기계에 써 있음'],
  '영영2':   ['1701별', '', '기계에 써 있음'],
  '트리':    ['0692별', '', '기계에 써 있음'],
  '당산':    ['1379*', '', '기계에 써 있음'],
  '숙녀':    ['2588*', '', '기계에 써 있음'],
  '동동':    ['143213별', '', '기계에 써 있음'],
  '동지':    ['494838별', '', '기계에 써 있음'],
  '동일':    ['259356별', '', '기계에 써 있음'],
  '동이':    ['1379별', '', '기계에 써 있음'],
  '동삼':    ['552755별', '', '기계에 써 있음'],
};

const auth = await getAuth();
const sheets = google.sheets({ version: 'v4', auth });

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '지점!A:N',
});

const rows = res.data.values || [];
const updates = [];

for (let i = 1; i < rows.length; i++) {
  const name = rows[i][1]?.trim();
  if (!name || !DOOR_DATA[name]) {
    if (name) console.log(`⚠️  ${name}: 데이터 없음`);
    continue;
  }
  const [door, wifiSsid, wifiPw] = DOOR_DATA[name];
  // E열(4)=현관비번, F열(5)=와이파이SSID, G열(6)=와이파이PW
  updates.push({ range: `지점!E${i+1}`, values: [[door]] });
  updates.push({ range: `지점!F${i+1}`, values: [[wifiSsid]] });
  updates.push({ range: `지점!G${i+1}`, values: [[wifiPw]] });
  console.log(`✅ ${name}: 비번 ${door || '미등록'}`);
}

if (updates.length > 0) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: updates },
  });
}

console.log(`\n총 ${updates.length / 3}개 지점 업데이트 완료`);
console.log('⚠️  회기/샤네/소녀/허브는 비번 미확인 → 앱에서 직접 입력 필요');
