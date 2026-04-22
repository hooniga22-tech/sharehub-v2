import { NextResponse } from 'next/server'
import { getSheetData, updateRow, deleteRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: i, error } = await supabase.from('issues').select('*, branches(name), rooms(room_code), workers(name)').eq('id', id).single()
    if (error || !i) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const statusMap: Record<string, string> = { pending: '접수', in_progress: '진행중', done: '완료', cancelled: '취소' }
    return NextResponse.json({
      rowIndex: 0, id: i.id, houseName: i.branches?.name || '', roomCode: i.rooms?.room_code || '',
      title: i.title, content: i.description || '', category: i.category || '기타',
      status: statusMap[i.status] || i.status, assignee: i.workers?.name || '',
      createdAt: i.created_at ? i.created_at.slice(0, 10) : '', completedAt: i.completed_date || '',
      cost: i.cost || 0, memo: i.memo || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT/DELETE는 Step 4.5에서 전환 - Sheets 유지
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('이슈')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const e = rows[idx]
    const today = new Date().toISOString().slice(0, 10)
    const newStatus = body.status ?? e[6]
    const completedAt = newStatus === '완료' ? (body.completedAt ?? e[9] ?? today) : (body.completedAt ?? e[9] ?? '')
    await updateRow('이슈', idx, [e[0], e[1], e[2], body.title ?? e[3], body.content ?? e[4], body.category ?? e[5], newStatus, body.assignee ?? e[7], e[8], completedAt, body.cost ?? e[10], body.memo ?? (e[11] || '')])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rows = await getSheetData('이슈')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await deleteRow('이슈', idx)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
