import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

// 입주자 시트 컬럼
// [0]입주자ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름
// [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비
// [12]메모 [13]연락처 [14]생년월일 [15]주소
// [16]투자자 [17]투자자계좌 [18]투자자연락처 [19]링크토큰
// [20]플랫폼 [21]이체계좌

// 수납 시트 컬럼
// [0]수납ID [1]입주자ID [2]지점명 [3]방코드 [4]이름
// [5]연월 [6]청구액 [7]납부액 [8]납부일 [9]상태 [10]납부방법 [11]메모
// [12]이체완료

function kstMonth(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
}

type PlatformTenant = {
  tenantId: string
  name: string
  house: string
  room: string
  rent: number
  paymentId: string
  paid: number
  transferred: boolean
  status: string
}

type PlatformGroup = {
  account: string
  tenants: PlatformTenant[]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || kstMonth()

    const [tenantRows, paymentRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('수납'),
    ])

    // 플랫폼 입주자만 필터 (col 20)
    const platformTenants = tenantRows.filter(r => (r[20] || '').trim())

    // 수납 데이터를 입주자ID+연월로 인덱싱
    const paymentMap = new Map<string, { row: string[]; index: number }>()
    paymentRows.forEach((r, i) => {
      const key = `${r[1]}__${r[5]}`
      paymentMap.set(key, { row: r, index: i })
    })

    // 플랫폼별 그룹핑
    const platforms: Record<string, PlatformGroup> = {}

    for (const t of platformTenants) {
      const platform = (t[20] || '').trim()
      const account = (t[21] || '').trim()
      const tenantId = t[0] || ''

      if (!platforms[platform]) {
        platforms[platform] = { account, tenants: [] }
      }
      if (account && !platforms[platform].account) {
        platforms[platform].account = account
      }

      const pKey = `${tenantId}__${month}`
      const payment = paymentMap.get(pKey)

      platforms[platform].tenants.push({
        tenantId,
        name: t[5] || '',
        house: t[2] || '',
        room: t[3] || '',
        rent: Number(t[10]) || 0,
        paymentId: payment?.row[0] || '',
        paid: Number(payment?.row[7]) || 0,
        transferred: (payment?.row[12] || '') === 'Y',
        status: payment?.row[9] || '미납',
      })
    }

    return NextResponse.json({ month, platforms })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { paymentId, transferred } = await req.json()
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    const rows = await getSheetData('수납')
    const idx = rows.findIndex(r => r[0] === paymentId)
    if (idx < 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const row = [...rows[idx]]
    // 컬럼 12 = 이체완료, 부족하면 패딩
    while (row.length < 13) row.push('')
    row[12] = transferred ? 'Y' : ''

    await updateRow('수납', idx, row)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
