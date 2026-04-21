// ─── Supabase Query Helpers - Step 4.0 ───
// Supabase 쿼리의 { data, error } 보일러플레이트를 줄이기 위한 공용 헬퍼.
// Step 4.1~4.5에서 API 라우트를 Sheets -> Supabase로 교체할 때 사용.

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 단건 조회/쓰기용. 에러 시 throw, null data 시 throw.
 * @example const branch = await getOrThrow<Branch>(supabase.from('branches').select('*').eq('id', id).single())
 */
export async function getOrThrow<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await query
  if (error) throw new Error(`[Supabase] ${error.message}`)
  if (data === null || data === undefined) throw new Error('[Supabase] No data returned')
  return data
}

/**
 * 리스트 조회용. 에러 시 console.error + 빈 배열 반환 (앱이 빈 화면 대신 빈 리스트로 동작).
 * @example const rooms = await listOrEmpty<Room>(supabase.from('rooms').select('*').eq('branch_id', id))
 */
export async function listOrEmpty<T>(
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await query
  if (error) {
    console.error('[Supabase] listOrEmpty error:', error.message)
    return []
  }
  return data ?? []
}

/**
 * upsert 후 단건 반환. 내부에서 getOrThrow 호출.
 * @example const tenant = await upsertOne<Tenant>(supabase, 'tenants', { id: 't_001', name: '홍길동' }, 'id')
 */
export async function upsertOne<T>(
  supabase: SupabaseClient,
  table: string,
  row: Partial<T>,
  conflictColumn?: string,
): Promise<T> {
  const q = supabase
    .from(table)
    .upsert(row as any, conflictColumn ? { onConflict: conflictColumn } : undefined)
    .select()
    .single()
  return getOrThrow<T>(q)
}

/**
 * 조건부 필터 적용. undefined/null인 값은 건너뛰고, 나머지만 .eq() 체이닝.
 * @example const q = withFilter(supabase.from('rooms').select('*'), { branch_id: branchId, room_type: type })
 */
export function withFilter<Q>(query: Q, filters: Record<string, unknown>): Q {
  let q: any = query
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      q = q.eq(key, value)
    }
  }
  return q as Q
}
