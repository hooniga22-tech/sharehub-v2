import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('용역')
    // row[1] = 담당자명
    const names = [...new Set(rows.map(r => r[1]?.trim()).filter(Boolean))]
    const internal = ['유재훈', '운영팀']
    const all = [...internal, ...names.filter(n => !internal.includes(n))]
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
