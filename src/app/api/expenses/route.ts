import { NextResponse } from 'next/server'
import { getSheetData, appendRow, deleteRow } from '@/lib/sheets'

// 운영지출 탭: [0]지출ID [1]날짜 [2]유형 [3]지점명 [4]카테고리 [5]금액 [6]메모

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)
    const mm = month.padStart(2, '0')

    const rows = await getSheetData('운영지출')

    const items = rows
      .map(r => ({
        id: r[0] || '',
        date: r[1] || '',
        type: r[2] || '',
        houseName: r[3] || '',
        category: r[4] || '',
        amount: Number(r[5]) || 0,
        memo: r[6] || '',
      }))
      .filter(item => {
        if (!item.date) return false
        const d = item.date.replace(/\//g, '-')
        return d.startsWith(`${year}-${mm}`)
      })

    const houseTotal = items.filter(i => i.type === '지점별').reduce((s, i) => s + i.amount, 0)
    const opsTotal = items.filter(i => i.type === '전체운영').reduce((s, i) => s + i.amount, 0)

    return NextResponse.json({
      items,
      summary: { houseTotal, opsTotal, total: houseTotal + opsTotal, count: items.length },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, type, houseName, category, amount, memo } = body
    if (!date || !type || !category || !amount) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }
    const rand = Math.random().toString(36).slice(2, 6)
    const id = `expense_${date.replace(/-/g, '')}_${rand}`
    await appendRow('운영지출', [id, date, type, houseName || '', category, Number(amount), memo || ''])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const rows = await getSheetData('운영지출')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    await deleteRow('운영지출', idx)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
