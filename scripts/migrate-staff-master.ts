/**
 * 용역담당자 탭 스키마 마이그레이션
 *  - 기존 8컬럼 → 13컬럼 재구성
 *  - 방역업체 row 삭제, 강욥 row 추가
 *  - 기존 5명 (이인실/이미경/이한나/진진수/김기진)에 분야·상태 채움
 *  - 백업 탭: 용역담당자_백업_YYYYMMDD (KST)
 *
 * 기본 dry-run. --apply로 실제 실행.
 *
 *   npx tsx scripts/migrate-staff-master.ts
 *   npx tsx scripts/migrate-staff-master.ts --apply
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!
const TAB_NAME = '용역담당자'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

// ── 목표 헤더 (13컬럼) ─────────────────────────────────
const NEW_HEADER = [
  '담당자ID', '이름', '분야', '상태', '연락처',
  '은행명', '계좌번호', '예금주', '주민번호앞6',
  '기본금액', '링크토큰', '활동시작일', '메모',
]

// ── 기존 5명 보강 정보 ────────────────────────────────
const EXISTING_ENRICH: Record<string, { 분야: string; 상태: string }> = {
  '이인실': { 분야: '청소', 상태: '활동중' },
  '이미경': { 분야: '청소', 상태: '활동중' },
  '이한나': { 분야: '청소', 상태: '활동중' },
  '진진수': { 분야: '수리', 상태: '활동중' },
  '김기진': { 분야: '수리', 상태: '활동중' },
}

const REMOVE_NAME = '방역업체'
const ADD_NAME = '강욥'
const ADD_FIELD = '수리'
const ADD_STATUS = '활동중'

// ── 유틸 ───────────────────────────────────────────────
function kstYmd(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
}

function randomToken(existing: Set<string>): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let attempt = 0; attempt < 100; attempt++) {
    let t = 'w_'
    for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)]
    if (!existing.has(t)) return t
  }
  throw new Error('랜덤 토큰 생성 실패')
}

function makeStaffId(existing: Set<string>): string {
  // staff_<ms> 패턴. 충돌 방지로 +1ms 시도.
  let id = `staff_${Date.now()}`
  let tries = 0
  while (existing.has(id) && tries < 1000) {
    id = `staff_${Date.now() + tries}`
    tries++
  }
  return id
}

// ── 메인 ───────────────────────────────────────────────
async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`== ${apply ? 'APPLY' : 'DRY RUN'} ==\n`)

  const auth = await getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // 1. 기존 탭 읽기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:Z`,
  })
  const all = (res.data.values || []) as string[][]
  if (all.length === 0) throw new Error(`${TAB_NAME} 탭 비어있음`)
  const oldHeader = all[0]
  const oldData = all.slice(1)
  console.log(`기존: ${oldHeader.length}컬럼, ${oldData.length}명`)
  console.log(`기존 헤더: ${JSON.stringify(oldHeader)}`)

  // 기존 컬럼 인덱스
  const iId    = oldHeader.indexOf('담당자ID')
  const iName  = oldHeader.indexOf('이름')
  const iPhone = oldHeader.indexOf('연락처')
  const iAcct  = oldHeader.indexOf('계좌번호')
  const iToken = oldHeader.indexOf('링크토큰')
  const iBase  = oldHeader.indexOf('기본금액')

  // 기존 ID/토큰 집합 (중복 방지)
  const existingIds = new Set<string>()
  const existingTokens = new Set<string>()
  for (const r of oldData) {
    if (iId >= 0 && r[iId]) existingIds.add(r[iId])
    if (iToken >= 0 && r[iToken]) existingTokens.add(r[iToken])
  }

  // 2. 신규 13컬럼 row 구성
  type Action = { type: 'keep' | 'enrich' | 'remove' | 'add'; label: string; row?: string[] }
  const actions: Action[] = []
  const newRows: string[][] = []

  for (const r of oldData) {
    const name = (r[iName] || '').trim()
    if (name === REMOVE_NAME) {
      actions.push({ type: 'remove', label: `${REMOVE_NAME}: 삭제 예정` })
      continue
    }
    const enrich = EXISTING_ENRICH[name]
    const fld = enrich?.분야 || ''
    const st = enrich?.상태 || ''

    const newRow = [
      (iId >= 0 ? r[iId] : '') || '',        // 담당자ID
      name,                                   // 이름
      fld,                                    // 분야
      st,                                     // 상태
      (iPhone >= 0 ? r[iPhone] : '') || '',  // 연락처
      '',                                     // 은행명
      (iAcct >= 0 ? r[iAcct] : '') || '',    // 계좌번호
      '',                                     // 예금주
      '',                                     // 주민번호앞6
      (iBase >= 0 ? r[iBase] : '') || '',    // 기본금액
      (iToken >= 0 ? r[iToken] : '') || '',  // 링크토큰
      '',                                     // 활동시작일
      '',                                     // 메모
    ]
    newRows.push(newRow)
    actions.push({
      type: enrich ? 'enrich' : 'keep',
      label: enrich
        ? `  - ${name}: 분야="${fld}", 상태="${st}" 설정`
        : `  - ${name}: 분야/상태 미지정 (기존 정보 보존만)`,
      row: newRow,
    })
  }

  // 3. 강욥 신규 row
  const newId = makeStaffId(existingIds)
  existingIds.add(newId)
  const newToken = randomToken(existingTokens)
  existingTokens.add(newToken)
  const 강욥Row = [
    newId,                  // 담당자ID
    ADD_NAME,               // 이름
    ADD_FIELD,              // 분야
    ADD_STATUS,             // 상태
    '',                     // 연락처
    '',                     // 은행명
    '',                     // 계좌번호
    '',                     // 예금주
    '',                     // 주민번호앞6
    '',                     // 기본금액
    newToken,               // 링크토큰
    '',                     // 활동시작일
    '',                     // 메모
  ]
  newRows.push(강욥Row)
  actions.push({
    type: 'add',
    label: `  - [ADD] ${ADD_NAME} (${ADD_FIELD}, ${ADD_STATUS}, ID: ${newId}, 토큰: ${newToken})`,
    row: 강욥Row,
  })

  // 4. 백업 탭 이름
  const backupName = `${TAB_NAME}_백업_${kstYmd()}`

  // ── 로그 출력 ──────────────────────────────────────
  console.log(`\n[백업 탭 생성 예정] ${backupName}`)
  console.log(`[컬럼 재구성] 기존 ${oldHeader.length}개 → ${NEW_HEADER.length}개`)
  console.log(`[row 변경]`)
  for (const a of actions) console.log(a.label)

  if (!apply) {
    console.log(`\n실제 적용하려면 --apply 플래그로 재실행.`)
    return
  }

  // ═══ APPLY ═══

  // 5. 백업 탭 생성 (duplicateSheet)
  console.log(`\n── 적용 시작 ──`)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const tab = (meta.data.sheets || []).find(s => s.properties?.title === TAB_NAME)
  if (!tab?.properties?.sheetId && tab?.properties?.sheetId !== 0) {
    throw new Error(`${TAB_NAME} 탭 못 찾음`)
  }
  const sourceSheetId = tab.properties.sheetId!
  const existingTabNames = new Set((meta.data.sheets || []).map(s => s.properties?.title || ''))

  let finalBackupName = backupName
  let suffix = 2
  while (existingTabNames.has(finalBackupName)) {
    finalBackupName = `${backupName}_${suffix}`
    suffix++
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ duplicateSheet: { sourceSheetId, newSheetName: finalBackupName } }],
    },
  })
  console.log(`✓ 백업 탭 생성: ${finalBackupName}`)

  // 6. 기존 탭 전체 클리어
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:Z`,
  })
  console.log(`✓ ${TAB_NAME} 탭 데이터 클리어`)

  // 7. 새 헤더 + 데이터 쓰기
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A1`, valueInputOption: 'RAW',
    requestBody: { values: [NEW_HEADER, ...newRows] },
  })
  console.log(`✓ ${TAB_NAME} 탭 재작성: ${NEW_HEADER.length}컬럼 / ${newRows.length}명`)

  // 8. 사후 검증
  console.log(`\n── 사후 검증 ──`)
  const ver = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:Z`,
  })
  const verAll = (ver.data.values || []) as string[][]
  const verHeader = verAll[0] || []
  const verData = verAll.slice(1)

  const checks = {
    '헤더 13개': verHeader.length === 13,
    '헤더 순서 일치': JSON.stringify(verHeader) === JSON.stringify(NEW_HEADER),
    'row 6명': verData.length === 6,
    '담당자ID 중복 없음': new Set(verData.map(r => r[0]).filter(Boolean)).size === verData.length,
    '링크토큰 중복 없음': new Set(verData.map(r => r[10]).filter(Boolean)).size === verData.filter(r => r[10]).length,
    '분야 값 청소/수리만': verData.every(r => ['청소', '수리'].includes(r[2])),
    '상태 값 활동중/만료만': verData.every(r => ['활동중', '만료'].includes(r[3])),
    '방역업체 제거됨': !verData.some(r => r[1] === '방역업체'),
    '강욥 포함됨': verData.some(r => r[1] === '강욥'),
  }

  let allPass = true
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${v ? '✅' : '⚠️'} ${k}`)
    if (!v) allPass = false
  }

  console.log(`\n== APPLIED ==`)
  console.log(`백업 탭: ${finalBackupName}`)
  console.log(`컬럼: ${verHeader.length}개`)
  console.log(`총 row: ${verData.length} (방역업체 삭제, 강욥 추가)`)
  if (!allPass) {
    console.log(`\n⚠️ 일부 검증 실패 — 시트 직접 확인 필요`)
    process.exit(1)
  }
}

main().catch(e => { console.error('치명적 오류:', e); process.exit(1) })
