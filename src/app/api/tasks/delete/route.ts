import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, deleteRow } from '@/lib/sheets'

// 할일 삭제. 헤더명으로 할일ID 찾아 행 삭제.
const SHEET = '할일'

async function resolveTaskId(req: Request): Promise<string> {
  // DELETE 요청이지만 body 또는 query string 둘 다 수용
  const { searchParams } = new URL(req.url)
  const fromQuery = (searchParams.get('taskId') || '').trim()
  if (fromQuery) return fromQuery
  try {
    const body = await req.json()
    return String(body?.taskId || '').trim()
  } catch {
    return ''
  }
}

export async function DELETE(req: Request) {
  try {
    const taskId = await resolveTaskId(req)
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId 필수' }, { status: 400 })

    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '할일ID')
    if (idCol < 0) {
      return NextResponse.json({ success: false, error: '할일ID 헤더 없음' }, { status: 500 })
    }
    const idx = rows.findIndex(r => r[idCol] === taskId)
    if (idx === -1) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })

    await deleteRow(SHEET, idx)
    return NextResponse.json({ success: true, id: taskId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
