import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 지점 시트에서 '구' 컬럼의 unique 값 목록 반환 (가나다 정렬).
export async function GET() {
  try {
    const { headers, rows } = await getSheetWithHeaders('지점')
    const guCol = colIdx(headers, '구')
    if (guCol < 0) {
      return NextResponse.json({ error: "'구' 헤더 없음" }, { status: 500 })
    }
    const set = new Set<string>()
    for (const r of rows) {
      const v = (r[guCol] || '').trim()
      if (v) set.add(v)
    }
    const list = [...set].sort((a, b) => a.localeCompare(b, 'ko'))
    return NextResponse.json(list)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
