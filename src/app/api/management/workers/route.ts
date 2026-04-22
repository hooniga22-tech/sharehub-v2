import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import {
  kstYearMonth, sortWorkers,
  makeStaffId, makeToken,
} from '@/lib/workers-helper'
import type { Worker, WorkerWithStats, WorkerField, WorkerStatus } from '@/types/worker'

function sbToWorker(w: any): Worker {
  return {
    id: w.id || '', name: w.name || '',
    field: (w.category === '수리' ? '수리' : '청소') as WorkerField,
    status: (w.is_active ? '활동중' : '만료') as WorkerStatus,
    phone: w.phone || '', bankName: '', accountNumber: '', holder: '', rrnHead: '',
    baseAmount: w.default_rate || 0, token: w.access_token || '', startDate: '', memo: w.memo || '',
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const ymPrefix = kstYearMonth()

    const [sbWorkers, workRows] = await Promise.all([
      listOrEmpty<any>(supabase.from('workers').select('*')),
      listOrEmpty<any>(
        supabase.from('issues').select('scheduled_date, cost, workers(name)')
          .like('scheduled_date', `${ymPrefix}%`)
      ),
    ])

    // 월간 실적 집계
    const statsMap = new Map<string, { count: number; total: number }>()
    for (const r of workRows) {
      const name = r.workers?.name
      if (!name) continue
      const cur = statsMap.get(name) || { count: 0, total: 0 }
      cur.count++
      cur.total += Number(r.cost) || 0
      statsMap.set(name, cur)
    }

    const workers = sbWorkers.map(sbToWorker)
    const withStats: WorkerWithStats[] = workers.map(w => {
      const s = statsMap.get(w.name) || { count: 0, total: 0 }
      return { ...w, thisMonthJobs: s.count, thisMonthTotal: s.total }
    })
    return NextResponse.json(sortWorkers(withStats))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name 필수' }, { status: 400 })

    const supabase = createAdminClient()
    const id = makeStaffId(new Set<string>())
    const token = makeToken(new Set<string>())
    const field: WorkerField = (body?.field === '수리' ? '수리' : '청소')
    const status: WorkerStatus = (body?.status === '만료' ? '만료' : '활동중')

    const newWorker: Worker = {
      id, name, field, status,
      phone: String(body?.phone || ''), bankName: String(body?.bankName || ''),
      accountNumber: String(body?.accountNumber || ''), holder: String(body?.holder || ''),
      rrnHead: String(body?.rrnHead || ''), baseAmount: Number(body?.baseAmount) || 0,
      token, startDate: String(body?.startDate || ''), memo: String(body?.memo || ''),
    }

    const { error } = await supabase.from('workers').insert({
      id, name, phone: newWorker.phone, category: field,
      is_active: status === '활동중', default_rate: newWorker.baseAmount || null,
      access_token: token, memo: newWorker.memo || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(newWorker, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
