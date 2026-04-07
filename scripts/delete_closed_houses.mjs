import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const DELETE_TARGETS = ['구디', '루프', '무드', '바우', '원효'];

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

const metaRes = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const sheetMeta = {};
for (const s of metaRes.data.sheets) {
  sheetMeta[s.properties.title] = s.properties.sheetId;
}

async function getRows(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return res.data.values || [];
}

async function deleteRows(sheetName, rowIndices) {
  if (rowIndices.length === 0) {
    console.log(`  ${sheetName}: 삭제할 행 없음`);
    return;
  }
  const sheetId = sheetMeta[sheetName];
  const sorted = [...rowIndices].sort((a, b) => b - a);
  const requests = sorted.map(i => ({
    deleteDimension: {
      range: { sheetId, dimension: 'ROWS', startIndex: i, endIndex: i + 1 }
    }
  }));
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests },
  });
}

// 1. 지점 삭제
const houseRows = await getRows('지점');
const deleteHouseIdx = [];
const deletedNames = new Set();
for (let i = 1; i < houseRows.length; i++) {
  const name = houseRows[i][1]?.trim();
  if (DELETE_TARGETS.includes(name)) {
    deleteHouseIdx.push(i);
    deletedNames.add(name);
    console.log(`지점 삭제: ${name}`);
  }
}
await deleteRows('지점', deleteHouseIdx);
console.log(`지점 ${deleteHouseIdx.length}개 삭제\n`);

// 2. 방 삭제
const roomRows = await getRows('방');
const deleteRoomIdx = [];
for (let i = 1; i < roomRows.length; i++) {
  if (deletedNames.has(roomRows[i][2]?.trim())) deleteRoomIdx.push(i);
}
await deleteRows('방', deleteRoomIdx);
console.log(`방 ${deleteRoomIdx.length}개 삭제\n`);

// 3. 입주자 삭제
const tenantRows = await getRows('입주자');
const deleteTenantIdx = [];
for (let i = 1; i < tenantRows.length; i++) {
  const name = tenantRows[i][2]?.trim();
  if (deletedNames.has(name)) {
    deleteTenantIdx.push(i);
  }
}
await deleteRows('입주자', deleteTenantIdx);
console.log(`입주자 ${deleteTenantIdx.length}명 삭제\n`);

console.log('완료!');
console.log(`삭제: ${[...deletedNames].join(', ')}`);
console.log('유지: 와이지, 아리, 한성 (위탁운영)');
