export type DutyStatus = '완료' | '예정' | '미완료' | '면제' | '건너뜀' | '스킵'
export type DutyType = '당번' | '공실' | '청소주'

export type DutySlot = {
  weekStart: string
  room: string
  name: string
  type: DutyType
  status: DutyStatus
  completedAt: string | null
  completedBy: 'tenant' | 'admin' | null
  exemptReason: string | null
}

export type ExchangeRequest = {
  id: number
  fromName: string
  myWeekStart: string
  theirWeekStart: string
}

export type DutyHouse = {
  id: number
  name: string
}

export const THIS_WEEK = '2025-06-16'

export const mockDutyHouses: DutyHouse[] = [
  { id: 1, name: '공덕하우스' },
  { id: 2, name: '합정하우스' },
  { id: 3, name: '역삼하우스' },
  { id: 4, name: '잠실하우스' },
]

export const mockSchedule: DutySlot[] = [
  { weekStart: '2025-05-19', room: '101호', name: '김민준', type: '당번', status: '완료', completedAt: '5월 20일 오전 10:30', completedBy: 'tenant', exemptReason: null },
  { weekStart: '2025-05-26', room: '102호', name: '이수연', type: '당번', status: '완료', completedAt: '5월 27일 오후 2:15', completedBy: 'tenant', exemptReason: null },
  { weekStart: '2025-06-02', room: '103호', name: '', type: '공실', status: '건너뜀', completedAt: null, completedBy: null, exemptReason: null },
  { weekStart: '2025-06-09', room: '', name: '', type: '청소주', status: '스킵', completedAt: null, completedBy: null, exemptReason: null },
  { weekStart: '2025-06-16', room: '201호', name: '정다은', type: '당번', status: '예정', completedAt: null, completedBy: null, exemptReason: null },
  { weekStart: '2025-06-23', room: '202호', name: '최준혁', type: '당번', status: '예정', completedAt: null, completedBy: null, exemptReason: null },
  { weekStart: '2025-06-30', room: '101호', name: '김민준', type: '당번', status: '예정', completedAt: null, completedBy: null, exemptReason: null },
]

export const mockExchangeRequests: ExchangeRequest[] = [
  { id: 1, fromName: '최준혁', myWeekStart: '2025-06-16', theirWeekStart: '2025-06-23' },
]

export const fmtWeek = (weekStart: string): string => {
  const d = new Date(weekStart)
  const e = new Date(d)
  e.setDate(d.getDate() + 6)
  return `${d.getMonth() + 1}/${d.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`
}
