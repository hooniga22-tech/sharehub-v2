import { NextResponse } from 'next/server'
import { getSheetData, appendRow, deleteRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)
    const ym = `${year}-${month.padStart(2, '0')}`

    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(
      supabase.from('expenses').select('*, branches(name), expense_categories(code, label_ko)').eq('year_month', ym)
    )

    const items = rows.map(r => ({
      id: r.id || '', date: r.paid_date || '', type: r.category_free_text || '지점별',
      houseName: r.branches?.name || '', category: r.expense_categories?.label_ko || r.category_free_text || '',
      amount: r.amount || 0, memo: r.memo || '',
    }))

    const houseTotal = items.filter(i => i.type === '지점별').reduce((s, i) => s + i.amount, 0)
    const opsTotal = items.filter(i => i.type !== '지점별').reduce((s, i) => s + i.amount, 0)

    return NextResponse.json({
      items, summary: { houseTotal, opsTotal, total: houseTotal + opsTotal, count: items.length },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/DELETE는 Step 4.5에서 전환 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `exp_${Date.now()}`
    await appendRow('운영지출', [id, body.date || '', body.type || '', body.houseName || '', body.category || '', body.amount || 0, body.memo || ''])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const rows = await getSheetData('운영지출')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await deleteRow('운영지출', idx)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
