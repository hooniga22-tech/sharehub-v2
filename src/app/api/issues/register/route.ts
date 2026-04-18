import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, appendRow } from '@/lib/sheets'

// Node.js 런타임 명시 (googleapis는 Edge 환경에서 동작 불가)
export const runtime = 'nodejs'

// 할일 시트로 통합 라우팅. 헤더명 기반.
const SHEET = '할일'

function todayKst(): Date {
  const d = new Date()
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
}

function ymdKst(): string {
  const d = todayKst()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ymdCompactKst(): string {
  return ymdKst().replace(/-/g, '')
}

// task_YYYYMMDD_NNN (같은 일자 연번). 기존 ID 집합을 받아 충돌 없는 번호로.
function makeTaskId(existingIds: Set<string>): string {
  const stamp = ymdCompactKst()
  for (let n = 1; n < 1000; n++) {
    const id = `task_${stamp}_${String(n).padStart(3, '0')}`
    if (!existingIds.has(id)) return id
  }
  throw new Error('task ID 생성 실패')
}

type Body = {
  지점명?: string
  방코드?: string
  제목?: string
  태그?: string[]
  담당자명?: string
  시작일?: string
  마감일?: string
  금액?: number | string
  메모?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    // 기본 검증 (UI가 담보하지만 서버에서도)
    if (!body.지점명 || !String(body.지점명).trim()) {
      return NextResponse.json({ error: '지점명 누락' }, { status: 400 })
    }
    const tags = Array.isArray(body.태그) ? body.태그.filter(Boolean) : []
    if (tags.length === 0) {
      return NextResponse.json({ error: '태그 누락' }, { status: 400 })
    }
    // 시작일/마감일은 선택. 마감일이 없으면 상태='인벤토리'로 저장.
    const startDate = String(body.시작일 || '').trim()
    const endDate = String(body.마감일 || '').trim()
    const status = endDate ? '접수' : '인벤토리'

    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '할일ID')
    if (idCol < 0) {
      return NextResponse.json({ error: '할일ID 헤더 없음 — 시트 마이그레이션 필요' }, { status: 500 })
    }
    const existingIds = new Set<string>()
    for (const r of rows) {
      if (r[idCol]) existingIds.add(r[idCol])
    }
    const id = makeTaskId(existingIds)

    // 제목이 비어 있으면 첫 태그와 지점명으로 자동 생성
    const autoTitle = `${tags[0]} · ${body.지점명}`
    const title = body.제목 && body.제목.trim() ? body.제목.trim() : autoTitle

    const amount = body.금액 !== undefined && body.금액 !== '' ? Number(body.금액) : 0
    const amountStr = Number.isFinite(amount) ? String(amount) : '0'

    // 헤더명 기반으로 row 구성
    const row = new Array(headers.length).fill('') as string[]
    const setCell = (name: string, v: string) => {
      const i = colIdx(headers, name)
      if (i >= 0) row[i] = v
    }
    setCell('할일ID', id)
    setCell('지점명', String(body.지점명))
    setCell('방코드', String(body.방코드 || ''))
    setCell('제목', title)
    setCell('태그', tags.join(','))
    setCell('담당자명', String(body.담당자명 || ''))
    setCell('시작일', startDate)
    setCell('마감일', endDate)
    setCell('상태', status)
    setCell('금액', amountStr)
    setCell('담당자메모', String(body.메모 || ''))
    setCell('등록일', ymdKst())
    setCell('완료일', '')

    try {
      await appendRow(SHEET, row)
    } catch (e: any) {
      // Sheets API 오류를 분류해 더 명확한 상태코드로 반환
      const code = Number(e?.code || e?.response?.status || 0)
      const msg = e?.errors?.[0]?.message || e?.message || String(e)
      console.error('[register] appendRow 실패', { code, msg })
      if (code === 403) {
        return NextResponse.json({
          error: '시트 접근 권한 없음 — 서비스 계정에 편집자 권한이 있는지 확인해 주세요',
          detail: msg,
        }, { status: 403 })
      }
      if (code === 401) {
        return NextResponse.json({
          error: '시트 인증 실패 — GOOGLE_PRIVATE_KEY / GOOGLE_SERVICE_ACCOUNT_EMAIL 환경변수를 확인해 주세요',
          detail: msg,
        }, { status: 401 })
      }
      return NextResponse.json({ error: `시트 저장 실패: ${msg}` }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      id,
      제목: title,
      지점명: body.지점명,
      태그: tags,
    })
  } catch (e) {
    console.error('[register] 처리 중 오류', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
