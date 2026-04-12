import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

// 지점 시트 (13열): [0]지점ID [1]지점명 [2]구 [3]주소 [4]현관비번 [5]와이파이SSID [6]와이파이PW
// [7]집월세 [8]투자자토큰 [9]총방수 [10]건물주명 [11]건물주연락처 [12]메모

function rowToHouse(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    지점ID: r[0] || '', 지점명: r[1] || '', 구: r[2] || '', 주소: r[3] || '',
    현관비번: r[4] || '', 와이파이SSID: r[5] || '', 와이파이PW: r[6] || '',
    집월세: r[7] || '', 투자자토큰: r[8] || '', 총방수: r[9] || '',
    건물주명: r[10] || '', 건물주연락처: r[11] || '', 메모: r[12] || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const gu = searchParams.get('gu')

    const rows = await getSheetData('지점')
    let houses = rows.map((r, i) => rowToHouse(r, i))

    if (id) {
      const found = houses.find(h => h.지점ID === id)
      if (!found) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(found)
    }
    if (gu) houses = houses.filter(h => h.구 === gu)

    return NextResponse.json(houses)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const rows = await getSheetData('지점')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    await updateRow('지점', rowIndex, [
      e[0], data.지점명 ?? e[1], data.구 ?? e[2], data.주소 ?? e[3],
      data.현관비번 ?? e[4], data.와이파이SSID ?? e[5], data.와이파이PW ?? e[6],
      data.집월세 ?? (e[7] || ''), data.투자자토큰 ?? (e[8] || ''), data.총방수 ?? (e[9] || ''),
      data.건물주명 ?? (e[10] || ''), data.건물주연락처 ?? (e[11] || ''), data.메모 ?? (e[12] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
