import { NextResponse } from 'next/server'
import { getSheetData, updateRow, appendRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('용역')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const ex = rows[idx]

    // row: [0]ID [1]담당자명 [2]지점명 [3]작업종류 [4]예정일 [5]완료여부 [6]정산금액 [7]이슈ID [8]메모 [9]링크토큰 [10]등록일
    const isDone = body.isDone !== undefined ? body.isDone : ex[5] === 'Y'
    const amount = body.amount !== undefined ? body.amount : Number(ex[6]) || 0

    await updateRow('용역', idx, [
      ex[0], ex[1], ex[2], ex[3], ex[4],
      isDone ? 'Y' : 'N',
      amount,
      ex[7] || '', ex[8] || '', ex[9] || '', ex[10] || '',
    ])

    // 완료 처리 → 운영지출 자동 추가
    if (isDone && body.isDone === true) {
      const opexId = `opex_wk_${id}_${Date.now()}`
      const date = ex[4] || new Date().toISOString().split('T')[0]
      const d = new Date(date)
      await appendRow('운영지출', [
        opexId, ex[2], '청소', `${ex[3]} (${ex[1]})`, amount,
        ex[1], date, d.getFullYear(), d.getMonth() + 1,
        `용역 자동연동: ${id}`,
      ])
    }

    // 완료 취소 → 운영지출 제거
    if (!isDone && body.isDone === false) {
      const opexRows = await getSheetData('운영지출')
      const opexIdx = opexRows.findIndex(r => r[9]?.includes(id))
      if (opexIdx !== -1) {
        const opex = opexRows[opexIdx]
        await updateRow('운영지출', opexIdx, [
          opex[0], opex[1], opex[2], opex[3], 0,
          opex[5], opex[6], opex[7], opex[8], `취소됨: ${opex[9]}`,
        ])
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
