import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 투자자 탭 (7열): [0]투자자ID [1]투자자명 [2]연락처 [3]계좌정보 [4]생년월일 [5]링크토큰 [6]메모
// 투자지점 탭 (8열): [0]투자ID [1]투자자ID [2]투자자명 [3]지점명 [4]투자자비율 [5]유재훈비율 [6]공동여부 [7]메모

type InvestorHouse = {
  investId: string
  houseName: string
  investorRatio: number
  jaehoonRatio: number
  isJoint: boolean
  memo: string
}

type InvestorResponse = {
  id: string
  name: string
  phone: string
  account: string
  birthday: string
  token: string
  memo: string
  houses: InvestorHouse[]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    const [investorRows, houseRows] = await Promise.all([
      getSheetData('투자자'),
      getSheetData('투자지점'),
    ])

    // Build investor map
    const investorMap = new Map<string, {
      id: string; name: string; phone: string; account: string; birthday: string; token: string; memo: string
    }>()
    for (const r of investorRows) {
      investorMap.set(r[0], {
        id: r[0] || '',
        name: r[1] || '',
        phone: r[2] || '',
        account: r[3] || '',
        birthday: r[4] || '',
        token: r[5] || '',
        memo: r[6] || '',
      })
    }

    // Build houses grouped by investor ID
    const housesById = new Map<string, InvestorHouse[]>()
    for (const r of houseRows) {
      const invId = r[1] || ''
      if (!invId) continue
      if (!housesById.has(invId)) housesById.set(invId, [])
      housesById.get(invId)!.push({
        investId: r[0] || '',
        houseName: r[3] || '',
        investorRatio: Number(r[4]) || 0,
        jaehoonRatio: Number(r[5]) || 0,
        isJoint: r[6] === 'Y',
        memo: r[7] || '',
      })
    }

    // Token query: single investor portal
    if (token) {
      const investor = [...investorMap.values()].find(i => i.token === token)
      if (!investor) return NextResponse.json({ error: '없음' }, { status: 404 })

      const houses = housesById.get(investor.id) || []
      return NextResponse.json({ investor, houses })
    }

    // Admin list: all investors with their houses
    const investors: InvestorResponse[] = []
    for (const inv of investorMap.values()) {
      investors.push({
        ...inv,
        houses: housesById.get(inv.id) || [],
      })
    }

    return NextResponse.json(investors)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `inv_${Date.now()}`
    const token = `i_${Math.random().toString(36).slice(2, 10)}`
    await appendRow('투자자', [id, body.투자자명 || '', body.연락처 || '', body.계좌정보 || '', body.생년월일 || '', token, body.메모 || ''])
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('투자자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[rowIndex]
    await updateRow('투자자', rowIndex, [
      e[0], data.투자자명 ?? e[1], data.연락처 ?? e[2], data.계좌정보 ?? e[3],
      data.생년월일 ?? e[4], e[5], data.메모 ?? (e[6] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
