export type TenantSpan = {
  type: 'in' | 'soon' | 'out'
  name: string
  startMonth: number    // 0=1월, 11=12월
  endMonth: number
  inDay?: number        // 월 중 입실일 (1이면 생략)
  outDay?: number       // 월 중 퇴실일
  rent: number
  deposit: number
  contractEnd?: string  // 'YYYY-MM-DD'
  tenantId?: string
}

export type HandoverSpan = {
  type: 'handover'
  month: number         // 교체 발생 월 (0-indexed)
  n1: string            // 퇴실 입주자
  outDay: number
  n2: string            // 신규 입주자
  inDay: number
  rent1: number
  rent2: number
  deposit1: number
  deposit2: number
  contractEnd1?: string
  contractEnd2?: string
  typeN2: 'in' | 'soon' | 'out'
  tenantId1?: string
  tenantId2?: string
}

export type RoomTimeline = {
  code: string
  loc: string
  tenants: (TenantSpan | HandoverSpan)[]
}

export type HouseTimeline = {
  id: string
  name: string
  district: string
  rentDisplay: string
  total: number
  rooms: RoomTimeline[]
}
