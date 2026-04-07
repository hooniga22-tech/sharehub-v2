import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

// row: [0]이슈ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모

export async function GET() {
  try {
    const rows = await getSheetData('이슈')
    const houses = await getSheetData('지점')
    const houseNames = houses.map(r => r[1]?.trim()).filter(Boolean)

    const issues = rows.map((r, i) => ({
      rowIndex: i,
      id: r[0] || '',
      houseName: r[1] || '',
      roomCode: r[2] || '',
      title: r[3] || '',
      content: r[4] || '',
      category: r[5] || '기타',
      status: r[6] || '접수',
      assignee: r[7] || '',
      createdAt: r[8] || '',
      completedAt: r[9] || '',
      cost: Number(r[10]) || 0,
      memo: r[11] || '',
    }))

    return NextResponse.json({ issues, houseNames })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `I${Date.now().toString(36).toUpperCase()}`
    const today = new Date().toISOString().slice(0, 10)
    const row = [
      id,
      body.houseName || '',
      body.roomCode || '',
      body.title || '',
      body.content || '',
      body.category || '기타',
      '접수',
      body.assignee || '',
      today,
      '',
      body.cost || 0,
      body.memo || '',
    ]
    await appendRow('이슈', row)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
