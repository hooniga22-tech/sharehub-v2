import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import type { WorkerJob } from '@/types/worker'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const limitRaw = searchParams.get('limit')
    const limit: number | 'all' = limitRaw === 'all' ? 'all' : (Number(limitRaw) || 3)

    const supabase = createAdminClient()

    let query = supabase.from('issues').select('id, scheduled_date, category, cost, branches(name)')
      .eq('worker_id', id).order('scheduled_date', { ascending: false })

    if (limit !== 'all') query = query.limit(limit)

    const rows = await listOrEmpty<any>(query)
    const jobs: WorkerJob[] = rows.map(r => ({
      id: r.id || '',
      date: r.scheduled_date || '',
      site: r.branches?.name || '',
      task: r.category || '',
      amount: Number(r.cost) || 0,
    }))
    return NextResponse.json(jobs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
