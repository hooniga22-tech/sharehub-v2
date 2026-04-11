// ============================================================
// ShareHub v2 — 목업 데이터
// ============================================================

// --- 홈 ---
export const homeData = {
  occupancyRate: 89,
  pendingIssues: 5,
  weeklyCheckouts: 3,
  unpaidAmount: 1440000,
  todos: [
    { text: '공덕 301 수도 누수 수리', type: 'urgent' as const },
    { text: '박○○ 월세 3일 미납 연락', type: 'payment' as const },
    { text: '이문하우스 퇴실 점검', type: 'checkout' as const },
    { text: '신규 입주자 계약서 서명', type: 'contract' as const },
  ],
  schedule: [
    { date: '오늘', name: '긴급수리 — 공덕 301', place: '수도 누수', color: 'red' },
    { date: '4/12', name: '퇴실 점검 — 이문하우스', place: '205호 이○○', color: 'green' },
    { date: '4/14', name: '용역 청소 — 단짠하우스', place: '김청소 담당', color: 'amber' },
    { date: '4/15', name: '신규 입주 2건', place: '공덕 · 워너비', color: 'blue' },
  ],
};

// --- 입주자 (구/지점) ---
export interface Branch {
  name: string;
  rooms: number;
  tenants: number;
  vacant: number;
  monthlyRent: number;
}

export interface District {
  name: string;
  color: string;
  bg: string;
  branches: Branch[];
}

export const districts: District[] = [
  {
    name: '마포구', color: '#3182F6', bg: '#EEF3FF',
    branches: [
      { name: '공덕하우스', rooms: 12, tenants: 11, vacant: 1, monthlyRent: 8800000 },
      { name: '단짠하우스', rooms: 8, tenants: 8, vacant: 0, monthlyRent: 5600000 },
      { name: '워너비하우스', rooms: 10, tenants: 8, vacant: 2, monthlyRent: 6400000 },
      { name: '아현하우스', rooms: 6, tenants: 6, vacant: 0, monthlyRent: 4800000 },
    ],
  },
  {
    name: '서대문구', color: '#7C3AED', bg: '#F3EEFF',
    branches: [
      { name: '북가좌하우스', rooms: 8, tenants: 8, vacant: 0, monthlyRent: 5200000 },
      { name: '홍제하우스', rooms: 7, tenants: 7, vacant: 0, monthlyRent: 4900000 },
    ],
  },
  {
    name: '은평구', color: '#00B493', bg: '#E8FBF5',
    branches: [
      { name: '녹번하우스', rooms: 8, tenants: 7, vacant: 1, monthlyRent: 4200000 },
    ],
  },
  {
    name: '동대문구', color: '#D97706', bg: '#FFF8E8',
    branches: [
      { name: '이문하우스', rooms: 8, tenants: 6, vacant: 2, monthlyRent: 4000000 },
      { name: '회기하우스', rooms: 7, tenants: 5, vacant: 2, monthlyRent: 3500000 },
    ],
  },
  {
    name: '성북구', color: '#F04452', bg: '#FFF0F0',
    branches: [
      { name: '길음하우스', rooms: 7, tenants: 7, vacant: 0, monthlyRent: 4200000 },
    ],
  },
];

// --- 퇴실예정 ---
export const upcomingCheckouts = [
  { name: '이○○', house: '이문하우스', room: '205호', date: '4/15', tenantId: 'tenant-3' },
  { name: '최○○', house: '워너비하우스', room: 'C1호', date: '4/20', tenantId: 'tenant-4' },
  { name: '한○○', house: '녹번하우스', room: '301호', date: '4/28', tenantId: 'tenant-8' },
];

// --- 입실예정 ---
export const upcomingCheckins = [
  { name: '조○○', house: '공덕하우스', room: 'G-2호', date: '4/16', tenantId: 'tenant-new-1' },
  { name: '서○○', house: '워너비하우스', room: 'D-1호', date: '4/18', tenantId: 'tenant-new-2' },
  { name: '임○○', house: '이문하우스', room: '103호', date: '4/22', tenantId: 'tenant-new-3' },
  { name: '노○○', house: '회기하우스', room: '201호', date: '4/25', tenantId: 'tenant-new-4' },
];

// --- 공실 ---
export const vacantRooms = [
  { house: '공덕하우스', room: 'G-2호', district: '마포구', rent: 520000 },
  { house: '워너비하우스', room: 'D-1호', district: '마포구', rent: 480000 },
  { house: '워너비하우스', room: 'E-2호', district: '마포구', rent: 500000 },
  { house: '녹번하우스', room: '301호', district: '은평구', rent: 420000 },
  { house: '이문하우스', room: '103호', district: '동대문구', rent: 380000 },
  { house: '이문하우스', room: '206호', district: '동대문구', rent: 400000 },
  { house: '회기하우스', room: '201호', district: '동대문구', rent: 350000 },
  { house: '회기하우스', room: '305호', district: '동대문구', rent: 370000 },
];

// --- 지점 상세 ---
export interface RoomInfo {
  id: string;
  name: string;
  tenantName: string | null;
  tenantId: string | null;
  contractEnd: string | null;
  rent: number;
  status: 'paid' | 'unpaid' | 'checkout' | 'vacant';
  unpaidDays?: number;
}

export interface BranchDetail {
  id: string;
  name: string;
  district: string;
  districtColor: string;
  address: string;
  tenants: number;
  vacant: number;
  monthlyRent: number;
  rooms: RoomInfo[];
}

export const branchDetails: Record<string, BranchDetail> = {
  gongdeok: {
    id: 'gongdeok', name: '공덕하우스', district: '마포구', districtColor: '#3182F6',
    address: '서울시 마포구 공덕동 123-4', tenants: 11, vacant: 1, monthlyRent: 8800000,
    rooms: [
      { id: 'A1', name: 'A-1호', tenantName: '김○○', tenantId: 'tenant-1', contractEnd: '2026.09.30', rent: 550000, status: 'paid' },
      { id: 'A2', name: 'A-2호', tenantName: '나○○', tenantId: 'tenant-9', contractEnd: '2026.12.15', rent: 550000, status: 'paid' },
      { id: 'B1', name: 'B-1호', tenantName: '다○○', tenantId: 'tenant-10', contractEnd: '2027.01.20', rent: 480000, status: 'paid' },
      { id: 'B2', name: 'B-2호', tenantName: '박○○', tenantId: 'tenant-2', contractEnd: '2026.06.14', rent: 480000, status: 'unpaid', unpaidDays: 3 },
      { id: 'C1', name: 'C-1호', tenantName: '이○○', tenantId: 'tenant-3', contractEnd: '2026.04.15', rent: 520000, status: 'checkout' },
      { id: 'C2', name: 'C-2호', tenantName: '마○○', tenantId: 'tenant-11', contractEnd: '2026.08.30', rent: 520000, status: 'paid' },
      { id: 'D1', name: 'D-1호', tenantName: '바○○', tenantId: 'tenant-12', contractEnd: '2026.11.10', rent: 500000, status: 'paid' },
      { id: 'D2', name: 'D-2호', tenantName: '사○○', tenantId: 'tenant-13', contractEnd: '2027.02.28', rent: 500000, status: 'paid' },
      { id: 'E1', name: 'E-1호', tenantName: '강○○', tenantId: 'tenant-6', contractEnd: '2026.10.15', rent: 480000, status: 'paid' },
      { id: 'F1', name: 'F-1호', tenantName: '아○○', tenantId: 'tenant-14', contractEnd: '2026.07.20', rent: 500000, status: 'paid' },
      { id: 'F2', name: 'F-2호', tenantName: '자○○', tenantId: 'tenant-15', contractEnd: '2026.09.10', rent: 500000, status: 'paid' },
      { id: 'G2', name: 'G-2호', tenantName: null, tenantId: null, contractEnd: null, rent: 520000, status: 'vacant' },
    ],
  },
  danzzan: {
    id: 'danzzan', name: '단짠하우스', district: '마포구', districtColor: '#3182F6',
    address: '서울시 마포구 대흥동 45-6', tenants: 8, vacant: 0, monthlyRent: 5600000,
    rooms: [
      { id: 'A1', name: 'A1호', tenantName: '윤○○', tenantId: 'tenant-7', contractEnd: '2026.08.20', rent: 700000, status: 'paid' },
      { id: 'A2', name: 'A2호', tenantName: '차○○', tenantId: 'tenant-16', contractEnd: '2026.11.30', rent: 700000, status: 'paid' },
      { id: 'B1', name: 'B1호', tenantName: '카○○', tenantId: 'tenant-17', contractEnd: '2027.01.15', rent: 700000, status: 'paid' },
      { id: 'B2', name: 'B02호', tenantName: '박○○', tenantId: 'tenant-2b', contractEnd: '2026.06.30', rent: 700000, status: 'paid' },
      { id: 'C1', name: 'C1호', tenantName: '타○○', tenantId: 'tenant-18', contractEnd: '2026.09.25', rent: 700000, status: 'paid' },
      { id: 'C2', name: 'C2호', tenantName: '파○○', tenantId: 'tenant-19', contractEnd: '2026.12.10', rent: 700000, status: 'paid' },
      { id: 'D1', name: 'D1호', tenantName: '하○○', tenantId: 'tenant-20', contractEnd: '2027.03.05', rent: 700000, status: 'paid' },
      { id: 'D2', name: 'D2호', tenantName: '갈○○', tenantId: 'tenant-21', contractEnd: '2026.10.20', rent: 700000, status: 'paid' },
    ],
  },
  wannabe: {
    id: 'wannabe', name: '워너비하우스', district: '마포구', districtColor: '#3182F6',
    address: '서울시 마포구 신수동 78-9', tenants: 8, vacant: 2, monthlyRent: 6400000,
    rooms: [
      { id: 'A1', name: 'A-1호', tenantName: '남○○', tenantId: 'tenant-22', contractEnd: '2026.07.30', rent: 640000, status: 'paid' },
      { id: 'B1', name: 'B-1호', tenantName: '달○○', tenantId: 'tenant-23', contractEnd: '2026.08.15', rent: 640000, status: 'paid' },
      { id: 'C1', name: 'C1호', tenantName: '최○○', tenantId: 'tenant-4', contractEnd: '2026.04.20', rent: 640000, status: 'checkout' },
      { id: 'C2', name: 'C2호', tenantName: '랄○○', tenantId: 'tenant-24', contractEnd: '2026.11.10', rent: 640000, status: 'paid' },
      { id: 'D1', name: 'D-1호', tenantName: null, tenantId: null, contractEnd: null, rent: 640000, status: 'vacant' },
      { id: 'D2', name: 'D-2호', tenantName: '말○○', tenantId: 'tenant-25', contractEnd: '2027.01.20', rent: 640000, status: 'paid' },
      { id: 'E1', name: 'E-1호', tenantName: '발○○', tenantId: 'tenant-26', contractEnd: '2026.09.05', rent: 640000, status: 'paid' },
      { id: 'E2', name: 'E-2호', tenantName: null, tenantId: null, contractEnd: null, rent: 640000, status: 'vacant' },
      { id: 'F1', name: 'F-1호', tenantName: '살○○', tenantId: 'tenant-27', contractEnd: '2026.10.20', rent: 640000, status: 'paid' },
      { id: 'F2', name: 'F-2호', tenantName: '알○○', tenantId: 'tenant-28', contractEnd: '2026.12.25', rent: 640000, status: 'paid' },
    ],
  },
};

// 간단한 ID → 지점 매핑 (이름 기반)
export function getBranchIdByName(name: string): string | null {
  const map: Record<string, string> = {
    '공덕하우스': 'gongdeok',
    '단짠하우스': 'danzzan',
    '워너비하우스': 'wannabe',
  };
  return map[name] || null;
}

// --- 입주자 상세 ---
export interface TenantDetail {
  id: string;
  name: string;
  house: string;
  houseId: string;
  room: string;
  phone: string;
  moveInDate: string;
  contractEnd: string;
  monthlyRent: number;
  deposit: number;
  paymentDay: number;
  paymentStatus: 'paid' | 'unpaid' | 'checkout';
  payments: {
    month: string;
    type: string;
    amount: number;
    date: string;
    status: 'paid' | 'late' | 'unpaid';
    lateDays?: number;
  }[];
  activities: {
    type: 'request' | 'issue' | 'contract';
    icon: string;
    title: string;
    desc: string;
    date: string;
    status: string;
  }[];
  memo: string;
  memoUpdatedAt: string;
}

export const tenantDetails: Record<string, TenantDetail> = {
  'tenant-1': {
    id: 'tenant-1', name: '김○○', house: '공덕하우스', houseId: 'gongdeok', room: 'A-1호',
    phone: '010-0000-0000', moveInDate: '2025-10-01', contractEnd: '2026-09-30',
    monthlyRent: 550000, deposit: 500000, paymentDay: 1, paymentStatus: 'paid',
    payments: [
      { month: '2026년 4월', type: '월세', amount: 550000, date: '4/2', status: 'paid' },
      { month: '2026년 3월', type: '월세', amount: 550000, date: '3/1', status: 'paid' },
      { month: '2026년 2월', type: '월세', amount: 550000, date: '2/4', status: 'late', lateDays: 3 },
      { month: '2025년 12월', type: '공과금', amount: 38000, date: '1/5', status: 'paid' },
    ],
    activities: [
      { type: 'request', icon: 'aircon', title: '에어컨 청소 신청', desc: '4월 16일 예약 완료 · 담당 박수리', date: '2026.04.08', status: '신청' },
      { type: 'issue', icon: 'repair', title: '세탁기 배수 불량 수리', desc: '이틀 만에 처리 완료', date: '2026.03.10 접수 · 3/12 완료', status: '완료' },
      { type: 'request', icon: 'clean', title: '방청소 신청', desc: '처리 완료', date: '2026.02.20 · 2/22 완료', status: '완료' },
      { type: 'contract', icon: 'contract', title: '입주 계약 완료', desc: '보증금 500,000원 · 월세 550,000원', date: '2025.09.28', status: '계약' },
    ],
    memo: '조용하고 깔끔하게 사용함. 대체로 납부 성실. 계약 연장 의향 있다고 언급.',
    memoUpdatedAt: '2026.03.01',
  },
  'tenant-2': {
    id: 'tenant-2', name: '박○○', house: '공덕하우스', houseId: 'gongdeok', room: 'B-2호',
    phone: '010-1111-1111', moveInDate: '2025-07-01', contractEnd: '2026-06-14',
    monthlyRent: 480000, deposit: 500000, paymentDay: 1, paymentStatus: 'unpaid',
    payments: [
      { month: '2026년 4월', type: '월세', amount: 480000, date: '-', status: 'unpaid' },
      { month: '2026년 3월', type: '월세', amount: 480000, date: '3/3', status: 'late', lateDays: 2 },
      { month: '2026년 2월', type: '월세', amount: 480000, date: '2/1', status: 'paid' },
    ],
    activities: [
      { type: 'issue', icon: 'repair', title: '수도 누수 접수', desc: '처리 중', date: '2026.04.08', status: '처리중' },
    ],
    memo: '납부가 지연되는 경우가 종종 있음. 연락 시 바로 입금하는 편.',
    memoUpdatedAt: '2026.04.01',
  },
  'tenant-3': {
    id: 'tenant-3', name: '이○○', house: '이문하우스', houseId: 'imun', room: '205호',
    phone: '010-2222-2222', moveInDate: '2025-04-15', contractEnd: '2026-04-15',
    monthlyRent: 400000, deposit: 300000, paymentDay: 15, paymentStatus: 'checkout',
    payments: [
      { month: '2026년 4월', type: '월세', amount: 400000, date: '4/1', status: 'paid' },
      { month: '2026년 3월', type: '월세', amount: 400000, date: '3/15', status: 'paid' },
    ],
    activities: [
      { type: 'contract', icon: 'contract', title: '퇴실 예정', desc: '4/15 퇴실 · 퇴실 점검 필요', date: '2026.04.01', status: '퇴실' },
    ],
    memo: '퇴실 예정. 퇴실 점검 일정 확인 필요.',
    memoUpdatedAt: '2026.04.01',
  },
};

// --- 이슈 ---
export interface Issue {
  id: number;
  title: string;
  place: string;
  houseId: string;
  tenantId: string;
  tenant: string;
  type: string;
  status: 'waiting' | 'inprogress' | 'done';
  urgent: boolean;
  elapsed: number;
  date: string;
  manager: string;
  memo: string;
  memoDate: string;
}

export const issues: Issue[] = [
  { id: 1, title: '공덕 301 수도 누수', place: '공덕하우스 301호', houseId: 'gongdeok', tenantId: 'tenant-1', tenant: '김○○', type: '수리', status: 'inprogress', urgent: true, elapsed: 3, date: '2026.04.08', manager: '미배정', memo: '수도 밸브 누수 확인. 수리업체 연락 완료, 4/12 방문 예정.', memoDate: '2026.04.10' },
  { id: 2, title: '단짠 B02 에어컨 미작동', place: '단짠하우스 B02호', houseId: 'danzzan', tenantId: 'tenant-2', tenant: '박○○', type: '수리', status: 'inprogress', urgent: true, elapsed: 4, date: '2026.04.07', manager: '박수리', memo: '에어컨 실외기 점검 필요. 4/13 방문 확정.', memoDate: '2026.04.09' },
  { id: 3, title: '이문 205 방문 잠금 이상', place: '이문하우스 205호', houseId: 'imun', tenantId: 'tenant-3', tenant: '이○○', type: '교체', status: 'inprogress', urgent: false, elapsed: 1, date: '2026.04.10', manager: '미배정', memo: '', memoDate: '' },
  { id: 4, title: '워너비 C1 세탁기 오류', place: '워너비하우스 C1호', houseId: 'wannabe', tenantId: 'tenant-4', tenant: '최○○', type: '수리', status: 'inprogress', urgent: false, elapsed: 1, date: '2026.04.10', manager: '미배정', memo: '', memoDate: '' },
  { id: 5, title: '아현 102 형광등 교체', place: '아현하우스 102호', houseId: 'ahyeon', tenantId: 'tenant-5', tenant: '정○○', type: '교체', status: 'waiting', urgent: false, elapsed: 1, date: '2026.04.10', manager: '미배정', memo: '', memoDate: '' },
  { id: 6, title: '공덕 205 변기 막힘', place: '공덕하우스 205호', houseId: 'gongdeok', tenantId: 'tenant-6', tenant: '강○○', type: '수리', status: 'done', urgent: true, elapsed: 0, date: '2026.04.05', manager: '김수리', memo: '4/6 완료 처리.', memoDate: '2026.04.06' },
  { id: 7, title: '단짠 A1 도어락 교체', place: '단짠하우스 A1호', houseId: 'danzzan', tenantId: 'tenant-7', tenant: '윤○○', type: '교체', status: 'done', urgent: false, elapsed: 0, date: '2026.04.03', manager: '이수리', memo: '새 도어락 설치 완료.', memoDate: '2026.04.04' },
];

// --- 관리 메뉴 ---
export const manageMenus = {
  operation: [
    { slug: 'vacancy', name: '공실 관리', desc: '지역별 공실 및 예정 현황', badge: '25', iconBg: '#FFF8E8', iconColor: '#D97706' },
    { slug: 'worker', name: '용역 관리', desc: '청소/수리 일정 및 정산', badge: '54건', iconBg: '#EEF3FF', iconColor: '#3182F6' },
    { slug: 'duty', name: '당번 관리', desc: '지점별 청소 당번 배정', badge: null, iconBg: '#F3EEFF', iconColor: '#7C3AED' },
    { slug: 'applications', name: '신청 관리', desc: '투어/퇴실/청소 신청 내역', badge: '2', iconBg: '#E8FBF5', iconColor: '#00B493' },
    { slug: 'investors', name: '투자자 관리', desc: '투자자별 수익 현황 링크', badge: null, iconBg: '#E8FBF5', iconColor: '#0D9488' },
  ],
  finance: [
    { slug: 'payment', name: '수납 관리', desc: '월세/보증금 납부 현황', badge: '미납 3', iconBg: '#FFF0F0', iconColor: '#F04452' },
    { slug: 'profit', name: '매출·순이익', desc: '월별 수입 및 순이익 현황', badge: null, iconBg: '#E8FBF5', iconColor: '#0D9488' },
    { slug: 'expense', name: '지출 관리', desc: '공과금 + 기타지출 통합', badge: null, iconBg: '#FFF0F8', iconColor: '#EC4899' },
    { slug: 'utility', name: '공과금 관리', desc: '지점별 월별 공과금 입력', badge: null, iconBg: '#FFF8E8', iconColor: '#D97706' },
  ],
};

// --- 유틸 ---
export function formatCurrency(n: number): string {
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rest = n % 10000;
    return rest > 0 ? `${man}만 ${rest.toLocaleString()}` : `${man}만`;
  }
  return n.toLocaleString();
}

export function formatWon(n: number): string {
  return n.toLocaleString() + '원';
}
