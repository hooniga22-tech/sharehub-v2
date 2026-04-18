import type { Worker, WorkerField, WorkerStatus } from '@/types/worker'

// 용역담당자 시트 컬럼 (13):
// [0]담당자ID [1]이름 [2]분야 [3]상태 [4]연락처
// [5]은행명 [6]계좌번호 [7]예금주 [8]주민번호앞6
// [9]기본금액 [10]링크토큰 [11]활동시작일 [12]메모

export const STAFF_TAB = '용역담당자'
export const WORK_TAB = '용역'

export function rowToWorker(r: string[]): Worker {
  const fld = ((r[2] as string) || '').trim()
  const st = ((r[3] as string) || '').trim()
  return {
    id: r[0] || '',
    name: r[1] || '',
    field: (fld === '수리' ? '수리' : '청소') as WorkerField,
    status: (st === '만료' ? '만료' : '활동중') as WorkerStatus,
    phone: r[4] || '',
    bankName: r[5] || '',
    accountNumber: r[6] || '',
    holder: r[7] || '',
    rrnHead: r[8] || '',
    baseAmount: Number(r[9]) || 0,
    token: r[10] || '',
    startDate: r[11] || '',
    memo: r[12] || '',
  }
}

export function workerToRow(w: Worker): string[] {
  return [
    w.id,
    w.name,
    w.field,
    w.status,
    w.phone,
    w.bankName,
    w.accountNumber,
    w.holder,
    w.rrnHead,
    String(w.baseAmount || 0),
    w.token,
    w.startDate,
    w.memo,
  ]
}

// KST 기준 현재 YYYY-MM
export function kstYearMonth(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
}

// 용역 시트에서 담당자명 별 이번달 건수·합계 집계
export function aggregateMonthlyStats(
  workRows: string[][],
  ymPrefix: string,
): Map<string, { count: number; total: number }> {
  const map = new Map<string, { count: number; total: number }>()
  for (const r of workRows) {
    const 예정일 = ((r[1] as string) || '').trim()
    if (!예정일.startsWith(ymPrefix)) continue
    const 담당자명 = ((r[3] as string) || '').trim()
    if (!담당자명) continue
    const amount = Number(r[5]) || 0
    const cur = map.get(담당자명) || { count: 0, total: 0 }
    cur.count++
    cur.total += amount
    map.set(담당자명, cur)
  }
  return map
}

// 정렬: 분야(청소 → 수리) → 이름 가나다
const FIELD_ORDER: Record<WorkerField, number> = { '청소': 0, '수리': 1 }
export function sortWorkers<T extends { field: WorkerField; name: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const f = (FIELD_ORDER[a.field] ?? 99) - (FIELD_ORDER[b.field] ?? 99)
    if (f !== 0) return f
    return a.name.localeCompare(b.name, 'ko')
  })
}

// staff_<ms> 신규 ID 생성 (기존 집합과 충돌 방지)
export function makeStaffId(existingIds: Set<string>): string {
  let ts = Date.now()
  for (let i = 0; i < 1000; i++) {
    const id = `staff_${ts + i}`
    if (!existingIds.has(id)) return id
  }
  throw new Error('담당자ID 생성 실패')
}

// w_<8자> 랜덤 토큰 생성 (기존 집합과 충돌 방지)
export function makeToken(existingTokens: Set<string>): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let attempt = 0; attempt < 500; attempt++) {
    let t = 'w_'
    for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)]
    if (!existingTokens.has(t)) return t
  }
  throw new Error('링크토큰 생성 실패')
}

// PATCH 입력에 대해 기존 Worker 위에 화이트리스트 필드만 덮어쓰기
const PATCH_ALLOWED = new Set<keyof Worker>([
  'name', 'field', 'status', 'phone', 'bankName', 'accountNumber',
  'holder', 'rrnHead', 'baseAmount', 'startDate', 'memo',
])

export function mergePatch(base: Worker, patch: Partial<Worker>): Worker {
  const out: Worker = { ...base }
  for (const key of Object.keys(patch) as (keyof Worker)[]) {
    if (!PATCH_ALLOWED.has(key)) continue
    const v = patch[key]
    if (v === undefined) continue
    ;(out as any)[key] = v
  }
  // 타입 가드
  if (out.field !== '청소' && out.field !== '수리') out.field = '청소'
  if (out.status !== '활동중' && out.status !== '만료') out.status = '활동중'
  out.baseAmount = Number(out.baseAmount) || 0
  return out
}
