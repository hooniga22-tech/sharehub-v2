import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, appendRow } from '@/lib/sheets'

// 용역담당자 시트는 헤더명 기반으로 파싱 (컬럼 순서 변경에 안전)
const SHEET = '용역담당자'

export async function GET() {
  try {
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const get = (r: string[], name: string) => {
      const i = colIdx(headers, name)
      return i >= 0 ? (r[i] || '') : ''
    }
    const staff = rows.map((r, i) => ({
      _rowIndex: i,
      담당자ID: get(r, '담당자ID'),
      이름: get(r, '이름'),
      연락처: get(r, '연락처'),
      계좌번호: get(r, '계좌번호'),
      은행명: get(r, '은행명'),
      예금주: get(r, '예금주'),
      분야: get(r, '분야'),
      상태: get(r, '상태'),
      구분: get(r, '구분'),
      링크토큰: get(r, '링크토큰'),
      기본금액: get(r, '기본금액'),
      활동시작일: get(r, '활동시작일'),
      메모: get(r, '메모'),
    }))
    return NextResponse.json(staff)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `staff_${Date.now()}`
    const token = `w_${Math.random().toString(36).slice(2, 10)}`
    const { headers } = await getSheetWithHeaders(SHEET)
    const row = new Array(headers.length).fill('') as string[]
    const set = (name: string, v: string) => {
      const i = colIdx(headers, name)
      if (i >= 0) row[i] = v
    }
    set('담당자ID', id)
    set('이름', body.이름 || '')
    set('연락처', body.연락처 || '')
    set('계좌번호', body.계좌번호 || '')
    set('은행명', body.은행명 || '')
    set('예금주', body.예금주 || '')
    set('분야', body.분야 || '')
    set('상태', body.상태 || '활동중')
    set('링크토큰', token)
    set('기본금액', body.기본금액 || '')
    set('활동시작일', body.활동시작일 || '')
    set('메모', body.메모 || '')
    await appendRow(SHEET, row)
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
