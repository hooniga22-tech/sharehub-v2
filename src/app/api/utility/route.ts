import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

const codeMap: Record<string, string> = { electricity: '전기', gas: '가스', water: '수도', internet: '인터넷', water_purifier: '정수기' }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const house = searchParams.get('house')

    const supabase = createAdminClient()
    let query = supabase.from('expenses').select('*, branches(name), expense_categories(code)')
    if (year && month) query = query.eq('year_month', `${year}-${String(month).padStart(2, '0')}`)
    if (house) query = query.eq('branches.name', house)

    const rows = await listOrEmpty<any>(query)
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, ID: r.id || '', 지점명: r.branches?.name || '',
      연도: r.year_month?.split('-')[0] || '', 월: String(Number(r.year_month?.split('-')[1]) || ''),
      전기: r.expense_categories?.code === 'electricity' ? String(r.amount) : '',
      가스: r.expense_categories?.code === 'gas' ? String(r.amount) : '',
      수도: r.expense_categories?.code === 'water' ? String(r.amount) : '',
      인터넷: r.expense_categories?.code === 'internet' ? String(r.amount) : '',
      정수기: r.expense_categories?.code === 'water_purifier' ? String(r.amount) : '',
      메모: r.memo || '',
    })))
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

// POST/PUT는 Step 4.5 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rows = await getSheetData('공과금')
    const idx = rows.findIndex(r => r[1] === body.지점명 && r[2] === body.연도 && r[3] === body.월)
    if (idx >= 0) {
      const e = rows[idx]
      await updateRow('공과금', idx, [e[0], body.지점명, body.연도, body.월, body.전기 ?? e[4], body.가스 ?? e[5], body.수도 ?? e[6], body.인터넷 ?? e[7], body.정수기 ?? e[8], body.메모 ?? (e[9] || '')])
      return NextResponse.json({ success: true, mode: 'update' })
    }
    const id = `util_${Date.now()}`
    await appendRow('공과금', [id, body.지점명, body.연도, body.월, body.전기 || 0, body.가스 || 0, body.수도 || 0, body.인터넷 || 0, body.정수기 || 0, body.메모 || ''])
    return NextResponse.json({ success: true, mode: 'create', id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const rows = await getSheetData('공과금')
    const idx = rows.findIndex(r => r[0] === body.ID)
    if (idx === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[idx]
    await updateRow('공과금', idx, [e[0], e[1], e[2], e[3], body.전기 ?? e[4], body.가스 ?? e[5], body.수도 ?? e[6], body.인터넷 ?? e[7], body.정수기 ?? e[8], body.메모 ?? (e[9] || '')])
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
