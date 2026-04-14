import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 투자자 탭: [0]투자자ID [1]투자자명 [2]연락처 [3]계좌정보 [4]생년월일 [5]링크토큰 [6]메모
// 투자지점 탭: [0]투자ID [1]투자자ID [2]투자자명 [3]지점명 [4]투자자비율 [5]유재훈비율 [6]공동여부 [7]메모
// 입주자 탭: [0]입주자ID [1]구 [2]지점명 ... [8]상태 [10]월세 [11]관리비

const normalize = (name: string) => name.replace(/하우스$/, '').trim().toLowerCase()

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const [investorRows, houseRows, tenantRows] = await Promise.all([
      getSheetData('투자자'),
      getSheetData('투자지점'),
      getSheetData('입주자'),
    ])

    // 토큰으로 투자자 찾기
    const investorRow = investorRows.find(r => r[5] === token)
    if (!investorRow) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    const investorId = investorRow[0]
    const investorName = investorRow[1] || ''
    const phone = investorRow[2] || ''
    const account = investorRow[3] || ''

    // 해당 투자자의 투자지점 목록
    const myHouses = houseRows
      .filter(r => r[1] === investorId)
      .map(r => ({
        investId: r[0] || '',
        houseName: r[3] || '',
        investorRatio: Number(r[4]) || 0,
        jaehoonRatio: Number(r[5]) || 0,
        isJoint: r[6] === 'Y',
      }))

    // 활성 입주자 (입주중/계약중)의 월세+관리비 by 정규화된 지점명
    const activeTenants = tenantRows.filter(r => r[8] === '입주중' || r[8] === '계약중')
    const revenueByHouse = new Map<string, number>()
    for (const t of activeTenants) {
      const house = normalize(t[2] || '')
      const rent = (Number(t[10]) || 0) + (Number(t[11]) || 0)
      revenueByHouse.set(house, (revenueByHouse.get(house) || 0) + rent)
    }

    // 지점별 정산 계산
    const houses = myHouses.map(h => {
      const revenue = revenueByHouse.get(normalize(h.houseName)) || 0
      const share = Math.round(revenue * (h.investorRatio / 100))
      return { ...h, revenue, share }
    })

    const totalShare = houses.reduce((s, h) => s + (h.share || 0), 0)
    const totalRevenue = houses.reduce((s, h) => s + (h.revenue || 0), 0)

    return NextResponse.json({
      investor: { id: investorId, name: investorName, phone, account },
      houses,
      totalShare,
      totalRevenue,
      houseCount: houses.length,
      year,
      month,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
