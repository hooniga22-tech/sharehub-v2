import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  })
  return (res.data.values || []).slice(1)
}

export async function appendRow(sheetName: string, row: (string | number)[]): Promise<void> {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function updateRow(sheetName: string, rowIndex: number, row: (string | number)[]): Promise<void> {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function getUtilityCosts(): Promise<string[][]> {
  return getSheetData('공과금')
}

export async function addUtilityCost(row: (string | number)[]): Promise<void> {
  return appendRow('공과금', row)
}

export async function updateUtilityCost(rowIndex: number, row: (string | number)[]): Promise<void> {
  return updateRow('공과금', rowIndex, row)
}
