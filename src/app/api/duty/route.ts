import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 당번 시트 (12열): [0]당번ID [1]지점명 [2]주차시작일 [3]방코드 [4]입주자명
// [5]당번유형 [6]완료여부 [7]완료일시 [8]완료처리자 [9]면제여부 [10]면제사유 [11]메모

function rowToDuty(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    당번ID: r[0] || '', 지점명: r[1] || '', 주차시작일: r[2] || '',
    방코드: r[3] || '', 입주자명: r[4] || '', 당번유형: r[5] || '당번',
    완료여부: r[6] || '예정', 완료일시: r[7] || '', 완료처리자: r[8] || '',
    면제여부: r[9] || 'N', 면제사유: r[10] || '', 메모: r[11] || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    if (!house) return NextResponse.json({ error: 'house 필요' }, { status: 400 })

    const rows = await getSheetData('당번')
    const duties = rows.map((r, i) => rowToDuty(r, i)).filter(d => d.지점명 === house)

    const today = new Date()
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    monday.setHours(0, 0, 0, 0)
    const thisWeek = monday.toISOString().split('T')[0]

    duties.sort((a, b) => a.주차시작일 > b.주차시작일 ? 1 : -1)
    return NextResponse.json({ duties, thisWeek })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.batch && Array.isArray(body.duties)) {
      for (const duty of body.duties) {
        const id = `duty_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
        await appendRow('당번', [
          id, duty.지점명 || '', duty.주차시작일 || '', duty.방코드 || '', duty.입주자명 || '',
          duty.당번유형 || '당번', duty.완료여부 || '예정', '', '', 'N', '', '',
        ])
        await new Promise(r => setTimeout(r, 150))
      }
      return NextResponse.json({ success: true, count: body.duties.length })
    }

    const id = `duty_${Date.now()}`
    await appendRow('당번', [
      id, body.지점명 || '', body.주차시작일 || '', body.방코드 || '', body.입주자명 || '',
      body.당번유형 || '당번', body.완료여부 || '예정', '', '', 'N', '', body.메모 || '',
    ])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('당번')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const now = new Date().toLocaleString('ko-KR')
    await updateRow('당번', rowIndex, [
      e[0], e[1], e[2], e[3], e[4], e[5],
      data.완료여부 ?? e[6],
      data.완료여부 === '완료' ? now : (data.완료일시 ?? (e[7] || '')),
      data.완료처리자 ?? (e[8] || ''),
      data.면제여부 ?? (e[9] || 'N'),
      data.면제사유 ?? (e[10] || ''),
      data.메모 ?? (e[11] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
