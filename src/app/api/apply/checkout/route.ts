import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 퇴실신청 컬럼:
// [0]신청ID [1]이름 [2]연락처 [3]지점명 [4]방코드 [5]퇴실예정일
// [6]환불계좌 [7]퇴실사유 [8]메모 [9]상태 [10]신청일
// [11]퇴실비 [12]미납월세 [13]미납관리비 [14]추가공제금액 [15]추가공제사유
// [16]월세완납확인 [17]관리비완납확인 [18]청소완료확인
// [19]정산확정여부 [20]정산확정일 [21]최종반환금액 [22]입주자ID

function rowToObj(r: string[], i: number) {
  return {
    _rowIndex: i, id: r[0] || '', name: r[1] || '', phone: r[2] || '',
    houseName: r[3] || '', roomCode: r[4] || '', checkoutDate: r[5] || '',
    refundAccount: r[6] || '', reason: r[7] || '', memo: r[8] || '',
    status: r[9] || '신청접수', createdAt: r[10] || '',
    퇴실비: r[11] || '', 미납월세: r[12] || '', 미납관리비: r[13] || '',
    추가공제금액: r[14] || '', 추가공제사유: r[15] || '',
    월세완납확인: r[16] || '', 관리비완납확인: r[17] || '', 청소완료확인: r[18] || '',
    정산확정여부: r[19] || '', 정산확정일: r[20] || '', 최종반환금액: r[21] || '',
    입주자ID: r[22] || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const tenantId = searchParams.get('tenantId')
    const rows = await getSheetData('퇴실신청')
    const list = rows.map((r, i) => rowToObj(r, i))

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
    const id = `checkout_${Date.now()}`
    const row = new Array(23).fill('')
    row[0] = id; row[1] = b.name; row[2] = b.phone; row[3] = b.houseName;
    row[4] = b.roomCode; row[5] = b.checkoutDate; row[6] = b.refundAccount;
    row[7] = b.reason || '계약만료'; row[8] = b.memo || ''; row[9] = '신청접수';
    row[10] = new Date().toISOString().split('T')[0];
    row[22] = b.tenantId || '';
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
    // 정산 필드 업데이트
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
