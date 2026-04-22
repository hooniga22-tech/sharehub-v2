// 영문 DB 값 → 한국어 표시 라벨
export const TENANT_STATUS_LABEL: Record<string, string> = {
  active: '입주중',
  moved_out: '퇴실완료',
  cancelled: '계약취소',
  pending: '대기',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: '납부완료',
  partial: '부분납부',
  unpaid: '미납',
}

export const VACANCY_STATUS_LABEL: Record<string, string> = {
  occupied: '입주중',
  vacating_soon: '퇴실예정',
  vacant: '공실',
}

export const ISSUE_STATUS_LABEL: Record<string, string> = {
  pending: '접수',
  in_progress: '진행중',
  done: '완료',
  cancelled: '취소',
}

export const DUTY_STATUS_LABEL: Record<string, string> = {
  scheduled: '예정',
  done: '완료',
  skipped: '스킵',
  missed: '미완료',
}

export const APPLY_STATUS_LABEL: Record<string, string> = {
  pending: '신청접수',
  received: '접수',
  completed: '처리완료',
}

// 배지 색상 (토스 컬러)
export const TENANT_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  active: { bg: '#E8F3FF', fg: '#3182F6' },
  moved_out: { bg: '#F2F4F6', fg: '#8B95A1' },
  cancelled: { bg: '#FFF0F1', fg: '#F04452' },
  pending: { bg: '#FFF8E6', fg: '#B6762B' },
}

export const PAYMENT_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  paid: { bg: '#E6F7F0', fg: '#00B493' },
  partial: { bg: '#FFF8E6', fg: '#B6762B' },
  unpaid: { bg: '#FFF0F1', fg: '#F04452' },
}

export const VACANCY_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  occupied: { bg: '#E8F3FF', fg: '#3182F6' },
  vacating_soon: { bg: '#FFF8E6', fg: '#B6762B' },
  vacant: { bg: '#FFF0F1', fg: '#F04452' },
}

// 역매핑 (한국어 → 영문). 외부에서 한국어 body로 들어오는 경우 방어용.
export const TENANT_STATUS_REVERSE: Record<string, string> = {
  '입주중': 'active',
  '퇴실완료': 'moved_out',
  '계약취소': 'cancelled',
  '대기': 'pending',
  '공실': 'moved_out',
  '공실예정': 'active',
  '퇴실예정': 'active',
  '퇴실확정': 'active',
}

export const PAYMENT_STATUS_REVERSE: Record<string, string> = {
  '납부완료': 'paid',
  '부분납부': 'partial',
  '미납': 'unpaid',
}

export const VACANCY_STATUS_REVERSE: Record<string, string> = {
  '입주중': 'occupied',
  '공실': 'vacant',
  '퇴실예정': 'vacating_soon',
  '공실예정': 'vacating_soon',
  '현재공실': 'vacant',
  '진행중': 'vacating_soon',
  '완료': 'occupied',
}

// 헬퍼 함수
export function getTenantLabel(status: string | null | undefined): string {
  if (!status) return '대기'
  return TENANT_STATUS_LABEL[status] || status
}
export function getPaymentLabel(status: string | null | undefined): string {
  if (!status) return '미납'
  return PAYMENT_STATUS_LABEL[status] || status
}
export function getVacancyLabel(status: string | null | undefined): string {
  if (!status) return '공실'
  return VACANCY_STATUS_LABEL[status] || status
}
export function getIssueLabel(status: string | null | undefined): string {
  if (!status) return '접수'
  return ISSUE_STATUS_LABEL[status] || status
}
