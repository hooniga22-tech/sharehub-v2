import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
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

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `opex_${Date.now()}`
    const date = body.날짜 || new Date().toISOString().slice(0, 10)
    const ym = date.slice(0, 7)

    let branchId: string | null = null
    if (body.지점명) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.지점명).limit(1).single()
      branchId = b?.id || null
    }

    let categoryId: string | null = null
    if (body.카테고리) {
      const { data: c } = await supabase.from('expense_categories').select('id').eq('label_ko', body.카테고리).limit(1).single()
      categoryId = c?.id || null
    }

    await supabase.from('expenses').insert({
      id, branch_id: branchId || '', category_id: categoryId || '',
      category_free_text: body.카테고리 || '', paid_date: date, year_month: ym,
      amount: Number(body.금액) || 0, vendor: body.내용 || null, memo: body.메모 || null,
    })
    return NextResponse.json({ success: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
