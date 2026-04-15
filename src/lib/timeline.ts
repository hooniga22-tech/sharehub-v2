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

// 입주자 span 생성 헬퍼
function buildSpans(roomTenants: any[]): (TenantSpan | HandoverSpan)[] {
  const spans: (TenantSpan | HandoverSpan)[] = []
  if (roomTenants.length === 0) return spans

  const sorted = [...roomTenants].sort((a, b) =>
    (parseSheetDate(a['입주일'])?.getTime() ?? Date.parse('2099')) - (parseSheetDate(b['입주일'])?.getTime() ?? Date.parse('2099'))
  )

  const nowDate = new Date()
  const YEAR = nowDate.getFullYear()
  const YEAR_START = new Date(YEAR, 0, 1)
  const YEAR_END = new Date(YEAR, 11, 31)

  sorted.forEach((t, i) => {
    const inDate = parseSheetDate(t['입주일'])
    const outDate = parseSheetDate(t['퇴실일'])
    const status = t['상태'] as string

    if (!inDate) return
    if (outDate && outDate < YEAR_START) return
    if (inDate > YEAR_END) return
    if (status === '공실' && outDate && outDate < YEAR_START) return

    const startMonth = Math.max(0, inDate.getFullYear() < YEAR ? 0 : inDate.getMonth())
    const endMonth = Math.min(11, outDate ? (outDate.getFullYear() > YEAR ? 11 : outDate.getMonth()) : 11)
    if (startMonth > endMonth) return

    const inDay = inDate.getDate()
    const outDay = outDate?.getDate()

    const next = sorted[i + 1]
    const nextIn = parseSheetDate(next?.['입주일'])
    const isHandover = nextIn && outDate &&
      nextIn.getMonth() === outDate.getMonth() &&
      nextIn.getFullYear() === outDate.getFullYear()

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
          type, name: t['이름'], startMonth, endMonth: handoverMonth - 1, inDay,
          rent: Number(t['월세']) || 0, deposit: Number(t['보증금']) || 0,
          contractEnd: t['퇴실일'], tenantId: t['입주자ID'],
        } as TenantSpan)
      }

      const nextStatus = next?.['상태'] as string
      const nextOut = parseSheetDate(next?.['퇴실일'])
      const nextDaysLeft = nextOut
        ? Math.floor((nextOut.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      let typeN2: 'in' | 'soon' | 'out' = 'in'
      if (nextStatus === '퇴실예정' || nextStatus === '퇴실확정') typeN2 = 'out'
      else if (nextDaysLeft <= 50) typeN2 = 'soon'

      spans.push({
        type: 'handover', month: handoverMonth, n1: t['이름'], outDay: outDay || 1,
        n2: next['이름'], inDay: parseSheetDate(next['입주일'])!.getDate(),
        rent1: Number(t['월세']) || 0, rent2: Number(next['월세']) || 0,
        deposit1: Number(t['보증금']) || 0, deposit2: Number(next['보증금']) || 0,
        contractEnd1: t['퇴실일'], contractEnd2: next['퇴실일'], typeN2,
        tenantId1: t['입주자ID'], tenantId2: next['입주자ID'],
      } as HandoverSpan)
    } else {
      spans.push({
        type, name: t['이름'], startMonth, endMonth, inDay, outDay,
        rent: Number(t['월세']) || 0, deposit: Number(t['보증금']) || 0,
        contractEnd: t['퇴실일'], tenantId: t['입주자ID'],
      } as TenantSpan)
    }
  })

  return spans
}

// Google Sheets 입주자+방 데이터 → HouseTimeline 변환
export function buildTimelines(tenants: any[], rooms?: any[]): HouseTimeline[] {
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

  // 입주자를 지점명+방코드로 인덱싱
  const tenantsByHouseRoom: Record<string, any[]> = {}
  deduped.forEach(t => {
    const key = `${t['지점명']}__${t['방코드']}`
    if (!tenantsByHouseRoom[key]) tenantsByHouseRoom[key] = []
    tenantsByHouseRoom[key].push(t)
  })

  // 방 탭 데이터가 있으면 방 탭 기준으로 빌드
  if (rooms && rooms.length > 0) {
    // 방을 지점명으로 그룹핑
    const roomsByHouse: Record<string, any[]> = {}
    const houseDistricts: Record<string, string> = {}
    rooms.forEach(r => {
      const house = r.houseName || '미분류'
      if (!roomsByHouse[house]) roomsByHouse[house] = []
      roomsByHouse[house].push(r)
    })

    // 구 정보는 입주자 데이터에서 가져옴
    deduped.forEach(t => {
      const house = t['지점명']
      if (house && t['구'] && !houseDistricts[house]) {
        houseDistricts[house] = t['구']
      }
    })

    return Object.entries(roomsByHouse).sort((a, b) => a[0].localeCompare(b[0])).map(([houseName, houseRooms]) => {
      const sortedRooms = [...houseRooms].sort((a, b) => (a.roomCode || '').localeCompare(b.roomCode || ''))

      const timelineRooms: RoomTimeline[] = sortedRooms.map(room => {
        const key = `${houseName}__${room.roomCode}`
        const roomTenants = tenantsByHouseRoom[key] || []
        const spans = buildSpans(roomTenants)
        return { code: room.roomCode, loc: room.roomType || '', tenants: spans }
      })

      return {
        id: houseName,
        name: houseName,
        district: houseDistricts[houseName] || '',
        rentDisplay: '',
        total: sortedRooms.length,
        rooms: timelineRooms,
      }
    })
  }

  // fallback: 방 탭 없으면 기존 방식 (입주자 데이터만으로 빌드)
  const houseMap: Record<string, any[]> = {}
  deduped.forEach(t => {
    const key = t['지점명'] || '미분류'
    if (!houseMap[key]) houseMap[key] = []
    houseMap[key].push(t)
  })

  return Object.entries(houseMap).sort((a, b) => a[0].localeCompare(b[0])).map(([houseName, tenantList]) => {
    const roomMap: Record<string, any[]> = {}
    tenantList.forEach(t => {
      const code = t['방코드'] || '?'
      if (!roomMap[code]) roomMap[code] = []
      roomMap[code].push(t)
    })

    const timelineRooms: RoomTimeline[] = Object.entries(roomMap).sort((a, b) => a[0].localeCompare(b[0])).map(([code, roomTenants]) => {
      const spans = buildSpans(roomTenants)
      return { code, loc: roomTenants[0]?.['방타입'] || '', tenants: spans }
    })

    return {
      id: houseName,
      name: houseName,
      district: tenantList[0]?.['구'] || '',
      rentDisplay: '',
      total: timelineRooms.length,
      rooms: timelineRooms,
    }
  })
}
