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

export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  // Get sheetId from sheetName
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName)
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet "${sheetName}" not found`)
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex + 1, // +1 for header row
            endIndex: rowIndex + 2,
          },
        },
      }],
    },
  })
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = row[i] || '' })
    return obj
  })
}

export async function getSheetDataWithHeader(sheetName: string): Promise<string[][]> {
  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1:Z`,
  })
  return res.data.values || []
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
