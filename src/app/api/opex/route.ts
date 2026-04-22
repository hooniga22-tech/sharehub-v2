import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const house = searchParams.get('house') || searchParams.get('houseName')
    const category = searchParams.get('category')

    const supabase = createAdminClient()
    let query = supabase.from('expenses').select('*, branches(name), expense_categories(label_ko)')

    if (year && month) query = query.eq('year_month', `${year}-${String(month).padStart(2, '0')}`)
    else if (year) query = query.like('year_month', `${year}%`)

    const rows = await listOrEmpty<any>(query)
    let items = rows.map((r, i) => ({
      _rowIndex: i, 지출ID: r.id || '', 지점명: r.branches?.name || '',
      날짜: r.paid_date || '', 카테고리: r.expense_categories?.label_ko || r.category_free_text || '',
      금액: String(r.amount || 0), 내용: r.vendor || '', 담당자: '', 메모: r.memo || '',
    }))

    if (house) items = items.filter(i => i.지점명 === house)
    if (category) items = items.filter(i => i.카테고리 === category)
    items.sort((a, b) => b.날짜.localeCompare(a.날짜))

    return NextResponse.json(items)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/DELETE는 Step 4.5 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `opex_${Date.now()}`
    await appendRow('운영지출', [id, body.지점명 || '', body.날짜 || '', body.카테고리 || '', body.금액 || 0, body.내용 || '', body.담당자 || '', body.메모 || ''])
    return NextResponse.json({ success: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const rows = await getSheetData('운영지출')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await updateRow('운영지출', idx, ['deleted', '', '', '', '', '', '', ''])
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
