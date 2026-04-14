import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

// row: [0]이슈ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title')
    if (!title) {
      return NextResponse.json({ error: 'title은 필수입니다' }, { status: 400, headers: corsHeaders })
    }

    const houseName = searchParams.get('houseName') || ''
    const category = searchParams.get('category') || '기타'
    const assignee = searchParams.get('assignee') || ''
    const dueDate = searchParams.get('dueDate') || ''
    const priority = searchParams.get('priority') || ''

    const rows = await getSheetData('이슈')
    let maxNum = 0
    for (const r of rows) {
      const m = r[0]?.match(/issue_(\d+)/)
      if (m) maxNum = Math.max(maxNum, Number(m[1]))
    }
    const id = `issue_${String(maxNum + 1).padStart(4, '0')}`
    const today = new Date().toISOString().slice(0, 10)

    const memo = [
      priority && `우선순위:${priority}`,
      dueDate && `기한:${dueDate}`,
    ].filter(Boolean).join(' / ')

    const row = [
      id,
      houseName,
      '',        // roomCode
      title,
      '',        // content
      category,
      '접수',
      assignee,
      today,
      '',        // completedAt
      0,         // cost
      memo,
    ]
    await appendRow('이슈', row)

    return NextResponse.json({ success: true, id, title, houseName, category }, { headers: corsHeaders })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: corsHeaders })
  }
}
