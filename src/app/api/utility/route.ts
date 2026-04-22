import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

const CODE_KO: Record<string, string> = { electricity: '전기', gas: '가스', water: '수도', internet: '인터넷', water_purifier: '정수기' }
const KO_CODE: Record<string, string> = Object.fromEntries(Object.entries(CODE_KO).map(([k, v]) => [v, k]))

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
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

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const ym = `${body.연도}-${String(body.월).padStart(2, '0')}`

    const { data: branch } = await supabase.from('branches').select('id').eq('name', body.지점명).limit(1).single()
    if (!branch) return NextResponse.json({ error: 'branch not found' }, { status: 404 })

    const cats = await listOrEmpty<any>(supabase.from('expense_categories').select('id, code'))
    const catMap = new Map(cats.map((c: any) => [c.code, c.id]))

    let mode = 'create'
    for (const koName of ['전기', '가스', '수도', '인터넷', '정수기']) {
      const val = body[koName]
      if (val === undefined) continue
      const code = KO_CODE[koName]
      const catId = catMap.get(code)
      if (!catId) continue
      const amount = Number(val) || 0

      const existing = await listOrEmpty<any>(
        supabase.from('expenses').select('id').eq('branch_id', branch.id).eq('year_month', ym).eq('category_id', catId)
      )
      if (existing.length > 0) {
        await supabase.from('expenses').update({ amount, memo: body.메모 || null }).eq('id', existing[0].id)
        mode = 'update'
      } else if (amount > 0) {
        await supabase.from('expenses').insert({
          id: `util_${Date.now()}_${code}`, branch_id: branch.id, category_id: catId,
          year_month: ym, amount, paid_date: new Date().toISOString().slice(0, 10),
          memo: body.메모 || null,
        })
      }
    }

    return NextResponse.json({ success: true, mode })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()

    // ID로 기존 row 찾기
    const { data: existing, error } = await supabase.from('expenses').select('*, expense_categories(code)').eq('id', body.ID).single()
    if (error || !existing) return NextResponse.json({ error: '없음' }, { status: 404 })

    const ym = existing.year_month
    const branchId = existing.branch_id
    const cats = await listOrEmpty<any>(supabase.from('expense_categories').select('id, code'))
    const catMap = new Map(cats.map((c: any) => [c.code, c.id]))

    // 각 공과금 항목 업데이트
    for (const koName of ['전기', '가스', '수도', '인터넷', '정수기']) {
      if (body[koName] === undefined) continue
      const code = KO_CODE[koName]
      const catId = catMap.get(code)
      if (!catId) continue
      const amount = Number(body[koName]) || 0

      const rows = await listOrEmpty<any>(
        supabase.from('expenses').select('id').eq('branch_id', branchId).eq('year_month', ym).eq('category_id', catId)
      )
      if (rows.length > 0) {
        await supabase.from('expenses').update({ amount, memo: body.메모 || null }).eq('id', rows[0].id)
      } else if (amount > 0) {
        await supabase.from('expenses').insert({
          id: `util_${Date.now()}_${code}`, branch_id: branchId, category_id: catId,
          year_month: ym, amount, paid_date: new Date().toISOString().slice(0, 10),
          memo: body.메모 || null,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
