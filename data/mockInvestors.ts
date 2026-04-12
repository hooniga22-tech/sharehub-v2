export type InvestorHouse = {
  houseId: number
  houseName: string
  gu: string
  ratio: number
  monthlyProfit: number
}

export type Investor = {
  id: number
  name: string
  phone: string
  token: string
  houses: InvestorHouse[]
}

export const mockInvestors: Investor[] = [
  {
    id: 1, name: '김투자', phone: '010-1111-2222', token: 'inv-kim-001',
    houses: [
      { houseId: 1, houseName: '공덕하우스', gu: '마포구', ratio: 0.7, monthlyProfit: 4280000 },
      { houseId: 4, houseName: '삼성하우스', gu: '강남구', ratio: 0.7, monthlyProfit: 4610000 },
    ],
  },
  {
    id: 2, name: '이투자', phone: '010-3333-4444', token: 'inv-lee-002',
    houses: [
      { houseId: 3, houseName: '역삼하우스', gu: '강남구', ratio: 0.6, monthlyProfit: 5190000 },
    ],
  },
  {
    id: 3, name: '박투자', phone: '010-5555-6666', token: 'inv-park-003',
    houses: [
      { houseId: 6, houseName: '가락하우스', gu: '송파구', ratio: 0.5, monthlyProfit: 3060000 },
    ],
  },
]

export const calcShare = (h: InvestorHouse): number => Math.round(h.monthlyProfit * h.ratio)
export const calcTotalShare = (inv: Investor): number => inv.houses.reduce((a, h) => a + calcShare(h), 0)
export const fmt = (n: number) => n.toLocaleString() + '원'
