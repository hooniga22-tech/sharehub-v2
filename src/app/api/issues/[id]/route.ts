import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const supabase = createAdminClient()
    const { data: i, error } = await supabase.from('issues').select('*, branches(name), rooms(room_code), workers(name)').eq('id', id).single()
    if (error || !i) return NextResponse.json({ error: 'not found' }, { status: 404 })

    return NextResponse.json({
      rowIndex: 0, id: i.id, houseName: i.branches?.name || '', roomCode: i.rooms?.room_code || '',
      title: i.title, content: i.description || '', category: i.category || '기타',
      status: i.status || 'pending', assignee: i.workers?.name || '',
      createdAt: i.created_at ? i.created_at.slice(0, 10) : '', completedAt: i.completed_date || '',
      cost: i.cost || 0, memo: i.memo || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()
    const ISSUE_REVERSE: Record<string, string> = { '접수': 'pending', '진행중': 'in_progress', '완료': 'done', '취소': 'cancelled' }
    const update: Record<string, any> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.content !== undefined) update.description = body.content
    if (body.category !== undefined) update.category = body.category
    if (body.status !== undefined) update.status = ISSUE_REVERSE[body.status] || body.status
    if (body.cost !== undefined) update.cost = Number(body.cost) || null
    if (body.memo !== undefined) update.memo = body.memo
    if (body.status === 'done' || body.status === '완료' || body.completedAt) {
      update.completed_date = body.completedAt || new Date().toISOString().slice(0, 10)
    }
    const { error } = await supabase.from('issues').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
