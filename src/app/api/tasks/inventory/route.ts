import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 마감일이 비어 있는 할일(=인벤토리) 목록 조회. 헤더명 기반 파싱.
export async function GET() {
  try {
    const { headers, rows } = await getSheetWithHeaders('할일')
    const get = (r: string[], name: string) => {
      const i = colIdx(headers, name)
      return i >= 0 ? (r[i] || '') : ''
    }
    const now = Date.now()
    const data = rows
      .filter(r => get(r, '할일ID') && !get(r, '마감일').trim())
      .map(r => {
        const registeredAt = get(r, '등록일')
        const regTime = registeredAt ? new Date(registeredAt).getTime() : now
        const daysOld = Number.isFinite(regTime)
          ? Math.max(0, Math.floor((now - regTime) / (1000 * 60 * 60 * 24)))
          : 0
        const isUrgent = daysOld >= 3
        const tags = get(r, '태그').split(',').map(s => s.trim()).filter(Boolean)
        return {
          id: get(r, '할일ID'),
          title: get(r, '제목'),
          houseName: get(r, '지점명'),
          roomCode: get(r, '방코드'),
          assignedTo: get(r, '담당자명'),
          tags,
          memo: get(r, '담당자메모'),
          isUrgent,
          registeredAt,
        }
      })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
