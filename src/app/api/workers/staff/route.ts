import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

// 용역담당자 -> Supabase workers 테이블
function workerToStaff(w: any, idx: number) {
  return {
    _rowIndex: idx,
    담당자ID: w.id || '',
    이름: w.name || '',
    연락처: w.phone || '',
    계좌번호: '', // account_info에 통합됨
    은행명: '',
    예금주: '',
    분야: w.category || '',
    상태: w.is_active ? '활동중' : '만료',
    구분: '',
    링크토큰: w.access_token || '',
    기본금액: w.default_rate != null ? String(w.default_rate) : '',
    활동시작일: '',
    메모: w.memo || '',
  }
}

export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('workers').select('*').order('name'))
    return NextResponse.json(rows.map((r, i) => workerToStaff(r, i)))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `staff_${Date.now()}`
    const token = `w_${Math.random().toString(36).slice(2, 10)}`
    const { error } = await supabase.from('workers').insert({
      id, name: body.이름 || '', phone: body.연락처 || '',
      category: body.분야 || '', is_active: (body.상태 || '활동중') !== '만료',
      default_rate: Number(body.기본금액) || null, access_token: token, memo: body.메모 || '',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
