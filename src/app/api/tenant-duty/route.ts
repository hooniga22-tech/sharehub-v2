import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 당번 시트 (12열): [0]당번ID [1]지점명 [2]주차시작일 [3]방코드 [4]입주자명
// [5]당번유형 [6]완료여부 [7]완료일시 [8]완료처리자 [9]면제여부 [10]면제사유 [11]메모

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    const roomCode = searchParams.get('roomCode')

    if (!house) return NextResponse.json({ error: 'house 필요' }, { status: 400 })

    const rows = await getSheetData('당번')
    let duties = rows
      .map(r => ({
        당번ID: r[0] || '',
        지점명: r[1] || '',
        주차시작일: r[2] || '',
        방코드: r[3] || '',
        입주자명: r[4] || '',
        당번유형: r[5] || '당번',
        완료여부: r[6] || '예정',
        완료일시: r[7] || '',
        완료처리자: r[8] || '',
        면제사유: r[10] || '',
      }))
      .filter(d => d.지점명 === house && d.당번ID)

    duties.sort((a, b) => a.주차시작일.localeCompare(b.주차시작일))

    return NextResponse.json({ duties, myRoomCode: roomCode || '' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
