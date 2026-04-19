import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx } from '@/lib/sheets'

// 인벤토리 = 마감일이 비어 있는 할일(즉, '인벤토리' 상태). 일정 탭과 상호 배타.
// 정체불명 상태(공백/잠수 등)는 마감일 유무로 보정해 인벤토리/일정 자동 분류.
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
        if (status === '완료') return false
        if (status === '인벤토리') return true
        if (status === '예정') return false
        // 정체불명 상태는 마감일 비어있으면 인벤토리로 취급
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
        const amountRaw = get(r, '금액').replace(/[^\d.-]/g, '')
        const amount = amountRaw ? Number(amountRaw) : 0
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
          startDate: get(r, '시작일'),
          endDate: get(r, '마감일'),
          amount: Number.isFinite(amount) ? amount : 0,
          status: get(r, '상태').trim(),
        }
      })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
