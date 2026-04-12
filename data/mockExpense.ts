export type UtilityItem = {
  house: string
  gu: string
  elec: number
  water: number
  gas: number
  internet: number
  purifier: number
}

export type OpexItem = {
  id: number
  date: string
  house: string
  category: '청소' | '수리' | '소모품' | '쓰레기수거' | '기타'
  amount: number
  memo: string
  by: string
}

export const mockUtility: UtilityItem[] = [
  { house: '공덕하우스', gu: '마포구', elec: 447000, water: 85000, gas: 42000, internet: 55000, purifier: 35000 },
  { house: '합정하우스', gu: '마포구', elec: 390000, water: 72000, gas: 38000, internet: 55000, purifier: 35000 },
  { house: '역삼하우스', gu: '강남구', elec: 510000, water: 110000, gas: 55000, internet: 55000, purifier: 35000 },
  { house: '삼성하우스', gu: '강남구', elec: 290000, water: 88000, gas: 41000, internet: 55000, purifier: 35000 },
  { house: '잠실하우스', gu: '송파구', elec: 420000, water: 95000, gas: 48000, internet: 55000, purifier: 35000 },
]

export const mockOpex: OpexItem[] = [
  { id: 1, date: '6월 12일', house: '역삼하우스', category: '수리', amount: 150000, memo: '보일러 수리', by: '박수리' },
  { id: 2, date: '6월 11일', house: '공덕하우스', category: '소모품', amount: 43000, memo: '쿠팡 생활용품', by: '재훈' },
  { id: 3, date: '6월 10일', house: '합정하우스', category: '청소', amount: 80000, memo: '정기청소 추가', by: '김청소' },
  { id: 4, date: '6월 9일', house: '잠실하우스', category: '수리', amount: 95000, memo: '변기 수리', by: '박수리' },
  { id: 5, date: '6월 8일', house: '역삼하우스', category: '소모품', amount: 28000, memo: '화장지/세제', by: '재훈' },
  { id: 6, date: '6월 7일', house: '삼성하우스', category: '기타', amount: 35000, memo: '쓰레기봉투', by: '재훈' },
]

export const utilTotal = (d: UtilityItem): number => d.elec + d.water + d.gas + d.internet + d.purifier

export const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  청소: { bg: '#ebf3ff', color: '#3182f6' },
  수리: { bg: '#fff0f1', color: '#c0392b' },
  소모품: { bg: '#e8faf2', color: '#0e6245' },
  쓰레기수거: { bg: '#f2f4f6', color: '#8b95a1' },
  기타: { bg: '#fff8e1', color: '#b7791f' },
}

export const HOUSES = ['공덕하우스', '합정하우스', '역삼하우스', '삼성하우스', '잠실하우스']
export const CATEGORIES = ['청소', '수리', '소모품', '쓰레기수거', '기타']

export const fmt = (n: number) => n.toLocaleString() + '원'
