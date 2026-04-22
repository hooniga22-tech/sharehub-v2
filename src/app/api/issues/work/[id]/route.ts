import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow, deleteRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'

const SHEET = '용역'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: issue, error } = await supabase
      .from('issues').select('*, branches(name), workers(name)').eq('id', id).single()
    if (error || !issue) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const statusMap: Record<string, string> = { done: 'Y', pending: 'N', in_progress: 'N', cancelled: 'N' }
    return NextResponse.json({
      rowIndex: 0,
      용역ID: issue.id, 예정일: issue.scheduled_date || '', 지점명: issue.branches?.name || '',
      담당자명: issue.workers?.name || '', 작업종류: issue.category || '',
      정산금액: issue.cost || 0, 메모: issue.memo || '', 요청사항: issue.description || '',
      완료여부: statusMap[issue.status] || 'N', 완료일: issue.completed_date || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH/DELETE는 Step 4.5 - Sheets 유지
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idx = rows.findIndex(r => r[colIdx(headers, '용역ID')] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const row = [...rows[idx]]
    while (row.length < headers.length) row.push('')
    const editable = ['예정일', '지점명', '담당자명', '작업종류', '메모', '요청사항', '완료일', '정산금액', '완료여부']
    for (const field of editable) {
      if (body[field] !== undefined) {
        const ci = colIdx(headers, field)
        if (ci >= 0) {
          let val = body[field]
          if (field === '완료여부') val = val === true || val === 'Y' ? 'Y' : 'N'
          if (field === '정산금액') val = String(Number(val) || 0)
          row[ci] = val
        }
      }
    }
    const doneCol = colIdx(headers, '완료여부')
    const doneAtCol = colIdx(headers, '완료일')
    if (doneCol >= 0 && row[doneCol] === 'Y' && doneAtCol >= 0 && !row[doneAtCol]) {
      row[doneAtCol] = new Date().toISOString().slice(0, 10)
    }
    await updateRow(SHEET, idx, row)
    return NextResponse.json({ ...(await getUpdated(id, headers, rows, idx, row)) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idx = rows.findIndex(r => r[colIdx(headers, '용역ID')] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await deleteRow(SHEET, idx)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function getUpdated(id: string, headers: string[], _rows: string[][], idx: number, row: string[]) {
  const cell = (name: string) => { const i = colIdx(headers, name); return i >= 0 ? (row[i] || '') : '' }
  return {
    rowIndex: idx, 용역ID: id, 예정일: cell('예정일'), 지점명: cell('지점명'),
    담당자명: cell('담당자명'), 작업종류: cell('작업종류'), 정산금액: Number(cell('정산금액')) || 0,
    메모: cell('메모'), 요청사항: cell('요청사항'), 완료여부: cell('완료여부') as 'Y' | 'N', 완료일: cell('완료일'),
  }
}
