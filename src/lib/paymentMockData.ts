// ===== 수납 관리 타입 =====

export interface PaymentTenant {
  id: string;
  name: string;
  district: string;
  house: string;
  room: string;
  phone: string;
  monthlyRent: number;
  deposit: number;
  paymentDay: number;
  status: 'paid' | 'unpaid';
  lateDays?: number;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  month: string; // YYYY.MM
  type: '월세' | '공과금' | '보증금';
  amount: number;
  paid: boolean;
  paidDate?: string;
  method?: string; // 자동매칭 | 수동 | 업로드
  memo?: string;
}

export interface UploadHistory {
  id: string;
  bank: string;
  date: string;
  confirmed: number;
  review: number;
  status: 'completed' | 'pending';
}

export interface MatchResult {
  id: string;
  sender: string;
  amount: number;
  date: string;
  matchType: 'confirmed' | 'review_name' | 'review_amount' | 'unmatched';
  matchedTenant?: PaymentTenant;
  confidence?: string;
}

// ===== Mock 데이터 =====

export const paymentTenants: PaymentTenant[] = [
  // 강남구
  { id: 't1', name: '박지호', district: '강남구', house: '역삼하우스', room: '302호', phone: '010-1234-5678', monthlyRent: 720000, deposit: 1440000, paymentDay: 1, status: 'unpaid', lateDays: 7 },
  { id: 't2', name: '이지은', district: '강남구', house: '역삼하우스', room: '305호', phone: '010-2345-6789', monthlyRent: 650000, deposit: 1300000, paymentDay: 1, status: 'paid' },
  { id: 't3', name: '최수민', district: '강남구', house: '역삼하우스', room: '201호', phone: '010-3456-7890', monthlyRent: 580000, deposit: 1160000, paymentDay: 1, status: 'paid' },
  { id: 't4', name: '정하윤', district: '강남구', house: '삼성하우스', room: '101호', phone: '010-4567-8901', monthlyRent: 800000, deposit: 1600000, paymentDay: 1, status: 'unpaid', lateDays: 3 },
  { id: 't5', name: '김서연', district: '강남구', house: '삼성하우스', room: '203호', phone: '010-5678-9012', monthlyRent: 750000, deposit: 1500000, paymentDay: 1, status: 'paid' },
  // 마포구
  { id: 't6', name: '한유진', district: '마포구', house: '공덕하우스', room: '201호', phone: '010-6789-0123', monthlyRent: 580000, deposit: 1160000, paymentDay: 1, status: 'paid' },
  { id: 't7', name: '오준혁', district: '마포구', house: '공덕하우스', room: '301호', phone: '010-7890-1234', monthlyRent: 550000, deposit: 1100000, paymentDay: 1, status: 'unpaid', lateDays: 12 },
  { id: 't8', name: '윤서아', district: '마포구', house: '합정하우스', room: '102호', phone: '010-8901-2345', monthlyRent: 620000, deposit: 1240000, paymentDay: 1, status: 'paid' },
  { id: 't9', name: '장민서', district: '마포구', house: '합정하우스', room: '205호', phone: '010-9012-3456', monthlyRent: 600000, deposit: 1200000, paymentDay: 1, status: 'paid' },
  // 송파구
  { id: 't10', name: '강도윤', district: '송파구', house: '잠실하우스', room: '301호', phone: '010-0123-4567', monthlyRent: 700000, deposit: 1400000, paymentDay: 1, status: 'paid' },
  { id: 't11', name: '임하은', district: '송파구', house: '잠실하우스', room: '403호', phone: '010-1111-2222', monthlyRent: 680000, deposit: 1360000, paymentDay: 1, status: 'unpaid', lateDays: 5 },
  { id: 't12', name: '배준우', district: '송파구', house: '가락하우스', room: '201호', phone: '010-2222-3333', monthlyRent: 550000, deposit: 1100000, paymentDay: 1, status: 'paid' },
  // 서대문구
  { id: 't13', name: '노은채', district: '서대문구', house: '신촌하우스', room: '102호', phone: '010-3333-4444', monthlyRent: 480000, deposit: 960000, paymentDay: 1, status: 'paid' },
  { id: 't14', name: '고시우', district: '서대문구', house: '신촌하우스', room: '301호', phone: '010-4444-5555', monthlyRent: 500000, deposit: 1000000, paymentDay: 1, status: 'paid' },
  { id: 't15', name: '문지아', district: '서대문구', house: '연희하우스', room: '201호', phone: '010-5555-6666', monthlyRent: 520000, deposit: 1040000, paymentDay: 1, status: 'unpaid', lateDays: 2 },
];

export const paymentRecords: PaymentRecord[] = [
  // t1 박지호 - 미납
  { id: 'pr1', tenantId: 't1', month: '2025.06', type: '월세', amount: 720000, paid: false },
  { id: 'pr1u', tenantId: 't1', month: '2025.06', type: '공과금', amount: 0, paid: false },
  { id: 'pr1a', tenantId: 't1', month: '2025.05', type: '월세', amount: 720000, paid: true, paidDate: '2025-05-01', method: '자동매칭' },
  { id: 'pr1b', tenantId: 't1', month: '2025.05', type: '공과금', amount: 48000, paid: true, paidDate: '2025-05-05', method: '수동' },
  { id: 'pr1c', tenantId: 't1', month: '2025.04', type: '월세', amount: 720000, paid: true, paidDate: '2025-04-01', method: '자동매칭' },
  { id: 'pr1d', tenantId: 't1', month: '2025.04', type: '공과금', amount: 52000, paid: true, paidDate: '2025-04-03', method: '수동' },
  { id: 'pr1e', tenantId: 't1', month: '2025.03', type: '월세', amount: 720000, paid: true, paidDate: '2025-03-02', method: '자동매칭' },
  { id: 'pr1f', tenantId: 't1', month: '2025.03', type: '공과금', amount: 55000, paid: true, paidDate: '2025-03-05', method: '수동' },
  // t2 이지은 - 납부완료
  { id: 'pr2', tenantId: 't2', month: '2025.06', type: '월세', amount: 650000, paid: true, paidDate: '2025-06-01', method: '자동매칭' },
  { id: 'pr2u', tenantId: 't2', month: '2025.06', type: '공과금', amount: 42000, paid: true, paidDate: '2025-06-03', method: '수동' },
  { id: 'pr2a', tenantId: 't2', month: '2025.05', type: '월세', amount: 650000, paid: true, paidDate: '2025-05-01', method: '자동매칭' },
  { id: 'pr2b', tenantId: 't2', month: '2025.05', type: '공과금', amount: 45000, paid: true, paidDate: '2025-05-04', method: '수동' },
  // t4 정하윤 - 미납
  { id: 'pr4', tenantId: 't4', month: '2025.06', type: '월세', amount: 800000, paid: false },
  { id: 'pr4u', tenantId: 't4', month: '2025.06', type: '공과금', amount: 0, paid: false },
  { id: 'pr4a', tenantId: 't4', month: '2025.05', type: '월세', amount: 800000, paid: true, paidDate: '2025-05-02', method: '수동' },
  // t7 오준혁 - 미납
  { id: 'pr7', tenantId: 't7', month: '2025.06', type: '월세', amount: 550000, paid: false },
  { id: 'pr7a', tenantId: 't7', month: '2025.05', type: '월세', amount: 550000, paid: true, paidDate: '2025-05-03', method: '자동매칭' },
  // t11 임하은 - 미납
  { id: 'pr11', tenantId: 't11', month: '2025.06', type: '월세', amount: 680000, paid: false },
  { id: 'pr11a', tenantId: 't11', month: '2025.05', type: '월세', amount: 680000, paid: true, paidDate: '2025-05-01', method: '자동매칭' },
  // t15 문지아 - 미납
  { id: 'pr15', tenantId: 't15', month: '2025.06', type: '월세', amount: 520000, paid: false },
  { id: 'pr15a', tenantId: 't15', month: '2025.05', type: '월세', amount: 520000, paid: true, paidDate: '2025-05-01', method: '수동' },
  // 나머지 납부완료자 - 6월 기록
  ...['t3','t5','t6','t8','t9','t10','t12','t13','t14'].map(tid => {
    const t = paymentTenants.find(x => x.id === tid)!;
    return { id: `pr_${tid}`, tenantId: tid, month: '2025.06', type: '월세' as const, amount: t.monthlyRent, paid: true, paidDate: '2025-06-01', method: '자동매칭' };
  }),
];

export const uploadHistories: UploadHistory[] = [
  { id: 'u1', bank: '국민은행', date: '6월 1일', confirmed: 3, review: 1, status: 'completed' },
  { id: 'u2', bank: '신한은행', date: '6월 5일', confirmed: 2, review: 0, status: 'completed' },
];

// ===== 유틸 =====

export function getDistrictSummary(tenants: PaymentTenant[]) {
  const districts: Record<string, { unpaid: number; paid: number; tenants: PaymentTenant[] }> = {};
  for (const t of tenants) {
    if (!districts[t.district]) districts[t.district] = { unpaid: 0, paid: 0, tenants: [] };
    districts[t.district].tenants.push(t);
    if (t.status === 'unpaid') districts[t.district].unpaid++;
    else districts[t.district].paid++;
  }
  return districts;
}

export function formatWon(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}
