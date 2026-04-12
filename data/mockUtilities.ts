export type UtilityBill = {
  houseId: number
  month: number
  year: number
  elec: number
  water: number
  gas: number
  inputDate?: string
}

export type House = {
  id: number
  name: string
  gu: string
  tenants: number
  baseAmount: number
}

export const mockHouses: House[] = [
  { id: 1, name: '공덕하우스', gu: '마포구', tenants: 8, baseAmount: 100000 },
  { id: 2, name: '합정하우스', gu: '마포구', tenants: 6, baseAmount: 100000 },
  { id: 3, name: '역삼하우스', gu: '강남구', tenants: 10, baseAmount: 100000 },
  { id: 4, name: '삼성하우스', gu: '강남구', tenants: 7, baseAmount: 100000 },
  { id: 5, name: '잠실하우스', gu: '송파구', tenants: 9, baseAmount: 100000 },
  { id: 6, name: '가락하우스', gu: '송파구', tenants: 5, baseAmount: 100000 },
  { id: 7, name: '천호하우스', gu: '강동구', tenants: 8, baseAmount: 100000 },
]

export const mockBills: UtilityBill[] = [
  // 6월
  { houseId: 1, month: 6, year: 2025, elec: 320000, water: 85000, gas: 42000, inputDate: '6월 5일' },
  { houseId: 2, month: 6, year: 2025, elec: 280000, water: 72000, gas: 38000, inputDate: '6월 5일' },
  { houseId: 3, month: 6, year: 2025, elec: 510000, water: 110000, gas: 55000, inputDate: '6월 6일' },
  { houseId: 4, month: 6, year: 2025, elec: 290000, water: 88000, gas: 41000, inputDate: '6월 6일' },
  { houseId: 5, month: 6, year: 2025, elec: 420000, water: 95000, gas: 48000, inputDate: '6월 7일' },
  { houseId: 6, month: 6, year: 2025, elec: 210000, water: 62000, gas: 31000, inputDate: '6월 7일' },
  // 7번 미입력
  // 5월
  { houseId: 1, month: 5, year: 2025, elec: 280000, water: 80000, gas: 45000 },
  { houseId: 2, month: 5, year: 2025, elec: 240000, water: 68000, gas: 40000 },
  { houseId: 3, month: 5, year: 2025, elec: 380000, water: 105000, gas: 58000 },
  { houseId: 4, month: 5, year: 2025, elec: 260000, water: 82000, gas: 43000 },
  { houseId: 5, month: 5, year: 2025, elec: 310000, water: 88000, gas: 50000 },
  { houseId: 6, month: 5, year: 2025, elec: 190000, water: 58000, gas: 33000 },
  { houseId: 7, month: 5, year: 2025, elec: 300000, water: 86000, gas: 47000 },
  // 4월
  { houseId: 1, month: 4, year: 2025, elec: 260000, water: 78000, gas: 62000 },
  { houseId: 2, month: 4, year: 2025, elec: 220000, water: 65000, gas: 55000 },
  { houseId: 3, month: 4, year: 2025, elec: 340000, water: 98000, gas: 72000 },
  { houseId: 4, month: 4, year: 2025, elec: 240000, water: 79000, gas: 58000 },
  { houseId: 5, month: 4, year: 2025, elec: 290000, water: 84000, gas: 65000 },
  { houseId: 6, month: 4, year: 2025, elec: 175000, water: 55000, gas: 42000 },
  { houseId: 7, month: 4, year: 2025, elec: 280000, water: 82000, gas: 60000 },
]

// Utility functions
export const totalBill = (b: UtilityBill) => b.elec + b.water + b.gas
export const perPerson = (b: UtilityBill, tenants: number) => Math.round(totalBill(b) / tenants)
export const isOver = (b: UtilityBill, tenants: number, base: number) => perPerson(b, tenants) > base
export const overAmt = (b: UtilityBill, tenants: number, base: number) => Math.max(0, perPerson(b, tenants) - base)
export const fmt = (n: number) => n.toLocaleString() + '원'
