import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

// 투자자 탭: [0]투자자ID [1]투자자명 [2]연락처 [3]계좌정보 [4]생년월일 [5]링크토큰 [6]메모
// 투자지점 탭: [0]투자ID [1]투자자ID [2]투자자명 [3]지점명 [4]투자자비율 [5]유재훈비율 [6]공동여부 [7]메모
// 입주자 탭: [0]ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름 [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비
// 지점 탭: [0]지점ID [1]지점명 [2]구 [3]주소 [4]현관비번 [5]와이파이SSID [6]와이파이PW [7]집월세 ...

const normalize = (name: string) => name.replace(/하우스$/, '').trim().toLowerCase()

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const [investorRows, houseRows, tenantRows, houseInfoRows] = await Promise.all([
      getSheetData('투자자'),
      getSheetData('투자지점'),
      getSheetData('입주자'),
      getSheetData('지점'),
    ])

    const investorRow = investorRows.find(r => r[5] === token)
    if (!investorRow) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    const investorId = investorRow[0]
    const investorName = investorRow[1] || ''
    const phone = investorRow[2] || ''
    const account = investorRow[3] || ''

    const myHouses = houseRows
      .filter(r => r[1] === investorId)
      .map(r => ({
        investId: r[0] || '',
        houseName: r[3] || '',
        investorRatio: Number(r[4]) || 0,
        jaehoonRatio: Number(r[5]) || 0,
        isJoint: r[6] === 'Y',
      }))

    // 지점별 집월세 맵 (지점 탭 [1]지점명 [7]집월세)
    const houseRentMap = new Map<string, number>()
    for (const r of houseInfoRows) {
      const key = normalize(r[1] || '')
      houseRentMap.set(key, Number(r[7]) || 0)
    }

    // 활성 입주자 by 정규화된 지점명
    const activeTenants = tenantRows.filter(r => r[8] === '입주중' || r[8] === '계약중')
    const tenantsByHouse = new Map<string, typeof activeTenants>()
    for (const t of activeTenants) {
      const key = normalize(t[2] || '')
      if (!tenantsByHouse.has(key)) tenantsByHouse.set(key, [])
      tenantsByHouse.get(key)!.push(t)
    }

    const houses = myHouses.map(h => {
      const key = normalize(h.houseName)
      const houseTenants = tenantsByHouse.get(key) || []
      const revenue = houseTenants.reduce((s, t) => s + (Number(t[10]) || 0) + (Number(t[11]) || 0), 0)
      const houseRent = houseRentMap.get(key) || 0
      const profit = revenue - houseRent
      const investorShare = Math.round(profit * (h.investorRatio / 100))
      const jaehoonShare = Math.round(profit * (h.jaehoonRatio / 100))

      const tenants = houseTenants.map(t => {
        const endRaw = t[7] || ''
        const endDate = endRaw ? endRaw.replace(/^\d{2}(\d{2})-(\d{2})-(\d{2})$/, '$1.$2.$3').replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `${y.slice(2)}.${m}.${d}`) : ''
        return {
          name: t[5] || '',
          roomCode: t[3] || '',
          roomType: t[4] || '',
          rent: (Number(t[10]) || 0) + (Number(t[11]) || 0),
          endDate,
        }
      })

      return {
        ...h,
        revenue,
        houseRent,
        profit,
        investorShare,
        jaehoonShare,
        tenants,
      }
    })

    const totalShare = houses.reduce((s, h) => s + (h.investorShare || 0), 0)
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
