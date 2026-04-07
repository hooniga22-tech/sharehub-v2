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

// 헤더 세팅
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: '투자자!A1:I1',
  valueInputOption: 'RAW',
  requestBody: {
    values: [[
      '투자자ID', '투자자명', '지점ID', '지점명', '투자비율', '링크토큰', '연락처', '메모', '등록일'
    ]]
  }
});

// 기존 데이터 확인
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '투자자!A:I',
});
const rows = res.data.values || [];
console.log(`현재 투자자 데이터: ${rows.length - 1}명`);

// 데이터 없으면 샘플 추가
if (rows.length <= 1) {
  const token = Math.random().toString(36).slice(2, 10);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: '투자자!A:I',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'inv_001', '강연수', 'house_001', '워너비', 70, token,
        '010-9207-2588', '워너비 투자자', new Date().toISOString().split('T')[0]
      ]]
    }
  });
  console.log('✅ 샘플 투자자 추가:', token);
  console.log('접속 URL: https://sharehub-v2.vercel.app/investor/' + token);
} else {
  for (let i = 1; i < rows.length; i++) {
    console.log(`투자자: ${rows[i][1]} / 지점: ${rows[i][3]} / 토큰: ${rows[i][5]}`);
  }
}
