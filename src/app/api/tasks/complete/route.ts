import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow } from '@/lib/sheets'

// 할일 완료 처리: 상태='완료', 완료일=오늘(KST). 헤더명 기반.
const SHEET = '할일'

function todayYmdKst(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const taskId = String(body?.taskId || '').trim()
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId 필수' }, { status: 400 })
    }

    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '할일ID')
    if (idCol < 0) {
      return NextResponse.json({ success: false, error: '할일ID 헤더 없음' }, { status: 500 })
    }
    const idx = rows.findIndex(r => r[idCol] === taskId)
    if (idx === -1) {
      return NextResponse.json({ success: false, error: '할일을 찾을 수 없음' }, { status: 404 })
    }

    const updated: string[] = []
    for (let i = 0; i < headers.length; i++) updated[i] = rows[idx][i] || ''
    const setCell = (name: string, v: string) => {
      const i = colIdx(headers, name)
      if (i >= 0) updated[i] = v
    }
    setCell('상태', '완료')
    setCell('완료일', todayYmdKst())

    await updateRow(SHEET, idx, updated)
    return NextResponse.json({ success: true, id: taskId })
  } catch (e) {
    console.error('[complete] 처리 중 오류', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
