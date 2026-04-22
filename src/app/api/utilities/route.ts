import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

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

    const codeMap: Record<string, string> = { electricity: '전기', gas: '가스', water: '수도', internet: '인터넷', water_purifier: '정수기', cleaning: '청소', other: '기타' }
    const utilCodes = new Set(Object.keys(codeMap))

    const byBranch = new Map<string, Record<string, number>>()
    for (const e of expenseRows) {
      const code = e.expense_categories?.code
      if (!code || !utilCodes.has(code)) continue
      const bid = e.branch_id
      if (!byBranch.has(bid)) byBranch.set(bid, {})
      const key = codeMap[code] || '기타'
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
      const dt = houses.reduce((s, h) => s + h.total, 0)
      const cc = houses.filter(h => h.hasData).length
      const mc = houses.filter(h => !h.hasData).length
      totalAmount += dt; completedCount += cc; missingCount += mc
      return { name, houses, totalAmount: dt, completedCount: cc, missingCount: mc }
    })

    return NextResponse.json({ districts, summary: { totalAmount, completedCount, missingCount } })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST는 Step 4.5 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { houseName, year: y, month: m, ...fields } = body
    const rows = await getSheetData('공과금')
    const idx = rows.findIndex(r => r[1] === houseName && r[2] === String(y) && r[3] === String(m))
    if (idx >= 0) {
      const e = rows[idx]
      await updateRow('공과금', idx, [e[0], houseName, String(y), String(m), fields['전기'] ?? e[4], fields['가스'] ?? e[5], fields['수도'] ?? e[6], fields['인터넷'] ?? e[7], fields['정수기'] ?? e[8], fields['메모'] ?? (e[9] || ''), fields['청소'] ?? (e[10] || ''), fields['기타'] ?? (e[11] || ''), '', new Date().toISOString().slice(0, 10)])
    } else {
      await appendRow('공과금', [`util_${Date.now()}`, houseName, String(y), String(m), fields['전기'] || 0, fields['가스'] || 0, fields['수도'] || 0, fields['인터넷'] || 0, fields['정수기'] || 0, '', fields['청소'] || 0, fields['기타'] || 0, '', new Date().toISOString().slice(0, 10)])
    }
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
