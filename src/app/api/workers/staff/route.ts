import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, appendRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// 용역담당자 -> Supabase workers 테이블
function workerToStaff(w: any, idx: number) {
  return {
    _rowIndex: idx,
    담당자ID: w.id || '',
    이름: w.name || '',
    연락처: w.phone || '',
    계좌번호: '', // account_info에 통합됨
    은행명: '',
    예금주: '',
    분야: w.category || '',
    상태: w.is_active ? '활동중' : '만료',
    구분: '',
    링크토큰: w.access_token || '',
    기본금액: w.default_rate != null ? String(w.default_rate) : '',
    활동시작일: '',
    메모: w.memo || '',
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('workers').select('*').order('name'))
    return NextResponse.json(rows.map((r, i) => workerToStaff(r, i)))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST는 Step 4.4에서 전환 예정 - Sheets 유지
const SHEET = '용역담당자'
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
    set('담당자ID', id); set('이름', body.이름 || ''); set('연락처', body.연락처 || '')
    set('계좌번호', body.계좌번호 || ''); set('은행명', body.은행명 || ''); set('예금주', body.예금주 || '')
    set('분야', body.분야 || ''); set('상태', body.상태 || '활동중'); set('링크토큰', token)
    set('기본금액', body.기본금액 || ''); set('활동시작일', body.활동시작일 || ''); set('메모', body.메모 || '')
    await appendRow(SHEET, row)
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
