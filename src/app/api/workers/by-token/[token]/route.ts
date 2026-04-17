import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 용역담당자 시트 (8열): [0]담당자ID [1]이름 [2]연락처 [3]계좌번호 [4]분야 [5]구분 [6]링크토큰 [7]기본금액
// 용역 시트 (11열): [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부 [8][9]링크토큰중복 [10]등록일
// 지점 시트 (13열): [0]지점ID [1]지점명 [2]구 [3]주소 [4]현관비번 [5]와이파이SSID [6]와이파이PW [7]집월세 [8]투자자토큰 [9]총방수 [10]건물주명 [11]건물주연락처 [12]메모

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

    // 2. 용역 + 지점 병렬 조회
    const [workRows, houseRows] = await Promise.all([
      getSheetData('용역'),
      getSheetData('지점'),
    ])

    // 지점 정보 맵 (지점명 → 상세)
    type HouseInfo = { address: string; doorCode: string; houseMemo: string }
    const houseMap = new Map<string, HouseInfo>()
    for (const r of houseRows) {
      const name = (r[1] || '').trim()
      if (!name) continue
      houseMap.set(name, {
        address: r[3] || '',
        doorCode: r[4] || '',
        houseMemo: r[12] || '',
      })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let schedules = workRows
      .map(r => {
        const houseName = r[2] || ''
        const hi = houseMap.get(houseName.trim()) || { address: '', doorCode: '', houseMemo: '' }
        return {
          id: r[0] || '',
          date: r[1] || '',
          houseName,
          workerName: r[3] || '',
          type: r[4] || '',
          amount: Number(r[5]) || 0,
          memo: r[6] || '',
          isDone: r[7] === 'Y',
          address: hi.address,
          doorCode: hi.doorCode,
          houseMemo: hi.houseMemo,
        }
      })
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
