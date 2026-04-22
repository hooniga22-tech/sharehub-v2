import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

function sbToCheckout(r: any, i: number) {
  const meta = r.memo ? (() => { try { return JSON.parse(r.memo) } catch { return {} } })() : {}
  return {
    _rowIndex: i, id: r.id || '', name: r.tenant_name || '', phone: r.phone || '',
    houseName: '', roomCode: '', checkoutDate: r.checkout_date || '',
    refundAccount: '', reason: '', memo: '',
    status: r.status || '신청접수', createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
    퇴실비: meta.퇴실비 || '', 미납월세: meta.미납월세 || '', 미납관리비: meta.미납관리비 || '',
    추가공제금액: meta.추가공제금액 || '', 추가공제사유: meta.추가공제사유 || '',
    월세완납확인: meta.월세완납확인 || '', 관리비완납확인: meta.관리비완납확인 || '',
    청소완료확인: meta.청소완료확인 || '', 정산확정여부: meta.정산확정여부 || '',
    정산확정일: meta.정산확정일 || '', 최종반환금액: String(r.deposit_refund || meta.최종반환금액 || ''),
    입주자ID: '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const tenantId = searchParams.get('tenantId')
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('checkout_applications').select('*'))
    const list = rows.map((r, i) => sbToCheckout(r, i))
    if (id) {
      const item = list.find(x => x.id === id)
      if (!item) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(item)
    }
    if (tenantId) {
      const item = list.find(x => x.입주자ID === tenantId)
      return NextResponse.json(item || null)
    }
    return NextResponse.json(list)
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const supabase = createAdminClient()
    const id = `checkout_${Date.now()}`
    const { error } = await supabase.from('checkout_applications').insert({
      id, tenant_name: b.name || '', phone: b.phone || '',
      checkout_date: b.checkoutDate || null,
      deposit_refund: Number(b.최종반환금액) || null,
      status: '신청접수', memo: '',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json()
    const supabase = createAdminClient()
    const update: Record<string, any> = {}
    if (b.상태 !== undefined) update.status = b.상태
    if (b.최종반환금액 !== undefined) update.deposit_refund = Number(b.최종반환금액) || null
    // 정산 필드를 memo JSON으로 저장
    const metaFields = ['퇴실비', '미납월세', '미납관리비', '추가공제금액', '추가공제사유', '월세완납확인', '관리비완납확인', '청소완료확인', '정산확정여부', '정산확정일']
    const meta: Record<string, any> = {}
    let hasMeta = false
    for (const f of metaFields) {
      if (b[f] !== undefined) { meta[f] = b[f]; hasMeta = true }
    }
    if (hasMeta) {
      // 기존 memo에서 기존 meta 읽어서 병합
      const { data: existing } = await supabase.from('checkout_applications').select('memo').eq('id', b.id).single()
      let existingMeta: Record<string, any> = {}
      if (existing?.memo) { try { existingMeta = JSON.parse(existing.memo) } catch {} }
      update.memo = JSON.stringify({ ...existingMeta, ...meta })
    }
    const { error } = await supabase.from('checkout_applications').update(update).eq('id', b.id)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
