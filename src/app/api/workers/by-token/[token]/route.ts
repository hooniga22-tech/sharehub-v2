import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 용역담당자 시트 (8열): [0]담당자ID [1]이름 [2]연락처 [3]계좌번호 [4]분야 [5]구분 [6]링크토큰 [7]기본금액
// 용역 시트 (8열): [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // 1. 용역담당자 시트에서 토큰 매칭
    const staffRows = await getSheetData('용역담당자')
    const staffRow = staffRows.find(r => (r[6] || '') === token)

    if (!staffRow) {
      return NextResponse.json({ error: 'invalid token' }, { status: 404 })
    }

    const worker = {
      name: staffRow[1] || '',
      type: staffRow[4] || '',
      token: staffRow[6] || '',
    }

    // 2. 용역 시트에서 해당 담당자 스케줄 조회
    const workRows = await getSheetData('용역')
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let schedules = workRows
      .map(r => ({
        id: r[0] || '',
        date: r[1] || '',
        houseName: r[2] || '',
        workerName: r[3] || '',
        type: r[4] || '',
        amount: Number(r[5]) || 0,
        memo: r[6] || '',
        isDone: r[7] === 'Y',
      }))
      .filter(s => s.workerName === worker.name)

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      schedules = schedules.filter(s => s.date.startsWith(prefix))
    }

    schedules.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ worker, schedules })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
