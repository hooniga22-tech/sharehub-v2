export type House = {
  id: number
  name: string
  gu: string
  tenants: number
  rent: number
  mgmt: number
  investor: { name: string; ratio: number; token: string } | null
}

export type Expense = {
  utility: number
  worker: number
  ops: number
  extra: { label: string; amt: number }[]
}

export type Investor = {
  name: string
  token: string
  houses: number[]
}

export const mockHouses: House[] = [
  { id: 1, name: '공덕하우스', gu: '마포구', tenants: 8, rent: 580000, mgmt: 100000, investor: { name: '김투자', ratio: 0.7, token: 'inv-kim-001' } },
  { id: 2, name: '합정하우스', gu: '마포구', tenants: 6, rent: 540000, mgmt: 100000, investor: null },
  { id: 3, name: '역삼하우스', gu: '강남구', tenants: 10, rent: 650000, mgmt: 100000, investor: { name: '이투자', ratio: 0.6, token: 'inv-lee-002' } },
  { id: 4, name: '삼성하우스', gu: '강남구', tenants: 7, rent: 780000, mgmt: 100000, investor: { name: '김투자', ratio: 0.7, token: 'inv-kim-001' } },
  { id: 5, name: '잠실하우스', gu: '송파구', tenants: 9, rent: 610000, mgmt: 100000, investor: null },
  { id: 6, name: '가락하우스', gu: '송파구', tenants: 5, rent: 560000, mgmt: 100000, investor: { name: '박투자', ratio: 0.5, token: 'inv-park-003' } },
  { id: 7, name: '천호하우스', gu: '강동구', tenants: 8, rent: 500000, mgmt: 100000, investor: null },
]

export const mockExpenses: Record<string, Record<number, Expense>> = {
  '2025-4': {
    1: { utility: 385000, worker: 200000, ops: 80000, extra: [] },
    2: { utility: 320000, worker: 160000, ops: 60000, extra: [] },
    3: { utility: 510000, worker: 230000, ops: 110000, extra: [{ label: '수리비', amt: 120000 }] },
    4: { utility: 380000, worker: 185000, ops: 88000, extra: [] },
    5: { utility: 490000, worker: 210000, ops: 100000, extra: [] },
    6: { utility: 270000, worker: 140000, ops: 50000, extra: [] },
    7: { utility: 400000, worker: 195000, ops: 85000, extra: [] },
  },
  '2025-5': {
    1: { utility: 405000, worker: 210000, ops: 82000, extra: [] },
    2: { utility: 340000, worker: 170000, ops: 62000, extra: [] },
    3: { utility: 543000, worker: 240000, ops: 115000, extra: [] },
    4: { utility: 395000, worker: 190000, ops: 90000, extra: [] },
    5: { utility: 510000, worker: 220000, ops: 105000, extra: [] },
    6: { utility: 280000, worker: 145000, ops: 52000, extra: [] },
    7: { utility: 415000, worker: 200000, ops: 88000, extra: [{ label: '도배비', amt: 200000 }] },
  },
  '2025-6': {
    1: { utility: 447000, worker: 220000, ops: 85000, extra: [] },
    2: { utility: 390000, worker: 180000, ops: 65000, extra: [] },
    3: { utility: 675000, worker: 250000, ops: 120000, extra: [{ label: '수리비', amt: 150000 }] },
    4: { utility: 419000, worker: 200000, ops: 95000, extra: [] },
    5: { utility: 563000, worker: 230000, ops: 110000, extra: [] },
    6: { utility: 303000, worker: 150000, ops: 55000, extra: [] },
    7: { utility: 436000, worker: 210000, ops: 90000, extra: [{ label: '도배비', amt: 200000 }] },
  },
}

export const mockInvestors: Investor[] = [
  { name: '김투자', token: 'inv-kim-001', houses: [1, 4] },
  { name: '이투자', token: 'inv-lee-002', houses: [3] },
  { name: '박투자', token: 'inv-park-003', houses: [6] },
]

export const getExp = (houseId: number, yk: string): Expense =>
  mockExpenses[yk]?.[houseId] || { utility: 0, worker: 0, ops: 0, extra: [] }

export const sumExp = (e: Expense): number =>
  e.utility + e.worker + e.ops + e.extra.reduce((a, x) => a + x.amt, 0)

export const calcRev = (h: House): number =>
  (h.rent + h.mgmt) * h.tenants

export const calcProfit = (h: House, yk: string): number =>
  calcRev(h) - sumExp(getExp(h.id, yk))

export const calcInvShare = (h: House, yk: string): number =>
  h.investor ? Math.round(calcProfit(h, yk) * h.investor.ratio) : 0

export const calcOwnShare = (h: House, yk: string): number =>
  calcProfit(h, yk) - calcInvShare(h, yk)

export const fmt = (n: number) => n.toLocaleString() + '원'
