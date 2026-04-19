import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow } from '@/lib/sheets'

// 완료 처리: taskId 접두사로 시트 분기.
//   task_* → 할일 시트 (상태='완료', 완료일=오늘)
//   그 외   → 용역 시트  (완료여부='TRUE', 완료일=오늘)
// 헤더명 기반.

function todayYmdKst(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function completeInSheet(
  sheetName: string,
  taskId: string,
  setters: { name: string; value: string }[],
): Promise<{ ok: boolean; reason?: string }> {
  const { headers, rows } = await getSheetWithHeaders(sheetName)
  const idHeader = sheetName === '할일' ? '할일ID' : '용역ID'
  const idCol = colIdx(headers, idHeader)
  if (idCol < 0) return { ok: false, reason: `${idHeader} 헤더 없음` }
  const idx = rows.findIndex(r => r[idCol] === taskId)
  if (idx === -1) return { ok: false, reason: 'not-found' }

  const updated: string[] = []
  for (let i = 0; i < headers.length; i++) updated[i] = rows[idx][i] || ''
  for (const { name, value } of setters) {
    const i = colIdx(headers, name)
    if (i >= 0) updated[i] = value
  }
  await updateRow(sheetName, idx, updated)
  return { ok: true }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const taskId = String(body?.taskId || '').trim()
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId 필수' }, { status: 400 })
    }

    const today = todayYmdKst()
    const isTaskSheet = taskId.startsWith('task_')

    if (isTaskSheet) {
      const r = await completeInSheet('할일', taskId, [
        { name: '상태', value: '완료' },
        { name: '완료일', value: today },
      ])
      if (!r.ok) {
        if (r.reason === 'not-found') {
          return NextResponse.json({ success: false, error: '할일을 찾을 수 없음' }, { status: 404 })
        }
        return NextResponse.json({ success: false, error: r.reason || '처리 실패' }, { status: 500 })
      }
      return NextResponse.json({ success: true, sheet: '할일', id: taskId })
    }

    // 용역 시트 처리 (문자열 'TRUE' 사용 — 스펙 명시)
    const r = await completeInSheet('용역', taskId, [
      { name: '완료여부', value: 'TRUE' },
      { name: '완료일', value: today },
    ])
    if (!r.ok) {
      if (r.reason === 'not-found') {
        return NextResponse.json({ success: false, error: '용역을 찾을 수 없음' }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: r.reason || '처리 실패' }, { status: 500 })
    }
    return NextResponse.json({ success: true, sheet: '용역', id: taskId })
  } catch (e) {
    console.error('[complete] 처리 중 오류', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
