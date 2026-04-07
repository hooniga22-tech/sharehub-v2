import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rows = await getSheetData('이슈')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const r = rows[idx]
    return NextResponse.json({
      rowIndex: idx,
      id: r[0], houseName: r[1], roomCode: r[2], title: r[3], content: r[4],
      category: r[5], status: r[6], assignee: r[7], createdAt: r[8],
      completedAt: r[9], cost: Number(r[10]) || 0, memo: r[11] || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('이슈')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const prev = rows[idx]
    const updated = [
      id,
      body.houseName ?? prev[1],
      body.roomCode ?? prev[2],
      body.title ?? prev[3],
      body.content ?? prev[4],
      body.category ?? prev[5],
      body.status ?? prev[6],
      body.assignee ?? prev[7],
      prev[8],
      body.status === '완료' ? new Date().toISOString().slice(0, 10) : (body.completedAt ?? prev[9] ?? ''),
      body.cost ?? prev[10],
      body.memo ?? prev[11],
    ]
    await updateRow('이슈', idx, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
