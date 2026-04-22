import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-helpers'

function parseMemo(memo: string | null): Record<string, string> {
  if (!memo) return {}
  try { return JSON.parse(memo) } catch { return { 메모: memo } }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const { data: existing, error } = await supabase.from('duty_schedules').select('*').eq('id', id).single()
    if (error || !existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const prev = parseMemo(existing.memo)
    const isDone = body.isDone !== undefined ? (body.isDone ? 'Y' : 'N') : (prev.완료여부 === 'done' ? 'Y' : 'N')
    const doneAt = body.isDone ? new Date().toISOString().split('T')[0] : (prev.완료일시 || '')
    const hasFine = body.hasFine !== undefined ? (body.hasFine ? 'Y' : 'N') : (prev.면제여부 || 'N')

    const extra = JSON.stringify({
      ...prev,
      완료여부: isDone === 'Y' ? 'done' : prev.완료여부 || 'scheduled',
      완료일시: doneAt,
      면제여부: hasFine,
      메모: body.note ?? prev.메모 ?? '',
    })

    await supabase.from('duty_schedules').update({ memo: extra }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
