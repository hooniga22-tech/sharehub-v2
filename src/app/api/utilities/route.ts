import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 공과금 탭: [0]ID [1]지점명 [2]연도 [3]월 [4]전기 [5]가스 [6]수도 [7]인터넷 [8]정수기 [9]메모 [10]청소 [11]기타 [12]합계메모 [13]입력일
// 지점 탭: [0]지점ID [1]구 [2]지점명 ...

const normalize = (name: string) => name.replace(/하우스$/, '').trim().toLowerCase()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || String(new Date().getMonth() + 1)

    const [utilRows, houseInfoRows] = await Promise.all([
      getSheetData('공과금'),
      getSheetData('지점'),
    ])

    // 해당 연도+월 데이터만 필터
    const monthData = utilRows.filter(r => r[2] === year && r[3] === month)
    const dataByHouse = new Map<string, typeof monthData[0]>()
    for (const r of monthData) {
      dataByHouse.set(normalize(r[1] || ''), r)
    }

    // 구별 지점 그룹
    const districtMap = new Map<string, { houseName: string; district: string }[]>()
    for (const r of houseInfoRows) {
      const district = r[1] || '기타'
      const houseName = r[2] || ''
      if (!houseName) continue
      if (!districtMap.has(district)) districtMap.set(district, [])
      districtMap.get(district)!.push({ houseName, district })
    }

    let totalAmount = 0
    let completedCount = 0
    let missingCount = 0

    const districts = [...districtMap.entries()].map(([name, houseList]) => {
      let distTotal = 0
      let distCompleted = 0
      let distMissing = 0

      const houses = houseList.map(({ houseName }) => {
        const row = dataByHouse.get(normalize(houseName))
        if (!row) {
          distMissing++
          return { houseName, hasData: false as const }
        }
        const 전기 = Number(row[4]) || 0
        const 가스 = Number(row[5]) || 0
        const 수도 = Number(row[6]) || 0
        const 인터넷 = Number(row[7]) || 0
        const 정수기 = Number(row[8]) || 0
        const 기타 = Number(row[11]) || 0
        const total = 전기 + 가스 + 수도 + 인터넷 + 정수기 + 기타
        distTotal += total
        distCompleted++
        return { houseName, hasData: true as const, 전기, 가스, 수도, 인터넷, 정수기, 기타, total }
      })

      totalAmount += distTotal
      completedCount += distCompleted
      missingCount += distMissing

      return {
        name,
        houses,
        totalAmount: distTotal,
        completedCount: distCompleted,
        missingCount: distMissing,
      }
    })

    return NextResponse.json({
      districts,
      summary: { totalAmount, completedCount, missingCount },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { houseName, year, month, 전기, 가스, 수도, 인터넷, 정수기, 기타 } = body
    if (!houseName || !year || !month) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const id = `util_${houseName}_${year}${String(month).padStart(2, '0')}`
    const now = new Date().toISOString().slice(0, 10)
    const row = [id, houseName, String(year), String(month), 전기 ?? 0, 가스 ?? 0, 수도 ?? 0, 인터넷 ?? 0, 정수기 ?? 0, '', 0, 기타 ?? 0, '', now]

    const existingRows = await getSheetData('공과금')
    const existingIdx = existingRows.findIndex(r => r[0] === id)

    if (existingIdx >= 0) {
      await updateRow('공과금', existingIdx, row)
    } else {
      await appendRow('공과금', row)
    }

    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
