import { NextResponse } from 'next/server'
import { getSheetData, getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 용역담당자 시트는 헤더명 기반 파싱.
// 용역 시트 (11열): [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부 [8][9]링크토큰중복 [10]등록일
// 지점 시트 (13열): [0]지점ID [1]지점명 [2]구 [3]주소 [4]현관비번 [5]와이파이SSID [6]와이파이PW [7]집월세 [8]투자자토큰 [9]총방수 [10]건물주명 [11]건물주연락처 [12]메모

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // 1. 용역담당자 시트에서 토큰 매칭 (헤더명 기반)
    const { headers, rows: staffRows } = await getSheetWithHeaders('용역담당자')
    const tokCol = colIdx(headers, '링크토큰')
    const staffRow = staffRows.find(r => (r[tokCol] || '') === token)

    if (!staffRow) {
      return NextResponse.json({ error: 'invalid token' }, { status: 404 })
    }

    const cell = (name: string) => {
      const i = colIdx(headers, name)
      return i >= 0 ? (staffRow[i] || '') : ''
    }
    const worker = {
      name: cell('이름'),
      type: cell('분야'),
      token: cell('링크토큰'),
    }

    // 2. 용역 + 지점 병렬 조회 (용역도 헤더명 기반)
    const [workSheet, houseRows] = await Promise.all([
      getSheetWithHeaders('용역'),
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

    const wh = workSheet.headers
    const wcol = (name: string) => colIdx(wh, name)
    const wIdId = wcol('용역ID')
    const wIdDate = wcol('예정일')
    const wIdHouse = wcol('지점명')
    const wIdWorker = wcol('담당자명')
    const wIdType = wcol('작업종류')
    const wIdAmount = wcol('정산금액')
    const wIdMemo = wcol('메모')
    const wIdDone = wcol('완료여부')
    const wIdRequest = wcol('요청사항')
    const wcell = (r: string[], i: number) => (i >= 0 ? (r[i] || '') : '')

    // 완료 플래그 정규화: 'Y', 'TRUE', 'true' 모두 완료로 인정
    const doneFlag = (v: string) => {
      const s = (v || '').trim().toUpperCase()
      return s === 'Y' || s === 'TRUE'
    }

    let schedules = workSheet.rows
      .map(r => {
        const houseName = wcell(r, wIdHouse)
        const hi = houseMap.get(houseName.trim()) || { address: '', doorCode: '', houseMemo: '' }
        return {
          id: wcell(r, wIdId),
          date: wcell(r, wIdDate),
          houseName,
          workerName: wcell(r, wIdWorker),
          type: wcell(r, wIdType),
          amount: Number(wcell(r, wIdAmount)) || 0,
          memo: wcell(r, wIdMemo),
          request: wcell(r, wIdRequest),
          isDone: doneFlag(wcell(r, wIdDone)),
          address: hi.address,
          doorCode: hi.doorCode,
          houseMemo: hi.houseMemo,
        }
      })
      .filter(s => s.workerName === worker.name)
      // 완료된 일정은 작업자 개인페이지에 노출하지 않음
      .filter(s => !s.isDone)

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
