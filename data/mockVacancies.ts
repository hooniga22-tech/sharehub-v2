export type Prospect = {
  name: string
  phone: string
  moveIn: string
  deposit: '대기' | '완료'
}

export type Vacancy = {
  id: number
  gu: string
  house: string
  room: string
  type: '현재공실' | '퇴실예정'
  since?: string
  moveOut?: string
  prospect: Prospect | null
  memo: string
}

export const mockVacancies: Vacancy[] = [
  { id: 1, gu: '마포구', house: '공덕하우스', room: '201호', type: '현재공실', since: '3월 15일', prospect: null, memo: '' },
  { id: 2, gu: '마포구', house: '공덕하우스', room: '305호', type: '현재공실', since: '4월 1일', prospect: { name: '김예정', phone: '010-1111-2222', moveIn: '2025-06-15', deposit: '완료' }, memo: '' },
  { id: 3, gu: '강남구', house: '역삼하우스', room: '102호', type: '현재공실', since: '5월 20일', prospect: null, memo: '' },
  { id: 4, gu: '마포구', house: '합정하우스', room: '103호', type: '퇴실예정', moveOut: '2025-06-30', prospect: null, memo: '' },
  { id: 5, gu: '강남구', house: '역삼하우스', room: '205호', type: '퇴실예정', moveOut: '2025-07-15', prospect: { name: '이예정', phone: '010-3333-4444', moveIn: '2025-07-16', deposit: '대기' }, memo: '' },
  { id: 6, gu: '송파구', house: '잠실하우스', room: '301호', type: '퇴실예정', moveOut: '2025-06-25', prospect: null, memo: '' },
  { id: 7, gu: '강동구', house: '천호하우스', room: '402호', type: '퇴실예정', moveOut: '2025-07-01', prospect: null, memo: '' },
]
