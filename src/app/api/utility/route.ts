import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 공과금 시트 (10열): [0]ID [1]지점명 [2]연도 [3]월 [4]전기 [5]가스 [6]수도 [7]인터넷 [8]정수기 [9]메모

function rowToUtil(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    ID: r[0] || '',
    지점명: r[1] || '',
    연도: r[2] || '',
    월: r[3] || '',
    전기: r[4] || '0',
    가스: r[5] || '0',
    수도: r[6] || '0',
    인터넷: r[7] || '0',
    정수기: r[8] || '0',
    메모: r[9] || '',
  }
}

// GET /api/utility — 전체/필터 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const house = searchParams.get('house')

    const rows = await getSheetData('공과금')
    let data = rows.map((r, i) => rowToUtil(r, i))

    if (year) data = data.filter(d => d.연도 === year)
    if (month) data = data.filter(d => d.월 === month)
    if (house) data = data.filter(d => d.지점명 === house)

    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/utility — 공과금 입력 (upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const houseName = body.지점명 || ''
    const yr = String(body.연도 || new Date().getFullYear())
    const mo = String(body.월 || new Date().getMonth() + 1)

    // Check for existing entry
    const rows = await getSheetData('공과금')
    const existIdx = rows.findIndex(r => r[1] === houseName && r[2] === yr && r[3] === mo)

    if (existIdx !== -1) {
      const e = rows[existIdx]
      const updated = [
        e[0], e[1], e[2], e[3],
        body.전기 !== undefined ? String(body.전기) : e[4],
        body.가스 !== undefined ? String(body.가스) : e[5],
        body.수도 !== undefined ? String(body.수도) : e[6],
        body.인터넷 !== undefined ? String(body.인터넷) : e[7],
        body.정수기 !== undefined ? String(body.정수기) : e[8],
        body.메모 ?? (e[9] || ''),
      ]
      await updateRow('공과금', existIdx, updated)
      return NextResponse.json({ success: true, id: e[0], updated: true })
    }

    const id = `util_${Date.now()}`
    const row = [
      id, houseName, yr, mo,
      String(body.전기 || ''), String(body.가스 || ''), String(body.수도 || ''),
      String(body.인터넷 || ''), String(body.정수기 || ''), body.메모 || '',
    ]
    await appendRow('공과금', row)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT /api/utility — 공과금 수정
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const rows = await getSheetData('공과금')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const updated = [
      e[0], e[1], e[2], e[3],
      data.전기 !== undefined ? String(data.전기) : e[4],
      data.가스 !== undefined ? String(data.가스) : e[5],
      data.수도 !== undefined ? String(data.수도) : e[6],
      data.인터넷 !== undefined ? String(data.인터넷) : e[7],
      data.정수기 !== undefined ? String(data.정수기) : e[8],
      data.메모 !== undefined ? data.메모 : (e[9] || ''),
    ]
    await updateRow('공과금', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
