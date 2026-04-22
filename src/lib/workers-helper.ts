import type { WorkerField } from '@/types/worker'

// KST 기준 현재 YYYY-MM
export function kstYearMonth(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
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
