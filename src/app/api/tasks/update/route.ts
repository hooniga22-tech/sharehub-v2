import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow } from '@/lib/sheets'

// 할일 부분 업데이트. 헤더명 기반, 화이트리스트 필드만 반영.
const SHEET = '할일'

type Body = {
  taskId?: string
  title?: string
  houseName?: string
  roomCode?: string
  assignedTo?: string
  tags?: string[] | string
  memo?: string
  startDate?: string
  endDate?: string
  amount?: number | string
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Body
    const taskId = String(body.taskId || '').trim()
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId 필수' }, { status: 400 })

    const { headers, rows } = await getSheetWithHeaders(SHEET)
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

    if (body.title !== undefined) setCell('제목', String(body.title))
    if (body.houseName !== undefined) setCell('지점명', String(body.houseName))
    if (body.roomCode !== undefined) setCell('방코드', String(body.roomCode))
    if (body.assignedTo !== undefined) setCell('담당자명', String(body.assignedTo))
    if (body.memo !== undefined) setCell('담당자메모', String(body.memo))
    if (body.tags !== undefined) {
      const arr = Array.isArray(body.tags)
        ? body.tags
        : String(body.tags).split(',')
      const tags = arr.map(t => String(t).trim()).filter(Boolean)
      setCell('태그', tags.join(','))
    }
    if (body.startDate !== undefined) setCell('시작일', String(body.startDate || '').trim())
    if (body.endDate !== undefined) setCell('마감일', String(body.endDate || '').trim())
    if (body.amount !== undefined) {
      const v = body.amount
      if (v === '' || v === null) setCell('금액', '')
      else {
        const n = Number(v)
        setCell('금액', Number.isFinite(n) ? String(n) : '0')
      }
    }

    await updateRow(SHEET, idx, updated)
    return NextResponse.json({ success: true, id: taskId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
