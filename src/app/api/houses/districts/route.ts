import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

// 지점 테이블에서 '구(district)' 컬럼의 unique 값 목록 반환 (가나다 정렬).
export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('branches').select('district'))
    const set = new Set<string>()
    for (const r of rows) {
      const v = (r.district || '').trim()
      if (v) set.add(v)
    }
    const list = [...set].sort((a, b) => a.localeCompare(b, 'ko'))
    return NextResponse.json(list)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
