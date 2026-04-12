export type Worker = {
  id: string
  name: string
  initial: string
  type: '고정' | '외부'
  role: '청소' | '수리' | '에어컨' | '방역'
  pay: number
  phone: string
  token: string | null
}

export type WorkTask = {
  id: number
  workerId: string
  worker: string
  type: '청소' | '수리' | '에어컨' | '방역'
  loc: string
  room: string
  date: string
  day: number
  month: number
  year: number
  status: '완료' | '진행중' | '예정'
  memo?: string
  amount: number
  issueId?: number
}

export type WorkIssue = {
  id: number
  loc: string
  room: string
  type: '수리' | '기타'
  title: string
  status: '접수' | '처리중' | '완료'
  assignedId: string | null
  date: string
  urgent: boolean
}

export const mockWorkers: Worker[] = [
  { id: 'w1', name: '김청소', initial: '김', type: '고정', role: '청소', pay: 2200000, phone: '010-1111-2222', token: 'clean-kim-001' },
  { id: 'w2', name: '박수리', initial: '박', type: '고정', role: '수리', pay: 2500000, phone: '010-3333-4444', token: 'fix-park-002' },
  { id: 'w3', name: '이청소', initial: '이', type: '고정', role: '청소', pay: 2000000, phone: '010-5555-6666', token: 'clean-lee-003' },
  { id: 'w4', name: '클린업체', initial: '클', type: '외부', role: '에어컨', pay: 450000, phone: '02-1234-5678', token: null },
  { id: 'w5', name: '해충방역', initial: '해', type: '외부', role: '방역', pay: 380000, phone: '02-9999-0000', token: null },
]

export const mockTasks: WorkTask[] = [
  { id: 1, workerId: 'w1', worker: '김청소', type: '청소', loc: '마포구 공덕', room: '201호', date: '6월 10일', day: 10, month: 6, year: 2025, status: '완료', amount: 55000 },
  { id: 2, workerId: 'w2', worker: '박수리', type: '수리', loc: '강남구 역삼', room: '302호', date: '6월 12일', day: 12, month: 6, year: 2025, status: '진행중', memo: '보일러 수리', amount: 80000, issueId: 1 },
  { id: 3, workerId: 'w1', worker: '김청소', type: '청소', loc: '송파구 잠실', room: '105호', date: '6월 13일', day: 13, month: 6, year: 2025, status: '예정', amount: 55000 },
  { id: 4, workerId: 'w3', worker: '이청소', type: '청소', loc: '강동구 천호', room: '401호', date: '6월 13일', day: 13, month: 6, year: 2025, status: '예정', amount: 55000 },
  { id: 5, workerId: 'w2', worker: '박수리', type: '수리', loc: '마포구 합정', room: '208호', date: '6월 14일', day: 14, month: 6, year: 2025, status: '예정', memo: '변기 수리', amount: 60000, issueId: 2 },
  { id: 6, workerId: 'w3', worker: '이청소', type: '청소', loc: '강남구 삼성', room: '501호', date: '6월 11일', day: 11, month: 6, year: 2025, status: '완료', amount: 55000 },
  { id: 7, workerId: 'w1', worker: '김청소', type: '청소', loc: '마포구 공덕', room: '전체', date: '5월 8일', day: 8, month: 5, year: 2025, status: '완료', amount: 55000 },
  { id: 8, workerId: 'w1', worker: '김청소', type: '청소', loc: '강남구 역삼', room: '전체', date: '5월 15일', day: 15, month: 5, year: 2025, status: '완료', amount: 60000 },
  { id: 9, workerId: 'w3', worker: '이청소', type: '청소', loc: '송파구 잠실', room: '전체', date: '5월 20일', day: 20, month: 5, year: 2025, status: '완료', amount: 55000 },
  { id: 10, workerId: 'w1', worker: '김청소', type: '청소', loc: '마포구 공덕', room: '전체', date: '4월 5일', day: 5, month: 4, year: 2025, status: '완료', amount: 55000 },
  { id: 11, workerId: 'w1', worker: '김청소', type: '청소', loc: '강남구 역삼', room: '전체', date: '4월 12일', day: 12, month: 4, year: 2025, status: '완료', amount: 60000 },
]

export const mockIssues: WorkIssue[] = [
  { id: 1, loc: '강남구 역삼', room: '302호', type: '수리', title: '보일러 이상', status: '처리중', assignedId: 'w2', date: '6월 11일', urgent: true },
  { id: 2, loc: '마포구 합정', room: '208호', type: '수리', title: '변기 막힘', status: '접수', assignedId: null, date: '6월 12일', urgent: false },
  { id: 3, loc: '송파구 잠실', room: '203호', type: '수리', title: '창문 잠금장치 파손', status: '접수', assignedId: null, date: '6월 12일', urgent: false },
  { id: 4, loc: '강동구 천호', room: '401호', type: '기타', title: '소음 민원', status: '접수', assignedId: null, date: '6월 11일', urgent: false },
]

// Color maps
export const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  청소: { bg: '#ebf3ff', color: '#3182f6' },
  수리: { bg: '#fff8e1', color: '#f59f00' },
  에어컨: { bg: '#f0fdf4', color: '#00c471' },
  방역: { bg: '#f5f3ff', color: '#7c3aed' },
}
export const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  완료: { bg: '#e8faf2', color: '#00c471' },
  진행중: { bg: '#fff8e1', color: '#f59f00' },
  예정: { bg: '#f2f4f6', color: '#8b95a1' },
}

export const fmt = (n: number) => n.toLocaleString() + '원'
