import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 입주자 시트 컬럼 인덱스 (20열)
// [0]입주자ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름
// [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비
// [12]메모 [13]연락처 [14]생년월일 [15]주소
// [16]투자자 [17]투자자계좌 [18]투자자연락처 [19]링크토큰

function rowToTenant(r: string[], rowIndex: number) {
  return {
    _rowIndex: rowIndex,
    입주자ID: r[0] || '',
    구: r[1] || '',
    지점명: r[2] || '',
    방코드: r[3] || '',
    방타입: r[4] || '',
    이름: r[5] || '',
    입주일: r[6] || '',
    퇴실일: r[7] || '',
    상태: r[8] || '',
    보증금: r[9] || '',
    월세: r[10] || '',
    관리비: r[11] || '',
    메모: r[12] || '',
    연락처: r[13] || '',
    생년월일: r[14] || '',
    주소: r[15] || '',
    투자자: r[16] || '',
    투자자계좌: r[17] || '',
    투자자연락처: r[18] || '',
    링크토큰: r[19] || '',
  }
}

// GET /api/tenants — 전체 목록
// GET /api/tenants?id=xxx — 특정 입주자
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    const rows = await getSheetData('입주자') // 헤더 제외된 데이터
    const tenants = rows.map((r, i) => rowToTenant(r, i))

    if (id) {
      const tenant = tenants.find(t => t.입주자ID === id)
      if (!tenant) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(tenant)
    }

    if (token) {
      const tenant = tenants.find(t => t.링크토큰 === token)
      if (!tenant) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(tenant)
    }

    return NextResponse.json(tenants)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/tenants — 새 입주자 추가
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tenant_${Date.now()}`

    const row = [
      id,
      body.구 || '',
      body.지점명 || '',
      body.방코드 || '',
      body.방타입 || '',
      body.이름 || '',
      body.입주일 || '',
      body.퇴실일 || '',
      body.상태 || '입주중',
      body.보증금 || '',
      body.월세 || '',
      body.관리비 || '',
      body.메모 || '',
      body.연락처 || '',
      body.생년월일 || '',
      body.주소 || '',
      body.투자자 || '',
      body.투자자계좌 || '',
      body.투자자연락처 || '',
    ]

    await appendRow('입주자', row)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT /api/tenants — 입주자 수정
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const rows = await getSheetData('입주자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const updated = [
      e[0],                       // 입주자ID
      data.구 ?? e[1],
      data.지점명 ?? e[2],
      data.방코드 ?? e[3],
      data.방타입 ?? e[4],
      data.이름 ?? e[5],
      data.입주일 ?? e[6],
      data.퇴실일 ?? e[7],
      data.상태 ?? e[8],
      data.보증금 ?? e[9],
      data.월세 ?? e[10],
      data.관리비 ?? e[11],
      data.메모 ?? e[12],
      data.연락처 ?? e[13],
      data.생년월일 ?? (e[14] || ''),
      data.주소 ?? (e[15] || ''),
      data.투자자 ?? (e[16] || ''),
      data.투자자계좌 ?? (e[17] || ''),
      data.투자자연락처 ?? (e[18] || ''),
    ]

    await updateRow('입주자', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
