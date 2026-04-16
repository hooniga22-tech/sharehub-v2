/**
 * 2026쉐어관리시트 → sharehub-v2 DB 자동 동기화 스크립트
 *
 * 원본: 1mOc5TlgYgBTuBmhMair0PXW09TNLixW1VC1Jongy49U
 *   - 입주자 탭: 계약 정보
 *   - 2026정산 탭: 월별 수납 현황
 *
 * 대상: 1stlFQStThdaw-si05ICOhJ5phfvWyCS0RHjeNh08TY8
 *   - 입주자 탭 (20열)
 *   - 수납 탭 (12열)
 *
 * 사용법:
 *   npx tsx scripts/sync_2026.ts          # dry run
 *   npx tsx scripts/sync_2026.ts --write  # 실제 반영
 */

import { google } from 'googleapis'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ── 시트 ID ──
const SOURCE_ID = '1mOc5TlgYgBTuBmhMair0PXW09TNLixW1VC1Jongy49U'
const TARGET_ID = process.env.GOOGLE_SHEETS_ID || '1stlFQStThdaw-si05ICOhJ5phfvWyCS0RHjeNh08TY8'

// ── 제외 하우스 ──
const EXCLUDE_HOUSES = ['구디', '구디하우스', '루프', '루프하우스', '무드', '무드하우스', '바우', '바우하우스']

// ── 하우스→구 매핑 ──
const HOUSE_GU_MAP: Record<string, string> = {
  '워너비하우스': '강남구',
  '영동하우스': '강남구',
  '삼중하우스': '강남구',
  '신사하우스': '강남구',
  '선릉하우스': '강남구',
  '반포하우스': '서초구',
  '샤네하우스': '강남구',
  '대학하우스': '서대문구',
  '낙성하우스': '관악구',
  '쌍용하우스': '구로구',
  '원효하우스': '용산구',
  '샛별하우스': '마포구',
}

// ── 인증 ──
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

// ── 헬퍼 ──
function randomToken(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let t = ''
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

/** 시리얼 넘버/문자열 날짜를 YYYY-MM-DD 로 변환 */
function parseDate(raw: string): string {
  if (!raw || raw.trim() === '') return ''
  const trimmed = raw.trim()

  // 이미 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // YYYY.MM.DD or YYYY/MM/DD
  const dotMatch = trimmed.match(/^(\d{4})[.\/](\d{1,2})[.\/](\d{1,2})$/)
  if (dotMatch) {
    return `${dotMatch[1]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[3].padStart(2, '0')}`
  }

  // Google Sheets 시리얼 넘버 (숫자)
  const num = Number(trimmed)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const epoch = new Date(1899, 11, 30)
    const d = new Date(epoch.getTime() + num * 86400000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  return trimmed
}

/** 숫자 정리 (콤마, 공백 제거) */
function parseNum(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[,\s]/g, '')
  const n = Number(cleaned)
  return isNaN(n) ? '' : String(n)
}

// ── 로그 ──
const logLines: string[] = []
function log(msg: string) {
  console.log(msg)
  logLines.push(msg)
}

// ════════════════════════════════════════════════
// Step 1: 원본 시트 읽기 & 파싱
// ════════════════════════════════════════════════

interface SourceTenant {
  구: string
  하우스명: string
  방코드: string
  방타입: string
  이름: string
  입주일: string
  퇴실일: string
  메모: string
  상태: string
  보증금: string
}

interface SourcePayment {
  하우스명: string
  방코드: string
  이름: string
  연월: string
  월세: string
  관리비: string
}

/** 원본 축약명 → DB 전체명 변환 ("워너비" → "워너비하우스") */
function normalizeHouseName(raw: string): string {
  let name = raw.trim()
  // 괄호 안 주소 제거: "워너비(강남구 도산대로...)" → "워너비"
  name = name.replace(/\(.*\)$/, '').trim()
  // 이미 "하우스"로 끝나면 그대로
  if (name.endsWith('하우스')) return name
  return name + '하우스'
}

async function readSourceTenants(sheets: ReturnType<typeof google.sheets>): Promise<SourceTenant[]> {
  log('\n═══ Step 1-A: 원본 입주자 탭 읽기 ═══')
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SOURCE_ID,
    range: '입주자!A1:K',
  })
  const allRows = res.data.values || []
  if (allRows.length < 5) {
    log('입주자 탭: 데이터 부족')
    return []
  }

  // 4행(index 3)이 실제 헤더: 지역, 하우스, 자리, 구분, 계약자, 계약시작, 계약종료, 추가사항, 공실, 보증금
  const headerRow = allRows[3]
  log(`입주자 탭: 헤더(4행) = ${JSON.stringify(headerRow)}`)
  log(`입주자 탭: 총 ${allRows.length - 4}행 (데이터)`)

  const tenants: SourceTenant[] = []
  const skipped: string[] = []

  // 5행(index 4)부터 데이터
  for (let i = 4; i < allRows.length; i++) {
    const r = allRows[i]
    const 구 = (r[0] || '').trim()     // A열: 지역(구)
    const 하우스raw = (r[1] || '').trim() // B열: 하우스(축약)
    const 방코드 = (r[2] || '').trim()   // C열: 자리(방코드)
    const 방타입 = (r[3] || '').trim()   // D열: 구분(방타입)
    const 이름 = (r[4] || '').trim()     // E열: 계약자(이름)

    // 필수 필드 체크
    if (!하우스raw || !이름) {
      if (하우스raw || 방코드 || 이름) {
        skipped.push(`행${i + 1}: 하우스=${하우스raw}, 방코드=${방코드}, 이름=${이름}`)
      }
      continue
    }

    // 메타/헤더 행 필터링
    const skipWords = ['하우스', '입주일자', '한달 기준일', '구분', '자리']
    if (skipWords.some(w => 하우스raw === w || 이름 === w)) {
      skipped.push(`행${i + 1}: 메타행 스킵 (${하우스raw}/${이름})`)
      continue
    }

    const 하우스명 = normalizeHouseName(하우스raw)

    const 공실여부 = (r[8] || '').trim()
    let 상태 = '입주중'
    if (공실여부 === '공실예정' || 공실여부 === '공실') {
      상태 = '퇴실'
    }

    // 구 매핑: 원본 A열에 구가 있으면 사용, 없으면 HOUSE_GU_MAP
    const 구결정 = 구 || HOUSE_GU_MAP[하우스명] || ''

    tenants.push({
      구: 구결정,
      하우스명,
      방코드,
      방타입,
      이름,
      입주일: parseDate(r[5] || ''),
      퇴실일: parseDate(r[6] || ''),
      메모: (r[7] || '').trim(),
      상태,
      보증금: parseNum(r[9] || ''),
    })
  }

  // 하우스별 통계
  const byHouse: Record<string, number> = {}
  for (const t of tenants) {
    byHouse[t.하우스명] = (byHouse[t.하우스명] || 0) + 1
  }
  log('\n[하우스별 입주자 수]')
  for (const [h, n] of Object.entries(byHouse).sort((a, b) => b[1] - a[1])) {
    log(`  ${h}: ${n}명`)
  }

  if (skipped.length > 0) {
    log(`\n[스킵된 행] ${skipped.length}건`)
    for (const s of skipped) log(`  ${s}`)
  }

  return tenants
}

async function readSourcePayments(sheets: ReturnType<typeof google.sheets>): Promise<SourcePayment[]> {
  log('\n═══ Step 1-B: 원본 2026정산 탭 읽기 ═══')
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SOURCE_ID,
    range: '2026정산!A1:ZZ',
  })
  const allRows = res.data.values || []
  if (allRows.length < 2) {
    log('2026정산 탭: 데이터 없음')
    return []
  }

  // 1행에서 월 헤더 파악 (D열부터 3열씩: 이름, 월세, 관리비)
  const headerRow = allRows[0]
  log(`정산 탭: 총 ${allRows.length}행, ${headerRow.length}열`)

  // 월 위치 파악: "N월 이름" 패턴으로 이름열을 찾아서 3열 단위 (이름, 월세, 관리비)
  const months: { month: number; nameCol: number }[] = []
  for (let c = 3; c < headerRow.length; c++) {
    const val = (headerRow[c] || '').toString().trim()
    const mMatch = val.match(/^(\d{1,2})월\s*이름$/)
    if (mMatch) {
      months.push({ month: parseInt(mMatch[1]), nameCol: c })
    }
  }

  if (months.length === 0) {
    // 대안: 3열씩 균등 분할 시도
    log('월 헤더를 자동 인식 못함, 3열 단위로 분할 시도')
    for (let c = 3, m = 1; c + 2 < headerRow.length && m <= 12; c += 3, m++) {
      months.push({ month: m, nameCol: c })
    }
  }

  log(`인식된 월: ${months.map(m => `${m.month}월(col${m.nameCol})`).join(', ')} (${months.length}개월)`)

  const payments: SourcePayment[] = []
  const skipped: string[] = []

  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i]
    const 하우스raw = (r[1] || '').trim()
    const 구분 = (r[2] || '').trim()

    // 합계/고정비/공과금 행 제외
    if (!하우스raw) continue
    const skipKeywords = ['합계', '고정비', '공과금', '소계', '관리비합', '수입합', '지출', '순수익', '집월세', '투자자']
    if (skipKeywords.some(k => 구분.includes(k) || 하우스raw.includes(k))) {
      skipped.push(`행${i + 1}: ${하우스raw} / ${구분} (제외키워드)`)
      continue
    }
    // 방코드(구분)가 없으면 스킵 (하우스 소계행 등)
    if (!구분) {
      skipped.push(`행${i + 1}: ${하우스raw} / (구분없음)`)
      continue
    }

    const 하우스명 = normalizeHouseName(하우스raw)

    // 각 월 데이터
    for (const month of months) {
      const monthNum = String(month.month).padStart(2, '0')
      const 연월 = `2026-${monthNum}`

      const nameCol = month.nameCol
      const rentCol = month.nameCol + 1
      const mgmtCol = month.nameCol + 2

      const rawName = (r[nameCol] || '').trim()
      const 월세 = parseNum(r[rentCol] || '')
      const 관리비 = parseNum(r[mgmtCol] || '')

      // 이름이 있는 행만
      if (!rawName) continue
      // 숫자만 있는 이름 제외 (합계 등)
      if (/^\d[\d,]*$/.test(rawName.replace(/,/g, ''))) continue

      // 이름에서 날짜 등 부가정보 제거하여 깨끗한 이름 추출
      // "BILLON Zoe 2/28\n柯吟 周 Ko Yin Zhou (엔코) 2/28" → 마지막 이름 사용
      const nameLines = rawName.split('\n').filter(l => l.trim())
      // 여러 이름이 있으면 마지막 이름 사용 (교체 입주자)
      let 이름 = nameLines[nameLines.length - 1].trim()
      // 날짜 패턴 제거 (끝에 붙는 "6/22", "4/1~30" 등)
      이름 = 이름.replace(/\s+\d{1,2}\/\d{1,2}(~\d{1,2})?$/, '').trim()

      payments.push({
        하우스명,
        방코드: 구분,
        이름,
        연월,
        월세,
        관리비,
      })
    }
  }

  // 월별 통계
  const byMonth: Record<string, number> = {}
  for (const p of payments) {
    byMonth[p.연월] = (byMonth[p.연월] || 0) + 1
  }
  log('\n[월별 수납 데이터 건수]')
  for (const [m, n] of Object.entries(byMonth).sort()) {
    log(`  ${m}: ${n}건`)
  }

  if (skipped.length > 0) {
    log(`\n[제외된 행] ${skipped.length}건`)
    for (const s of skipped.slice(0, 20)) log(`  ${s}`)
    if (skipped.length > 20) log(`  ... 외 ${skipped.length - 20}건`)
  }

  return payments
}

// ════════════════════════════════════════════════
// Step 2: 웹앱 DB 현재 상태 읽기
// ════════════════════════════════════════════════

interface DbTenant {
  rowIndex: number
  입주자ID: string
  구: string
  지점명: string
  방코드: string
  방타입: string
  이름: string
  입주일: string
  퇴실일: string
  상태: string
  보증금: string
  월세: string
  관리비: string
  메모: string
  연락처: string
  생년월일: string
  주소: string
  투자자: string
  투자자계좌: string
  투자자연락처: string
  링크토큰: string
  raw: string[]
}

interface DbPayment {
  rowIndex: number
  수납ID: string
  입주자ID: string
  지점명: string
  방코드: string
  이름: string
  연월: string
  청구액: string
  납부액: string
  납부일: string
  상태: string
  납부방법: string
  메모: string
}

async function readTargetDb(sheets: ReturnType<typeof google.sheets>) {
  log('\n═══ Step 2: 웹앱 DB 현재 상태 읽기 ═══')

  // 입주자
  const tRes = await sheets.spreadsheets.values.get({
    spreadsheetId: TARGET_ID,
    range: '입주자!A1:T',
  })
  const tRows = tRes.data.values || []
  log(`입주자 시트: ${tRows.length - 1}행 (헤더 제외)`)
  if (tRows.length > 0) {
    log(`입주자 헤더: ${JSON.stringify(tRows[0])}`)
  }

  const tenants: DbTenant[] = []
  let maxTenantNum = 0
  for (let i = 1; i < tRows.length; i++) {
    const r = tRows[i]
    const id = (r[0] || '').trim()
    const numMatch = id.match(/(\d+)/)
    if (numMatch) {
      const n = parseInt(numMatch[1])
      if (n > maxTenantNum) maxTenantNum = n
    }
    tenants.push({
      rowIndex: i - 1,
      입주자ID: id,
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
      raw: r,
    })
  }

  // 수납
  const pRes = await sheets.spreadsheets.values.get({
    spreadsheetId: TARGET_ID,
    range: '수납!A1:L',
  })
  const pRows = pRes.data.values || []
  log(`수납 시트: ${pRows.length - 1}행 (헤더 제외)`)

  const payments: DbPayment[] = []
  let maxPaymentNum = 0
  for (let i = 1; i < pRows.length; i++) {
    const r = pRows[i]
    const id = (r[0] || '').trim()
    const numMatch = id.match(/(\d+)/)
    if (numMatch) {
      const n = parseInt(numMatch[1])
      if (n > maxPaymentNum) maxPaymentNum = n
    }
    payments.push({
      rowIndex: i - 1,
      수납ID: id,
      입주자ID: r[1] || '',
      지점명: r[2] || '',
      방코드: r[3] || '',
      이름: r[4] || '',
      연월: r[5] || '',
      청구액: r[6] || '',
      납부액: r[7] || '',
      납부일: r[8] || '',
      상태: r[9] || '',
      납부방법: r[10] || '',
      메모: r[11] || '',
    })
  }

  log(`기존 입주자ID 최댓값: tenant_${String(maxTenantNum).padStart(3, '0')}`)
  log(`기존 수납ID 최댓값: pay_${String(maxPaymentNum).padStart(3, '0')}`)

  // 하우스별 현황
  const byHouse: Record<string, number> = {}
  for (const t of tenants) {
    const h = t.지점명 || '(없음)'
    byHouse[h] = (byHouse[h] || 0) + 1
  }
  log('\n[하우스별 기존 등록 현황]')
  for (const [h, n] of Object.entries(byHouse).sort((a, b) => b[1] - a[1])) {
    log(`  ${h}: ${n}명`)
  }

  return { tenants, payments, maxTenantNum, maxPaymentNum }
}

// ════════════════════════════════════════════════
// Step 3: 동기화
// ════════════════════════════════════════════════

/** 배치 쓰기: batchUpdate로 여러 범위를 한번에 업데이트 (API 할당량 절약) */
async function batchWrite(
  sheets: ReturnType<typeof google.sheets>,
  updates: { range: string; values: string[][] }[],
) {
  if (updates.length === 0) return
  // batchUpdate는 한번에 최대 ~100개씩 묶어 처리
  const CHUNK = 80
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: TARGET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: chunk.map(u => ({ range: u.range, values: u.values })),
      },
    })
    // 각 배치 후 짧은 딜레이로 쿼터 보호
    if (i + CHUNK < updates.length) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}

/** 배치 append: 여러 행을 한번에 추가 */
async function batchAppend(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
  range: string,
  rows: string[][],
) {
  if (rows.length === 0) return
  // append는 한번에 여러 행 가능, 500행씩 분할
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    await sheets.spreadsheets.values.append({
      spreadsheetId: TARGET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: chunk },
    })
    if (i + CHUNK < rows.length) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}

async function syncTenants(
  sheets: ReturnType<typeof google.sheets>,
  srcTenants: SourceTenant[],
  dbTenants: DbTenant[],
  startNum: number,
  dryRun: boolean,
): Promise<{ newTenants: Map<string, string>; stats: { created: number; updated: number; errors: string[] } }> {
  log('\n═══ Step 3-A: 입주자 동기화 ═══')

  const stats = { created: 0, updated: 0, errors: [] as string[] }
  let nextNum = startNum + 1

  // 키: 지점명+방코드+이름 → DB 행
  const dbMap = new Map<string, DbTenant>()
  for (const t of dbTenants) {
    const key = `${t.지점명}|${t.방코드}|${t.이름}`
    dbMap.set(key, t)
  }

  // 동기화된 입주자 매핑: 지점명+방코드+이름 → 입주자ID
  const tenantIdMap = new Map<string, string>()
  for (const t of dbTenants) {
    tenantIdMap.set(`${t.지점명}|${t.방코드}|${t.이름}`, t.입주자ID)
  }

  const newByHouse: Record<string, number> = {}
  const updateBatch: { range: string; values: string[][] }[] = []
  const appendBatch: string[][] = []

  for (const src of srcTenants) {
    // 제외 하우스 스킵
    if (EXCLUDE_HOUSES.includes(src.하우스명)) continue

    const key = `${src.하우스명}|${src.방코드}|${src.이름}`
    const existing = dbMap.get(key)
    const 구 = src.구 || HOUSE_GU_MAP[src.하우스명] || ''

    if (existing) {
      const needsUpdate =
        existing.입주일 !== src.입주일 ||
        existing.퇴실일 !== src.퇴실일 ||
        existing.상태 !== src.상태 ||
        (src.보증금 && existing.보증금 !== src.보증금)

      if (needsUpdate) {
        const row = [...existing.raw]
        while (row.length < 20) row.push('')
        if (구) row[1] = 구
        row[6] = src.입주일
        row[7] = src.퇴실일
        row[8] = src.상태
        if (src.보증금) row[9] = src.보증금
        if (src.메모 && !row[12]) row[12] = src.메모
        if (src.방타입 && !row[4]) row[4] = src.방타입

        updateBatch.push({ range: `입주자!A${existing.rowIndex + 2}`, values: [row] })
        log(`  [업데이트] ${src.하우스명} ${src.방코드} ${src.이름} (${existing.입주자ID})`)
        stats.updated++
      }
      tenantIdMap.set(key, existing.입주자ID)
    } else {
      const id = `tenant_${String(nextNum).padStart(3, '0')}`
      nextNum++
      const token = randomToken()

      const row = [
        id, 구, src.하우스명, src.방코드, src.방타입, src.이름,
        src.입주일, src.퇴실일, src.상태, src.보증금, '', '',
        src.메모, '', '', '', '', '', '', token,
      ]

      appendBatch.push(row)
      log(`  [신규] ${src.하우스명} ${src.방코드} ${src.이름} → ${id}`)
      stats.created++
      newByHouse[src.하우스명] = (newByHouse[src.하우스명] || 0) + 1
      tenantIdMap.set(key, id)
    }
  }

  // 실제 쓰기
  if (!dryRun) {
    log(`\n  배치 업데이트: ${updateBatch.length}건, 신규 append: ${appendBatch.length}건`)
    await batchWrite(sheets, updateBatch)
    await batchAppend(sheets, '입주자', '입주자!A:T', appendBatch)
  }

  if (Object.keys(newByHouse).length > 0) {
    log('\n[신규 입주자 하우스별]')
    for (const [h, n] of Object.entries(newByHouse).sort((a, b) => b[1] - a[1])) {
      log(`  ${h}: ${n}명`)
    }
  }

  return { newTenants: tenantIdMap, stats }
}

async function syncPayments(
  sheets: ReturnType<typeof google.sheets>,
  srcPayments: SourcePayment[],
  dbPayments: DbPayment[],
  tenantIdMap: Map<string, string>,
  startNum: number,
  dryRun: boolean,
): Promise<{ created: number; updated: number; errors: string[] }> {
  log('\n═══ Step 3-B: 수납 동기화 ═══')

  const stats = { created: 0, updated: 0, errors: [] as string[] }
  let nextNum = startNum + 1

  // 키: 지점명+방코드+이름+연월 → DB 행
  const dbMap = new Map<string, DbPayment>()
  for (const p of dbPayments) {
    const key = `${p.지점명}|${p.방코드}|${p.이름}|${p.연월}`
    dbMap.set(key, p)
  }

  // 당월 판단
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const updateBatch: { range: string; values: string[][] }[] = []
  const appendBatch: string[][] = []

  for (const src of srcPayments) {
    // 제외 하우스 스킵
    if (EXCLUDE_HOUSES.includes(src.하우스명)) continue

    const key = `${src.하우스명}|${src.방코드}|${src.이름}|${src.연월}`
    const existing = dbMap.get(key)

    // 입주자ID 찾기
    const tKey = `${src.하우스명}|${src.방코드}|${src.이름}`
    const 입주자ID = tenantIdMap.get(tKey) || ''

    // 청구액 = 월세 + 관리비
    const rent = Number(src.월세) || 0
    const mgmt = Number(src.관리비) || 0
    const total = rent + mgmt

    if (total === 0) continue

    let 상태 = '미납'
    if (src.연월 < currentYM) {
      상태 = '납부완료'
    }

    if (existing) {
      if (existing.청구액 !== String(total)) {
        const row = [
          existing.수납ID, existing.입주자ID || 입주자ID, existing.지점명, existing.방코드, existing.이름,
          existing.연월, String(total), existing.납부액, existing.납부일,
          existing.상태 || 상태, existing.납부방법, existing.메모,
        ]
        updateBatch.push({ range: `수납!A${existing.rowIndex + 2}`, values: [row] })
        log(`  [업데이트] ${src.하우스명} ${src.방코드} ${src.이름} ${src.연월} 청구액 ${existing.청구액}→${total}`)
        stats.updated++
      }
    } else {
      const id = `pay_${String(nextNum).padStart(4, '0')}`
      nextNum++

      const row = [
        id, 입주자ID, src.하우스명, src.방코드, src.이름,
        src.연월, String(total), '', '', 상태, '', '',
      ]
      appendBatch.push(row)
      stats.created++
    }
  }

  // 실제 쓰기
  if (!dryRun) {
    log(`\n  배치 업데이트: ${updateBatch.length}건, 신규 append: ${appendBatch.length}건`)
    await batchWrite(sheets, updateBatch)
    await batchAppend(sheets, '수납', '수납!A:L', appendBatch)
  }

  return stats
}

// ════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════

async function main() {
  const dryRun = !process.argv.includes('--write')
  log(`\n${'═'.repeat(50)}`)
  log(`2026쉐어관리시트 → sharehub-v2 동기화`)
  log(`모드: ${dryRun ? 'DRY RUN (미리보기)' : '실제 반영'}`)
  log(`시간: ${new Date().toISOString()}`)
  log(`${'═'.repeat(50)}`)

  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Step 1: 원본 읽기
  const srcTenants = await readSourceTenants(sheets)
  const srcPayments = await readSourcePayments(sheets)

  // Step 2: DB 읽기
  const db = await readTargetDb(sheets)

  // Step 3: 동기화
  const tenantResult = await syncTenants(sheets, srcTenants, db.tenants, db.maxTenantNum, dryRun)
  const paymentResult = await syncPayments(sheets, srcPayments, db.payments, tenantResult.newTenants, db.maxPaymentNum, dryRun)

  // Step 4: 결과 리포트
  log(`\n${'═'.repeat(50)}`)
  log(`결과 리포트 (${dryRun ? 'DRY RUN' : '실제 반영'})`)
  log(`${'═'.repeat(50)}`)
  log(`[입주자]`)
  log(`  신규 등록: ${tenantResult.stats.created}명`)
  log(`  업데이트: ${tenantResult.stats.updated}명`)
  if (tenantResult.stats.errors.length > 0) {
    log(`  오류: ${tenantResult.stats.errors.length}건`)
    for (const e of tenantResult.stats.errors) log(`    - ${e}`)
  }
  log(`[수납]`)
  log(`  신규 등록: ${paymentResult.created}건`)
  log(`  업데이트: ${paymentResult.updated}건`)
  if (paymentResult.errors.length > 0) {
    log(`  오류: ${paymentResult.errors.length}건`)
    for (const e of paymentResult.errors) log(`    - ${e}`)
  }

  if (dryRun) {
    log(`\n※ DRY RUN 모드입니다. 실제 반영하려면: npx tsx scripts/sync_2026.ts --write`)
  }

  // 로그 저장
  const logPath = path.resolve(__dirname, '../sync_log.txt')
  fs.writeFileSync(logPath, logLines.join('\n'), 'utf-8')
  log(`\n로그 저장: ${logPath}`)
}

main().catch(err => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
