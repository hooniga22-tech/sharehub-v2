import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// Supabase issues -> 프론트 기대 필드 매핑
function sbToIssue(i: any, idx: number) {
  const statusMap: Record<string, string> = { pending: '접수', in_progress: '진행중', done: '완료', cancelled: '취소' }
  return {
    rowIndex: idx, id: i.id || '', houseName: i.branches?.name || '', roomCode: i.rooms?.room_code || '',
    title: i.title || '', content: i.description || '', category: i.category || '기타',
    status: statusMap[i.status] || i.status || '접수', assignee: i.workers?.name || '',
    createdAt: i.created_at ? i.created_at.slice(0, 10) : '', completedAt: i.completed_date || '',
    cost: i.cost || 0, memo: i.memo || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    const room = searchParams.get('room')

    const supabase = createAdminClient()
    let query = supabase.from('issues').select('*, branches(name), rooms(room_code), workers(name)')

    const rows = await listOrEmpty<any>(query)
    let issues = rows.map((r, i) => sbToIssue(r, i)).filter(i => i.id)

    if (house) issues = issues.filter(i => i.houseName === house)
    if (room) issues = issues.filter(i => i.roomCode === room)
    issues.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

    return NextResponse.json({ issues })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST는 Step 4.5에서 전환 예정 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rows = await getSheetData('이슈')
    let maxNum = 0
    for (const r of rows) { const m = r[0]?.match(/issue_(\d+)/); if (m) maxNum = Math.max(maxNum, Number(m[1])) }
    const id = `issue_${String(maxNum + 1).padStart(4, '0')}`
    const today = new Date().toISOString().slice(0, 10)
    await appendRow('이슈', [id, body.houseName || '', body.roomCode || '', body.title || '', body.content || '', body.category || '기타', '접수', body.assignee || '', today, '', body.cost || 0, body.memo || ''])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
