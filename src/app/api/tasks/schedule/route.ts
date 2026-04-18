import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow } from '@/lib/sheets'

// 할일 스케줄 설정: 인벤토리 → 예정으로 이동 (시작일/마감일/금액/상태 업데이트)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const taskId = String(body?.taskId || '').trim()
    const startDate = String(body?.startDate || '').trim()
    const endDate = String(body?.endDate || '').trim()
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId 필수' }, { status: 400 })
    if (!startDate) return NextResponse.json({ success: false, error: '시작일 필수' }, { status: 400 })
    if (!endDate) return NextResponse.json({ success: false, error: '마감일 필수' }, { status: 400 })

    const { headers, rows } = await getSheetWithHeaders('할일')
    const idCol = colIdx(headers, '할일ID')
    if (idCol < 0) {
      return NextResponse.json({ success: false, error: '할일ID 헤더 없음' }, { status: 500 })
    }
    const idx = rows.findIndex(r => r[idCol] === taskId)
    if (idx === -1) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })

    const updated: string[] = []
    for (let i = 0; i < headers.length; i++) updated[i] = rows[idx][i] || ''
    const setCell = (name: string, v: string) => {
      const i = colIdx(headers, name)
      if (i >= 0) updated[i] = v
    }
    setCell('시작일', startDate)
    setCell('마감일', endDate)
    if (body?.amount !== undefined && body.amount !== '') {
      const n = Number(body.amount)
      setCell('금액', Number.isFinite(n) ? String(n) : '0')
    }
    setCell('상태', '예정')

    await updateRow('할일', idx, updated)
    return NextResponse.json({ success: true, id: taskId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
