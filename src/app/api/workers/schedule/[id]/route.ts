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

    // row: [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부 [8]링크토큰 [9]링크토큰 [10]등록일
    const isDone = body.isDone !== undefined ? body.isDone : ex[7] === 'Y'
    const amount = body.amount !== undefined ? body.amount : Number(ex[5]) || 0

    await updateRow('용역', idx, [
      ex[0], ex[1], ex[2], ex[3], ex[4],
      amount,
      ex[6] || '',
      isDone ? 'Y' : 'N',
      ex[8] || '', ex[9] || '', ex[10] || '',
    ])

    // 완료 처리 → 운영지출 자동 추가
    if (isDone && body.isDone === true) {
      const opexId = `opex_wk_${id}_${Date.now()}`
      const date = ex[1] || new Date().toISOString().split('T')[0]
      const d = new Date(date)
      // 운영지출: [0]ID [1]지점명 [2]날짜 [3]카테고리 [4]금액 [5]내용 [6]담당자 [7]메모 [8]월
      await appendRow('운영지출', [
        opexId, ex[2], date, '청소', amount,
        `${ex[4]} (${ex[3]})`, ex[3], '', d.getMonth() + 1,
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
