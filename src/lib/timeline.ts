import type { TenantSpan, HandoverSpan, RoomTimeline, HouseTimeline } from '@/types/timeline'

export type { TenantSpan, HandoverSpan, RoomTimeline, HouseTimeline }

// 날짜 파싱 (Sheets 다양한 형식 대응)
function parseSheetDate(raw: any): Date | null {
  if (!raw) return null

  // 이미 Date 객체
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw

  const str = String(raw).trim()
  if (!str) return null

  // 형식 시도: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD, MM/DD/YYYY
  const patterns = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})/,
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
  ]

  for (const pat of patterns) {
    const m = str.match(pat)
    if (m) {
      const [y, mo, d] = pat === patterns[3]
        ? [parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])]
        : [parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])]
      const date = new Date(y, mo, d)
      if (!isNaN(date.getTime())) return date
    }
  }

  // fallback: native Date parse
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

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
  console.log('[Timeline] 첫 번째 입주자 날짜 raw:', tenants[0]?.['입주일'], tenants[0]?.['퇴실일'])

  // 퇴실완료, 계약취소 제외
  const active = tenants.filter(t => {
    const s = t['상태'] as string
    return s !== '퇴실완료' && s !== '계약취소'
  })

  // 중복 제거: 같은 이름+지점명이면 퇴실일이 있는(더 완전한) 레코드 우선
  const deduped: any[] = []
  const seen = new Map<string, any>()
  active.forEach(t => {
    const key = `${t['이름']}__${t['지점명']}`
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, t)
      deduped.push(t)
    } else {
      // 퇴실일이 있는 쪽 우선, 둘 다 있으면 입주일이 나중인 쪽
      const existHasOut = !!existing['퇴실일']
      const newHasOut = !!t['퇴실일']
      if (!existHasOut && newHasOut) {
        const idx = deduped.indexOf(existing)
        deduped[idx] = t
        seen.set(key, t)
      } else if (existHasOut === newHasOut) {
        const existIn = parseSheetDate(existing['입주일'])?.getTime() ?? 0
        const newIn = parseSheetDate(t['입주일'])?.getTime() ?? 0
        if (newIn > existIn) {
          const idx = deduped.indexOf(existing)
          deduped[idx] = t
          seen.set(key, t)
        }
      }
    }
  })

  // 지점명으로 그룹핑
  const houseMap: Record<string, any[]> = {}
  deduped.forEach(t => {
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
        (parseSheetDate(a['입주일'])?.getTime() ?? Date.parse('2099')) - (parseSheetDate(b['입주일'])?.getTime() ?? Date.parse('2099'))
      )

      const nowDate = new Date()
      const YEAR = nowDate.getFullYear()
      const YEAR_START = new Date(YEAR, 0, 1)
      const YEAR_END   = new Date(YEAR, 11, 31)

      sorted.forEach((t, i) => {
        const inDate  = parseSheetDate(t['입주일'])
        const outDate = parseSheetDate(t['퇴실일'])
        const status  = t['상태'] as string

        if (!inDate) return

        // 퇴실일이 올해 1월 1일 이전이면 → 이미 떠난 사람, 스킵
        if (outDate && outDate < YEAR_START) return

        // 입주일이 올해 12월 31일 이후면 → 아직 안 온 사람, 스킵
        if (inDate > YEAR_END) return

        // 상태가 '공실'이고 퇴실일이 올해 이전 → 스킵
        if (status === '공실' && outDate && outDate < YEAR_START) return

        const startMonth = Math.max(0, inDate.getFullYear() < YEAR ? 0 : inDate.getMonth())
        const endMonth   = Math.min(11, outDate ? (outDate.getFullYear() > YEAR ? 11 : outDate.getMonth()) : 11)

        // startMonth > endMonth 이면 올해 범위 밖 → skip
        if (startMonth > endMonth) return
        const inDay      = inDate.getDate()
        const outDay     = outDate?.getDate()

        // 다음 입주자와 같은 달 교체 여부 확인
        const next = sorted[i + 1]
        const nextIn = parseSheetDate(next?.['입주일'])
        const isHandover = nextIn && outDate &&
          nextIn.getMonth() === outDate.getMonth() &&
          nextIn.getFullYear() === outDate.getFullYear()

        // 상태 결정 (계약종료 50일 이하 → soon)
        const daysLeft = outDate
          ? Math.floor((outDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        let type: 'in' | 'soon' | 'out' = 'in'
        if (status === '퇴실예정' || status === '퇴실확정') type = 'out'
        else if (daysLeft <= 50) type = 'soon'

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
          const nextOut = parseSheetDate(next?.['퇴실일'])
          const nextDaysLeft = nextOut
            ? Math.floor((nextOut.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999
          let typeN2: 'in' | 'soon' | 'out' = 'in'
          if (nextStatus === '퇴실예정' || nextStatus === '퇴실확정') typeN2 = 'out'
          else if (nextDaysLeft <= 50) typeN2 = 'soon'

          spans.push({
            type: 'handover',
            month: handoverMonth,
            n1: t['이름'],
            outDay: outDay || 1,
            n2: next['이름'],
            inDay: parseSheetDate(next['입주일'])!.getDate(),
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
