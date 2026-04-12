import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const { year, month } = await req.json()

    // 입주중인 입주자 조회 (인덱스: [0]ID [5]이름 [2]지점명 [3]방코드 [8]상태 [10]월세 [11]관리비)
    const tenantRows = await getSheetData('입주자')
    const activeTenants = tenantRows.filter(r => r[8] === '입주중' || r[8] === '계약중')

    // 이미 생성된 수납 내역 조회
    const payRows = await getSheetData('수납')
    const existingIds = payRows
      .filter(r => r[5] === String(year) && r[6] === String(month))
      .map(r => r[1]) // 입주자ID

    let created = 0
    for (const t of activeTenants) {
      if (existingIds.includes(t[0])) continue

      const row = [
        `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        t[0],           // 입주자ID
        t[2],           // 지점명
        t[3],           // 방코드
        t[5],           // 이름
        String(year),
        String(month),
        t[10] || '',    // 월세
        t[11] || '',    // 관리비
        '미납',
        '',
        '',
        '',
      ]
      await appendRow('수납', row)
      created++
      await new Promise(r => setTimeout(r, 150))
    }

    return NextResponse.json({ success: true, created })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
