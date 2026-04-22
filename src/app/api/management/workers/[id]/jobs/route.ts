import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { WORK_TAB } from '@/lib/workers-helper'
import type { WorkerJob } from '@/types/worker'

// GET /api/management/workers/[id]/jobs?limit=3
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const limitRaw = searchParams.get('limit')
    const limit: number | 'all' = limitRaw === 'all' ? 'all' : (Number(limitRaw) || 3)

    // Supabase workers에서 담당자 이름 조회
    const supabase = createAdminClient()
    const { data: w, error } = await supabase.from('workers').select('name').eq('id', id).single()
    if (error || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const name = w.name

    // 용역 시트에서 해당 담당자 작업 조회 (Step 4.3에서 Supabase issues로 전환 예정)
    const workRows = await getSheetData(WORK_TAB)
    const filtered = workRows.filter(r => ((r[3] as string) || '').trim() === name)
    filtered.sort((a, b) => ((b[1] as string) || '').localeCompare((a[1] as string) || ''))

    const sliced = limit === 'all' ? filtered : filtered.slice(0, limit)
    const jobs: WorkerJob[] = sliced.map(r => ({
      id: r[0] || '',
      date: r[1] || '',
      site: r[2] || '',
      task: r[4] || '',
      amount: Number(r[5]) || 0,
    }))
    return NextResponse.json(jobs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
