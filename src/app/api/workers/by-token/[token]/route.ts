import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const workers = await getSheetData('용역담당자')
    const worker = workers.find(r => r[6] === token)
    if (!worker) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const workerName = worker[1]?.trim()
    const schedules = await getSheetData('용역')

    // row: [0]ID [1]담당자명 [2]지점명 [3]작업종류 [4]예정일 [5]완료여부 [6]정산금액 [7]이슈ID [8]메모 [9]링크토큰 [10]등록일
    const mySchedules = schedules
      .filter(r => r[1]?.trim() === workerName)
      .map((r, i) => ({
        _rowIndex: i,
        id: r[0] || '',
        workerName: r[1] || '',
        houseName: r[2] || '',
        type: r[3] || '',
        date: r[4] || '',
        isDone: r[5] === 'Y',
        amount: Number(r[6]) || 0,
        issueId: r[7] || '',
        memo: r[8] || '',
      }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    return NextResponse.json({
      worker: {
        id: worker[0], name: worker[1], phone: worker[2], account: worker[3],
        field: worker[4], type: worker[5], token: worker[6],
        defaultAmount: Number(worker[7]) || 55000,
      },
      schedules: mySchedules,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
