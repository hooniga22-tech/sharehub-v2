import type { TenantSpan, HandoverSpan, RoomTimeline, HouseTimeline } from '@/types/timeline'

export type { TenantSpan, HandoverSpan, RoomTimeline, HouseTimeline }

// 컬러 규칙
export const STATUS_COLORS = {
  in:   { bg: '#EBF3FF', fg: '#3182F6' },
  soon: { bg: '#FFFBEB', fg: '#F59E0B' },
  out:  { bg: '#FEF2F2', fg: '#EF4444' },
} as const

export const STATUS_LABEL: Record<string, string> = {
  in:       '입주중',
  soon:     '계약종료임박',
  out:      '퇴실확정',
  handover: '월중 교체',
  vac:      '공실',
}

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// 일할 계산
export function calcProRata(rent: number, day: number, totalDays: number, isFirst: boolean) {
  const days = isFirst ? (totalDays - day + 1) : day
  return { days, amount: Math.round(rent / totalDays * days) }
}

// 바 left/width (%)
export function barStyle(startMonth: number, endMonth: number) {
  return {
    left: `${(startMonth / 12 * 100).toFixed(2)}%`,
    width: `${((endMonth - startMonth + 1) / 12 * 100).toFixed(2)}%`,
  }
}

// Google Sheets 입주자 데이터 → HouseTimeline 변환
export function buildTimelines(tenants: any[]): HouseTimeline[] {
  // 퇴실완료, 계약취소 제외
  const active = tenants.filter(t => {
    const s = t['상태'] as string
    return s !== '퇴실완료' && s !== '계약취소'
  })

  // 지점명으로 그룹핑
  const houseMap: Record<string, any[]> = {}
  active.forEach(t => {
    const key = t['지점명'] || '미분류'
    if (!houseMap[key]) houseMap[key] = []
    houseMap[key].push(t)
  })

  return Object.entries(houseMap).sort((a, b) => a[0].localeCompare(b[0])).map(([houseName, tenantList]) => {
    // 방코드로 그룹핑
    const roomMap: Record<string, any[]> = {}
    tenantList.forEach(t => {
      const code = t['방코드'] || '?'
      if (!roomMap[code]) roomMap[code] = []
      roomMap[code].push(t)
    })

    const rooms: RoomTimeline[] = Object.entries(roomMap).sort((a, b) => a[0].localeCompare(b[0])).map(([code, roomTenants]) => {
      const spans: (TenantSpan | HandoverSpan)[] = []

      // 입주일 기준 정렬
      const sorted = [...roomTenants].sort((a, b) =>
        new Date(a['입주일'] || '2099').getTime() - new Date(b['입주일'] || '2099').getTime()
      )

      const nowDate = new Date()

      sorted.forEach((t, i) => {
        const inDate  = t['입주일'] ? new Date(t['입주일']) : null
        const outDate = t['퇴실일'] ? new Date(t['퇴실일']) : null
        const status  = t['상태'] as string

        if (!inDate) return

        const startMonth = inDate.getMonth()
        const endMonth   = outDate ? outDate.getMonth() : 11
        const inDay      = inDate.getDate()
        const outDay     = outDate?.getDate()

        // 다음 입주자와 같은 달 교체 여부 확인
        const next = sorted[i + 1]
        const nextIn = next?.['입주일'] ? new Date(next['입주일']) : null
        const isHandover = nextIn && outDate &&
          nextIn.getMonth() === outDate.getMonth() &&
          nextIn.getFullYear() === outDate.getFullYear()

        // 상태 결정
        const monthsLeft = outDate
          ? (outDate.getFullYear() - nowDate.getFullYear()) * 12 + outDate.getMonth() - nowDate.getMonth()
          : 999

        let type: 'in' | 'soon' | 'out' = 'in'
        if (status === '퇴실예정' || status === '퇴실확정') type = 'out'
        else if (status === '공실예정' || (monthsLeft >= 0 && monthsLeft <= 2)) type = 'soon'

        if (isHandover) {
          const handoverMonth = outDate.getMonth()

          if (startMonth <= handoverMonth - 1) {
            spans.push({
              type,
              name: t['이름'],
              startMonth,
              endMonth: handoverMonth - 1,
              inDay,
              rent: Number(t['월세']) || 0,
              deposit: Number(t['보증금']) || 0,
              contractEnd: t['퇴실일'],
              tenantId: t['입주자ID'],
            } as TenantSpan)
          }

          // handover 셀
          const nextStatus = next?.['상태'] as string
          const nextOut = next?.['퇴실일'] ? new Date(next['퇴실일']) : null
          const nextMonthsLeft = nextOut
            ? (nextOut.getFullYear() - nowDate.getFullYear()) * 12 + nextOut.getMonth() - nowDate.getMonth()
            : 999
          let typeN2: 'in' | 'soon' | 'out' = 'in'
          if (nextStatus === '퇴실예정' || nextStatus === '퇴실확정') typeN2 = 'out'
          else if (nextStatus === '공실예정' || (nextMonthsLeft >= 0 && nextMonthsLeft <= 2)) typeN2 = 'soon'

          spans.push({
            type: 'handover',
            month: handoverMonth,
            n1: t['이름'],
            outDay: outDay || 1,
            n2: next['이름'],
            inDay: new Date(next['입주일']).getDate(),
            rent1: Number(t['월세']) || 0,
            rent2: Number(next['월세']) || 0,
            deposit1: Number(t['보증금']) || 0,
            deposit2: Number(next['보증금']) || 0,
            contractEnd1: t['퇴실일'],
            contractEnd2: next['퇴실일'],
            typeN2,
            tenantId1: t['입주자ID'],
            tenantId2: next['입주자ID'],
          } as HandoverSpan)
        } else {
          spans.push({
            type,
            name: t['이름'],
            startMonth,
            endMonth,
            inDay,
            outDay,
            rent: Number(t['월세']) || 0,
            deposit: Number(t['보증금']) || 0,
            contractEnd: t['퇴실일'],
            tenantId: t['입주자ID'],
          } as TenantSpan)
        }
      })

      return { code, loc: roomTenants[0]?.['방타입'] || '', tenants: spans }
    })

    return {
      id: houseName,
      name: houseName,
      district: tenantList[0]?.['구'] || '',
      rentDisplay: '',
      total: rooms.length,
      rooms,
    }
  })
}
