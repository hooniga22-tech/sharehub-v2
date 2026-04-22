import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

const KO_CODE: Record<string, string> = { '전기': 'electricity', '가스': 'gas', '수도': 'water', '인터넷': 'internet', '정수기': 'water_purifier', '청소': 'cleaning', '기타': 'other' }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    // id로 기존 expense 찾기 → branch_id, year_month 확인
    const { data: existing, error } = await supabase.from('expenses').select('branch_id, year_month').eq('id', id).single()
    if (error || !existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const branchId = existing.branch_id
    const ym = existing.year_month
    const cats = await listOrEmpty<any>(supabase.from('expense_categories').select('id, code'))
    const catMap = new Map(cats.map((c: any) => [c.code, c.id]))

    const fields: Record<string, number> = {}
    if (body.electricity !== undefined) fields.electricity = Number(body.electricity) || 0
    if (body.gas !== undefined) fields.gas = Number(body.gas) || 0
    if (body.water !== undefined) fields.water = Number(body.water) || 0
    if (body.internet !== undefined) fields.internet = Number(body.internet) || 0
    if (body.waterPurifier !== undefined) fields.water_purifier = Number(body.waterPurifier) || 0
    if (body.cleaning !== undefined) fields.cleaning = Number(body.cleaning) || 0
    if (body.others !== undefined) fields.other = Number(body.others) || 0

    for (const [code, amount] of Object.entries(fields)) {
      const catId = catMap.get(code)
      if (!catId) continue

      const rows = await listOrEmpty<any>(
        supabase.from('expenses').select('id').eq('branch_id', branchId).eq('year_month', ym).eq('category_id', catId)
      )
      if (rows.length > 0) {
        await supabase.from('expenses').update({ amount, memo: body.memo || null }).eq('id', rows[0].id)
      } else if (amount > 0) {
        await supabase.from('expenses').insert({
          id: `util_${Date.now()}_${code}`, branch_id: branchId, category_id: catId,
          year_month: ym, amount, paid_date: new Date().toISOString().slice(0, 10),
          memo: body.memo || null,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
