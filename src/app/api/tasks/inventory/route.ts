import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 인벤토리 = 상태가 '인벤토리'인 할일. '예정'(스케줄 확정), '완료'(종료)는 제외.
// '잠수' 등 정책에서 벗어난 값이 남아 있는 행은 마감일 유무로 보정해 판단:
//   · 마감일 없으면 인벤토리로 취급 (표시)
//   · 마감일 있으면 예정으로 취급 (표시 X)
const INVENTORY_STATUS = '인벤토리'
const SCHEDULED_STATUSES = new Set(['예정', '완료'])

export async function GET() {
  try {
    const { headers, rows } = await getSheetWithHeaders('할일')
    const get = (r: string[], name: string) => {
      const i = colIdx(headers, name)
      return i >= 0 ? (r[i] || '') : ''
    }
    const now = Date.now()
    const data = rows
      .filter(r => {
        if (!get(r, '할일ID')) return false
        const status = get(r, '상태').trim()
        if (status === INVENTORY_STATUS) return true
        if (SCHEDULED_STATUSES.has(status)) return false
        // 정체불명 상태(예: '잠수', 공백): 마감일 없을 때만 인벤토리 노출
        return !get(r, '마감일').trim()
      })
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
