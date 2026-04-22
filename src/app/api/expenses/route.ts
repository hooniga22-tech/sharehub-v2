import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `exp_${Date.now()}`
    const date = body.date || new Date().toISOString().slice(0, 10)
    const ym = date.slice(0, 7)

    let branchId: string | null = null
    if (body.houseName) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.houseName).limit(1).single()
      branchId = b?.id || null
    }

    let categoryId: string | null = null
    if (body.category) {
      const { data: c } = await supabase.from('expense_categories').select('id').eq('label_ko', body.category).limit(1).single()
      categoryId = c?.id || null
    }

    await supabase.from('expenses').insert({
      id, branch_id: branchId || '', category_id: categoryId || '',
      category_free_text: body.type || body.category || '',
      paid_date: date, year_month: ym, amount: Number(body.amount) || 0,
      memo: body.memo || null,
    })
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

    const supabase = createAdminClient()
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
