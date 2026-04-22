import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, title, content, category } = body
    const supabase = createAdminClient()

    // 토큰으로 입주자 찾기
    const { data: tenant, error } = await supabase
      .from('tenants').select('id, name, branch_id, branches(name), rooms(room_code)')
      .eq('link_token', token).limit(1).single()
    if (error || !tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const id = `issue_${Date.now()}`
    await supabase.from('issues').insert({
      id, branch_id: tenant.branch_id, title: title || '',
      description: content || '', category: category || '민원',
      status: 'pending', memo: `입주자 신청: ${tenant.name}`,
    })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
