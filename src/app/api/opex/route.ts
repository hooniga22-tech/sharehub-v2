import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 운영지출 시트 (8열): [0]지출ID [1]지점명 [2]날짜 [3]카테고리 [4]금액 [5]내용 [6]담당자 [7]메모

function rowToOpex(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    지출ID: r[0] || '',
    지점명: r[1] || '',
    날짜: r[2] || '',
    카테고리: r[3] || '',
    금액: r[4] || '0',
    내용: r[5] || '',
    담당자: r[6] || '',
    메모: r[7] || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const house = searchParams.get('house') || searchParams.get('houseName')
    const category = searchParams.get('category')

    const rows = await getSheetData('운영지출')
    let data = rows.map((r, i) => rowToOpex(r, i)).filter(d => d.지출ID !== 'deleted' && d.지출ID)

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      data = data.filter(d => (d.날짜 || '').startsWith(prefix))
    } else if (year) {
      data = data.filter(d => (d.날짜 || '').startsWith(year))
    }

    if (house) data = data.filter(d => d.지점명 === house)
    if (category) data = data.filter(d => d.카테고리 === category)

    data.sort((a, b) => (a.날짜 > b.날짜 ? -1 : 1))

    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `opex_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]

    await appendRow('운영지출', [
      id,
      body.지점명 || body.houseName || '',
      body.날짜 || body.date || today,
      body.카테고리 || body.category || '',
      String(body.금액 || body.amount || ''),
      body.내용 || body.content || '',
      body.담당자 || body.assignee || '',
      body.메모 || body.memo || '',
    ])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const rows = await getSheetData('운영지출')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    await updateRow('운영지출', rowIndex, ['deleted', '', '', '', '', '', '', ''])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
