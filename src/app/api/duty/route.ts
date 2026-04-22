import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

function getMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const mon = new Date(now)
  mon.setDate(now.getDate() - diff)
  return mon.toISOString().slice(0, 10)
}

function parseMemo(memo: string | null): Record<string, string> {
  if (!memo) return {}
  try { return JSON.parse(memo) } catch { return { 메모: memo } }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    if (!house) return NextResponse.json({ error: 'house 필수' }, { status: 400 })

    const supabase = createAdminClient()
    const branches = await listOrEmpty<any>(supabase.from('branches').select('id, name').eq('name', house))
    const branchId = branches[0]?.id
    if (!branchId) {
      return NextResponse.json({ duties: [], thisWeek: getMonday() })
    }

    const rows = await listOrEmpty<any>(
      supabase.from('duty_schedules').select('*, tenants(name, rooms(room_code))').eq('branch_id', branchId).order('duty_week_start')
    )

    const duties = rows.map((r, i) => {
      const extra = parseMemo(r.memo)
      return {
        _rowIndex: i, 당번ID: r.id || '', 지점명: house,
        주차시작일: r.duty_week_start || '', 방코드: r.tenants?.rooms?.room_code || '',
        입주자명: r.tenants?.name || '', 당번유형: extra.당번유형 || '당번',
        완료여부: extra.완료여부 || '예정', 완료일시: extra.완료일시 || '',
        완료처리자: extra.완료처리자 || '',
        면제여부: extra.면제여부 || 'N', 면제사유: extra.면제사유 || '',
        메모: extra.메모 || '',
      }
    })

    return NextResponse.json({ duties, thisWeek: getMonday() })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    async function insertDuty(d: any) {
      const id = d.당번ID || `duty_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      // lookup branch_id
      let branchId: string | null = null
      if (d.지점명) {
        const { data: b } = await supabase.from('branches').select('id').eq('name', d.지점명).limit(1).single()
        branchId = b?.id || null
      }
      // lookup tenant_id by name + branch
      let tenantId: string | null = null
      if (d.입주자명 && branchId) {
        const { data: t } = await supabase.from('tenants').select('id').eq('name', d.입주자명).eq('branch_id', branchId).limit(1).single()
        tenantId = t?.id || null
      }
      if (!branchId || !tenantId) return id

      const extra = JSON.stringify({
        당번유형: d.당번유형 || '당번', 완료여부: d.완료여부 || '예정',
        완료일시: '', 완료처리자: '', 면제여부: 'N', 면제사유: '', 메모: '',
      })
      await supabase.from('duty_schedules').insert({
        id, branch_id: branchId, tenant_id: tenantId,
        duty_week_start: d.주차시작일 || getMonday(), memo: extra,
      })
      return id
    }

    if (body.batch && Array.isArray(body.duties)) {
      for (const d of body.duties) { await insertDuty(d) }
      return NextResponse.json({ success: true, count: body.duties.length })
    }
    const id = await insertDuty(body)
    return NextResponse.json({ success: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()

    // 기존 row 가져오기
    const { data: existing, error } = await supabase.from('duty_schedules').select('*').eq('id', id).single()
    if (error || !existing) return NextResponse.json({ error: '없음' }, { status: 404 })

    const prev = parseMemo(existing.memo)
    const done = data.완료여부 ?? prev.완료여부 ?? '예정'
    const doneAt = done === '완료'
      ? (data.완료일시 ?? new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))
      : (data.완료일시 ?? prev.완료일시 ?? '')

    const extra = JSON.stringify({
      당번유형: prev.당번유형 || '당번',
      완료여부: done, 완료일시: doneAt,
      완료처리자: data.완료처리자 ?? prev.완료처리자 ?? '',
      면제여부: data.면제여부 ?? prev.면제여부 ?? 'N',
      면제사유: data.면제사유 ?? prev.면제사유 ?? '',
      메모: data.메모 ?? prev.메모 ?? '',
    })

    await supabase.from('duty_schedules').update({ memo: extra }).eq('id', id)
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
