import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 공실 시트 (12열): [0]공실ID [1]지점명 [2]방코드 [3]공실유형 [4]공실시작일 [5]퇴실예정일
// [6]예정자명 [7]예정자연락처 [8]예정입주일 [9]보증금상태 [10]메모 [11]상태

function rowToVacancy(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    공실ID: r[0] || '',
    지점명: r[1] || '',
    방코드: r[2] || '',
    공실유형: r[3] || '',
    공실시작일: r[4] || '',
    퇴실예정일: r[5] || '',
    예정자명: r[6] || '',
    예정자연락처: r[7] || '',
    예정입주일: r[8] || '',
    보증금상태: r[9] || '',
    메모: r[10] || '',
    상태: r[11] || '진행중',
  }
}

export async function GET(req: Request) {
  try {
    const rows = await getSheetData('공실')
    let vacancies = rows.map((r, i) => rowToVacancy(r, i))
    vacancies = vacancies.filter(v => v.상태 !== '완료')
    vacancies.sort((a, b) => {
      const aDate = a.퇴실예정일 || a.공실시작일 || ''
      const bDate = b.퇴실예정일 || b.공실시작일 || ''
      return aDate > bDate ? 1 : -1
    })
    return NextResponse.json(vacancies)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `vac_${Date.now()}`
    const row = [
      id,
      body.지점명 || '', body.방코드 || '', body.공실유형 || '현재공실',
      body.공실시작일 || '', body.퇴실예정일 || '',
      body.예정자명 || '', body.예정자연락처 || '', body.예정입주일 || '', body.보증금상태 || '',
      body.메모 || '', body.상태 || '진행중',
    ]
    await appendRow('공실', row)
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
    const rows = await getSheetData('공실')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const updated = [
      e[0], e[1], e[2],
      data.공실유형 ?? e[3], data.공실시작일 ?? e[4], data.퇴실예정일 ?? e[5],
      data.예정자명 ?? e[6], data.예정자연락처 ?? e[7], data.예정입주일 ?? e[8],
      data.보증금상태 ?? e[9], data.메모 ?? (e[10] || ''), data.상태 ?? (e[11] || '진행중'),
    ]
    await updateRow('공실', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
