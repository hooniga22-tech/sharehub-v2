import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

const UTIL_CODES = ['electricity', 'gas', 'water', 'internet', 'water_purifier', 'cleaning', 'other'] as const
const CODE_KO: Record<string, string> = { electricity: '전기', gas: '가스', water: '수도', internet: '인터넷', water_purifier: '정수기', cleaning: '청소', other: '기타' }
const KO_CODE: Record<string, string> = Object.fromEntries(Object.entries(CODE_KO).map(([k, v]) => [v, k]))

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)
    const ym = `${year}-${String(month).padStart(2, '0')}`

    const supabase = createAdminClient()
    const [branches, expenseRows] = await Promise.all([
      listOrEmpty<any>(supabase.from('branches').select('id, name, district')),
      listOrEmpty<any>(supabase.from('expenses').select('*, expense_categories(code)').eq('year_month', ym)),
    ])

    const utilCodes = new Set<string>(UTIL_CODES)
    const byBranch = new Map<string, Record<string, number>>()
    for (const e of expenseRows) {
      const code = e.expense_categories?.code
      if (!code || !utilCodes.has(code)) continue
      const bid = e.branch_id
      if (!byBranch.has(bid)) byBranch.set(bid, {})
      const key = CODE_KO[code] || '기타'
      byBranch.get(bid)![key] = (byBranch.get(bid)![key] || 0) + (e.amount || 0)
    }

    const districtMap = new Map<string, any[]>()
    for (const b of branches) {
      const d = b.district || '기타'
      if (!districtMap.has(d)) districtMap.set(d, [])
      const data = byBranch.get(b.id) || {}
      const hasData = Object.keys(data).length > 0
      const total = Object.values(data).reduce((s: number, v) => s + ((v as number) || 0), 0)
      districtMap.get(d)!.push({ houseName: b.name, hasData, ...Object.fromEntries(['전기', '가스', '수도', '인터넷', '정수기', '기타'].map(k => [k, data[k] || 0])), total })
    }

    let totalAmount = 0, completedCount = 0, missingCount = 0
    const districts = [...districtMap.entries()].map(([name, houses]) => {
      const dt = houses.reduce((s: number, h: any) => s + h.total, 0)
      const cc = houses.filter((h: any) => h.hasData).length
      const mc = houses.filter((h: any) => !h.hasData).length
      totalAmount += dt; completedCount += cc; missingCount += mc
      return { name, houses, totalAmount: dt, completedCount: cc, missingCount: mc }
    })

    return NextResponse.json({ districts, summary: { totalAmount, completedCount, missingCount } })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { houseName, year: y, month: m, ...fields } = body
    const supabase = createAdminClient()
    const ym = `${y}-${String(m).padStart(2, '0')}`

    const { data: branch } = await supabase.from('branches').select('id').eq('name', houseName).limit(1).single()
    if (!branch) return NextResponse.json({ error: 'branch not found' }, { status: 404 })

    // 카테고리 ID 맵 로드
    const cats = await listOrEmpty<any>(supabase.from('expense_categories').select('id, code'))
    const catMap = new Map(cats.map((c: any) => [c.code, c.id]))

    // 각 공과금 항목을 upsert
    for (const [koName, value] of Object.entries(fields)) {
      if (koName === '메모') continue
      const code = KO_CODE[koName]
      if (!code) continue
      const amount = Number(value) || 0
      if (amount === 0) continue

      const catId = catMap.get(code)
      if (!catId) continue

      // 기존 row 확인
      const existing = await listOrEmpty<any>(
        supabase.from('expenses').select('id').eq('branch_id', branch.id).eq('year_month', ym).eq('category_id', catId)
      )
      if (existing.length > 0) {
        await supabase.from('expenses').update({ amount, memo: fields['메모'] || null }).eq('id', existing[0].id)
      } else {
        await supabase.from('expenses').insert({
          id: `util_${Date.now()}_${code}`, branch_id: branch.id, category_id: catId,
          year_month: ym, amount, paid_date: new Date().toISOString().slice(0, 10),
          memo: fields['메모'] || null,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
