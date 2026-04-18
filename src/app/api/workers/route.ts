import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow, getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 용역 시트 (8열): [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부

function rowToWork(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    용역ID: r[0] || '',
    예정일: r[1] || '',
    지점명: r[2] || '',
    담당자명: r[3] || '',
    작업종류: r[4] || '',
    정산금액: r[5] || '0',
    메모: r[6] || '',
    완료여부: r[7] || 'N',
  }
}

// GET /api/workers — 전체/필터/토큰 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const staff = searchParams.get('staff')

    const rows = await getSheetData('용역')
    let works = rows.map((r, i) => rowToWork(r, i))

    if (token) {
      const { headers, rows: staffRows } = await getSheetWithHeaders('용역담당자')
      const tokCol = colIdx(headers, '링크토큰')
      const get = (r: string[], name: string) => {
        const i = colIdx(headers, name)
        return i >= 0 ? (r[i] || '') : ''
      }
      const found = staffRows.find(r => (r[tokCol] || '') === token)
      if (!found) return NextResponse.json({ error: '없음' }, { status: 404 })
      const staffName = get(found, '이름')
      const staffInfo = {
        담당자ID: get(found, '담당자ID'),
        이름: staffName,
        연락처: get(found, '연락처'),
        분야: get(found, '분야'),
        구분: get(found, '구분'),
        링크토큰: get(found, '링크토큰'),
        기본금액: get(found, '기본금액'),
      }
      works = works.filter(w => w.담당자명 === staffName)
      return NextResponse.json({ staff: staffInfo, schedules: works })
    }

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      works = works.filter(w => w.예정일.startsWith(prefix))
    }
    if (staff) works = works.filter(w => w.담당자명 === staff)

    return NextResponse.json(works)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/workers — 용역 일정 추가
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `work_${Date.now()}`
    const row = [
      id,
      body.예정일 || '',
      body.지점명 || '',
      body.담당자명 || '',
      body.작업종류 || '',
      body.정산금액 || '0',
      body.메모 || '',
      body.완료여부 || 'N',
    ]
    await appendRow('용역', row)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT /api/workers — 완료 처리 / 금액 수정
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('용역')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const updated = [
      e[0],
      data.예정일 ?? e[1],
      data.지점명 ?? e[2],
      data.담당자명 ?? e[3],
      data.작업종류 ?? e[4],
      data.정산금액 ?? e[5],
      data.메모 ?? (e[6] || ''),
      data.완료여부 ?? (e[7] || 'N'),
    ]
    await updateRow('용역', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
