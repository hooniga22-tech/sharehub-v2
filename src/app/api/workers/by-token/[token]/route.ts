import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data: w, error } = await supabase
      .from('workers').select('*').eq('access_token', token).single()
    if (error || !w) return NextResponse.json({ error: 'invalid token' }, { status: 404 })

    const worker = { name: w.name, type: w.category || '', token: w.access_token || '' }

    // 지점 정보 맵
    const branches = await listOrEmpty<any>(supabase.from('branches').select('id, name, address, door_code, memo'))
    type HouseInfo = { address: string; doorCode: string; houseMemo: string }
    const houseMap = new Map<string, HouseInfo>()
    const branchIdToName = new Map<string, string>()
    for (const b of branches) {
      if (b.name) houseMap.set(b.name, { address: b.address || '', doorCode: b.door_code || '', houseMemo: b.memo || '' })
      branchIdToName.set(b.id, b.name || '')
    }

    // 스케줄 (issues 테이블)
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let query = supabase.from('issues').select('id, scheduled_date, branch_id, category, cost, memo, description, status')
      .eq('worker_id', w.id)

    if (year && month) {
      const m = String(month).padStart(2, '0')
      const startDate = `${year}-${m}-01`
      const nextMonth = Number(m) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(m) + 1).padStart(2, '0')}-01`
      query = query.gte('scheduled_date', startDate).lt('scheduled_date', nextMonth)
    }

    const issues = await listOrEmpty<any>(query)
    const schedules = issues.map(r => {
      const houseName = branchIdToName.get(r.branch_id) || ''
      const hi = houseMap.get(houseName) || { address: '', doorCode: '', houseMemo: '' }
      return {
        id: r.id || '', date: r.scheduled_date || '', houseName,
        workerName: worker.name, type: r.category || '',
        amount: Number(r.cost) || 0, memo: r.memo || '',
        request: r.description || '', isDone: r.status === 'done',
        address: hi.address, doorCode: hi.doorCode, houseMemo: hi.houseMemo,
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ worker, schedules })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
