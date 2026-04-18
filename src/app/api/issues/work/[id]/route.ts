import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow, deleteRow } from '@/lib/sheets'

// 용역 시트는 헤더명 기반으로 파싱한다 (컬럼 인덱스 직접 사용 금지)
const SHEET = '용역'

type WorkResp = {
  rowIndex: number
  용역ID: string
  예정일: string
  지점명: string
  담당자명: string
  작업종류: string
  정산금액: number
  메모: string
  요청사항: string
  완료여부: 'Y' | 'N'
  완료일: string
}

function readRow(headers: string[], r: string[], rowIndex: number): WorkResp {
  const get = (name: string) => {
    const i = colIdx(headers, name)
    return i >= 0 ? (r[i] || '') : ''
  }
  return {
    rowIndex,
    용역ID: get('용역ID'),
    예정일: get('예정일'),
    지점명: get('지점명'),
    담당자명: get('담당자명'),
    작업종류: get('작업종류'),
    정산금액: Number(get('정산금액')) || 0,
    메모: get('메모'),
    요청사항: get('요청사항'),
    완료여부: get('완료여부') === 'Y' ? 'Y' : 'N',
    완료일: get('완료일'),
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '용역ID')
    if (idCol < 0) return NextResponse.json({ error: '용역ID 헤더 없음' }, { status: 500 })
    const idx = rows.findIndex(r => (r[idCol] || '') === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json(readRow(headers, rows[idx], idx))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH 입력 화이트리스트
const PATCHABLE_TEXT = new Set([
  '예정일', '지점명', '담당자명', '작업종류', '메모', '요청사항', '완료일',
])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '용역ID')
    if (idCol < 0) return NextResponse.json({ error: '용역ID 헤더 없음' }, { status: 500 })
    const idx = rows.findIndex(r => (r[idCol] || '') === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const updated: string[] = []
    for (let i = 0; i < headers.length; i++) updated[i] = rows[idx][i] || ''

    const setCell = (name: string, v: string) => {
      const i = colIdx(headers, name)
      if (i >= 0) updated[i] = v
    }

    for (const k of Object.keys(body)) {
      if (!PATCHABLE_TEXT.has(k)) continue
      const v = body[k]
      if (v === undefined || v === null) continue
      setCell(k, String(v))
    }

    if (body.정산금액 !== undefined) {
      const n = Number(body.정산금액)
      setCell('정산금액', Number.isFinite(n) ? String(n) : '0')
    }

    if (body.완료여부 !== undefined) {
      const v = body.완료여부 === 'Y' || body.완료여부 === true ? 'Y' : 'N'
      setCell('완료여부', v)
      // 완료 토글 시 완료일 자동 처리 (요청에 명시 완료일 있으면 그걸 우선)
      if (body.완료일 === undefined) {
        if (v === 'Y') {
          const today = new Date().toISOString().slice(0, 10)
          setCell('완료일', today)
        } else {
          setCell('완료일', '')
        }
      }
    }

    await updateRow(SHEET, idx, updated)
    return NextResponse.json(readRow(headers, updated, idx))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { headers, rows } = await getSheetWithHeaders(SHEET)
    const idCol = colIdx(headers, '용역ID')
    if (idCol < 0) return NextResponse.json({ error: '용역ID 헤더 없음' }, { status: 500 })
    const idx = rows.findIndex(r => (r[idCol] || '') === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await deleteRow(SHEET, idx)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
