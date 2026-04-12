import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 여러 시트 조합: 입주자 + 공과금 + 운영지출 + 용역 + 투자자

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)
    const houseFilter = searchParams.get('house')
    const monthPad = String(month).padStart(2, '0')
    const prefix = `${year}-${monthPad}`

    const [tenantRows, utilRows, opexRows, workerRows, investorRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('공과금'),
      getSheetData('운영지출'),
      getSheetData('용역'),
      getSheetData('투자자'),
    ])

    // 입주자: [0]ID [1]구 [2]지점명 [5]이름 [3]방코드 [8]상태 [10]월세 [11]관리비
    const tenants = tenantRows.filter(r => r[8] === '입주중' || r[8] === '계약중')

    // 공과금: [0]ID [1]지점명 [2]연도 [3]월 [4]전기 [5]가스 [6]수도 [7]인터넷 [8]정수기
    const utilities = utilRows.filter(r => r[2] === year && r[3] === month)

    // 운영지출: [0]ID [1]지점명 [2]날짜 [3]카테고리 [4]금액 [5]내용 [6]담당자
    const opex = opexRows.filter(r => (r[2] || '').startsWith(prefix))

    // 용역: [0]ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [7]완료여부
    const workers = workerRows.filter(r => (r[1] || '').startsWith(prefix) && r[7] === 'Y')

    // 투자자: [0]ID [1]투자자명 [2]연락처 [3]지점명 [4]배분비율 [5]링크토큰
    const houseNames = [...new Set(tenants.map(r => r[2]))].filter(Boolean)

    const houses = houseNames.map((houseName, idx) => {
      const ht = tenants.filter(r => r[2] === houseName)
      const rentTotal = ht.reduce((a, r) => a + (Number(r[10]) || 0), 0)
      const mgmtTotal = ht.reduce((a, r) => a + (Number(r[11]) || 0), 0)
      const revenue = rentTotal + mgmtTotal

      const util = utilities.find(r => r[1] === houseName)
      const utilTotal = util ? [4, 5, 6, 7, 8].reduce((a, i) => a + (Number(util[i]) || 0), 0) : 0
      const workerTotal = workers.filter(r => r[2] === houseName).reduce((a, r) => a + (Number(r[5]) || 0), 0)
      const opexTotal = opex.filter(r => r[1] === houseName).reduce((a, r) => a + (Number(r[4]) || 0), 0)
      const expense = utilTotal + workerTotal + opexTotal
      const profit = revenue - expense

      const inv = investorRows.find(r => r[3] === houseName)
      const invRatio = inv ? (Number(inv[4]) || 0) / 100 : 0
      const invShare = inv ? Math.round(profit * invRatio) : 0

      return {
        id: idx + 1, house: houseName, gu: ht[0]?.[1] || '',
        tenantCount: ht.length, revenue, rentTotal, mgmtTotal,
        expense, utilTotal, workerTotal, opexTotal, profit,
        ownShare: profit - invShare,
        investor: inv ? { name: inv[1], token: inv[5], ratio: invRatio, share: invShare } : null,
        tenants: ht.map(r => ({ 방코드: r[3], 이름: r[5], 월세: r[10], 관리비: r[11] })),
        utilDetail: util ? { 전기: util[4], 수도: util[6], 가스: util[5], 인터넷: util[7], 정수기: util[8] } : null,
        workerDetail: workers.filter(r => r[2] === houseName).map(r => ({ 담당자명: r[3], 작업종류: r[4], 정산금액: r[5], 예정일: r[1] })),
        opexDetail: opex.filter(r => r[1] === houseName).map(r => ({ 카테고리: r[3], 금액: r[4], 내용: r[5], 날짜: r[2] })),
      }
    })

    const result = houseFilter ? houses.filter(h => h.house === houseFilter) : houses
    return NextResponse.json({ year, month, houses: result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
