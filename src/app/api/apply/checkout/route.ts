import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

function sbToCheckout(r: any, i: number) {
  return {
    _rowIndex: i, id: r.id || '', name: r.tenant_name || '', phone: r.phone || '',
    houseName: '', roomCode: '', checkoutDate: r.checkout_date || '',
    refundAccount: '', reason: '', memo: r.memo || '',
    status: r.status || '신청접수', createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
    퇴실비: '', 미납월세: '', 미납관리비: '', 추가공제금액: '', 추가공제사유: '',
    월세완납확인: '', 관리비완납확인: '', 청소완료확인: '',
    정산확정여부: '', 정산확정일: '', 최종반환금액: String(r.deposit_refund || ''),
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

// POST/PUT는 Step 4.5에서 전환 - Sheets 유지
export async function POST(req: Request) {
  try {
    const b = await req.json()
    const id = `checkout_${Date.now()}`
    const row = new Array(23).fill('')
    row[0] = id; row[1] = b.name; row[2] = b.phone; row[3] = b.houseName;
    row[4] = b.roomCode; row[5] = b.checkoutDate; row[6] = b.refundAccount;
    row[7] = b.reason || '계약만료'; row[8] = b.memo || ''; row[9] = '신청접수';
    row[10] = new Date().toISOString().split('T')[0]; row[22] = b.tenantId || '';
    await appendRow('퇴실신청', row)
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json()
    const rows = await getSheetData('퇴실신청')
    const idx = rows.findIndex(r => r[0] === b.id)
    if (idx === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[idx]
    const updated = new Array(23).fill('')
    for (let i = 0; i < 23; i++) updated[i] = e[i] || ''
    if (b.퇴실비 !== undefined) updated[11] = String(b.퇴실비)
    if (b.미납월세 !== undefined) updated[12] = String(b.미납월세)
    if (b.미납관리비 !== undefined) updated[13] = String(b.미납관리비)
    if (b.추가공제금액 !== undefined) updated[14] = String(b.추가공제금액)
    if (b.추가공제사유 !== undefined) updated[15] = b.추가공제사유
    if (b.월세완납확인 !== undefined) updated[16] = b.월세완납확인
    if (b.관리비완납확인 !== undefined) updated[17] = b.관리비완납확인
    if (b.청소완료확인 !== undefined) updated[18] = b.청소완료확인
    if (b.정산확정여부 !== undefined) updated[19] = b.정산확정여부
    if (b.정산확정일 !== undefined) updated[20] = b.정산확정일
    if (b.최종반환금액 !== undefined) updated[21] = String(b.최종반환금액)
    if (b.상태 !== undefined) updated[9] = b.상태
    await updateRow('퇴실신청', idx, updated)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
