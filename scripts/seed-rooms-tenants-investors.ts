/**
 * Seed rooms, tenants, investors into Supabase.
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/seed-rooms-tenants-investors.ts   # dry-run
 *   npx tsx scripts/seed-rooms-tenants-investors.ts               # actual insert
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { randomUUID, randomBytes } from 'crypto'
import { resolve } from 'path'

const DRY_RUN = process.env.DRY_RUN === '1'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }
const supabase = createClient(url, key)

function readCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(resolve(__dirname, 'seed-data', filename), 'utf-8')
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true })
}

function num(v: string | undefined): number | null {
  if (!v || !v.trim()) return null
  const n = Number(v.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

function str(v: string | undefined): string | null {
  return v?.trim() || null
}

/** Parse birth_date from YYMMDD- format to YYYY-MM-DD, or null if unparseable */
function parseBirthDate(raw: string | undefined): { date: string | null; original: string | null } {
  const v = (raw || '').trim()
  if (!v) return { date: null, original: null }
  // Match YYMMDD- or YYMMDD-NNNNNNN patterns
  const m = v.match(/^(\d{2})(\d{2})(\d{2})-?(\d?)/)
  if (!m) return { date: null, original: v }
  const yy = Number(m[1])
  const mm = m[2]
  const dd = m[3]
  // Determine century: 00-26 -> 2000s, 27-99 -> 1900s
  const century = yy <= 26 ? 2000 : 1900
  const yyyy = century + yy
  const dateStr = `${yyyy}-${mm}-${dd}`
  // Validate
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { date: null, original: v }
  return { date: dateStr, original: null }
}

// ── 1) investors ──
function prepareInvestors() {
  const rows = readCsv('investors.csv')
  const investorMap = new Map<string, string>()
  const inserts = rows.map(r => {
    const id = randomUUID()
    const name = r.name.trim()
    investorMap.set(name, id)
    const memoLines: string[] = []
    if (r.business_number?.trim()) memoLines.push(`사업자번호: ${r.business_number.trim()}`)
    return {
      id,
      name,
      account_info: str(r.bank_account),
      phone: str(r.phone),
      access_token: 'i_' + randomBytes(32).toString('hex'),
      memo: memoLines.length ? memoLines.join('\n') : null,
    }
  })
  return { inserts, investorMap }
}

// ── 2) rooms ──
function prepareRooms(branchMap: Map<string, string>, investorMap: Map<string, string>) {
  const rows = readCsv('rooms.csv')
  const roomMap = new Map<string, string>() // "branchName::room_code" -> room_id
  const branchMissing = new Set<string>()
  const investorMissing = new Set<string>()

  const inserts = rows.map(r => {
    const id = randomUUID()
    const branchName = (r.branch_name || '').trim()
    const roomCode = (r.room_code || '').trim()
    const branchId = branchMap.get(branchName) || null
    if (branchName && !branchId) branchMissing.add(branchName)
    if (branchId && roomCode) roomMap.set(`${branchName}::${roomCode}`, id)

    const investorName = (r.investor_name || '').trim()
    if (investorName && !investorMap.has(investorName)) investorMissing.add(investorName)

    // Fields that don't have dedicated columns go to memo
    const memoLines: string[] = []
    if (r.room_description?.trim()) memoLines.push(r.room_description.trim())
    const discount = num(r.discount)
    if (discount && discount !== 0) memoLines.push(`할인: ${discount.toLocaleString()}원`)
    const rent6m = num(r.rent_6m)
    if (rent6m) memoLines.push(`6개월 월세: ${rent6m.toLocaleString()}원`)
    if (investorName) memoLines.push(`투자자: ${investorName}`)

    return {
      id,
      branch_id: branchId || '', // required field
      room_code: roomCode || null,
      room_type: str(r.room_type),
      vacancy_status: str(r.vacancy_status),
      base_deposit: num(r.deposit),
      base_rent: num(r.monthly_rent),
      base_maintenance: num(r.maintenance_fee),
      memo: memoLines.length ? memoLines.join(' / ') : null,
    }
  }).filter(r => r.branch_id) // skip rows with no branch

  return { inserts, roomMap, branchMissing: [...branchMissing], investorMissing: [...investorMissing] }
}

// ── 3) tenants ──
function prepareTenants(branchMap: Map<string, string>, roomMap: Map<string, string>) {
  const rows = readCsv('tenants.csv')
  const roomMissing: string[] = []
  const statusMap: Record<string, string> = {
    occupied: 'active',
    vacating_soon: 'active',
    vacant: 'moved_out',
  }

  const inserts = rows.map(r => {
    const id = randomUUID()
    const branchName = (r.branch_name || '').trim()
    const roomCode = (r.room_code || '').trim()
    const roomKey = `${branchName}::${roomCode}`
    const roomId = roomMap.get(roomKey) || null
    if (!roomId && branchName && roomCode) roomMissing.push(`${branchName} ${roomCode} (${(r.name||'').trim()})`)

    const csvStatus = (r.status || '').trim()
    const dbStatus = statusMap[csvStatus] || 'active'

    // phone vs email detection: CSV phone field might contain email
    const phoneRaw = (r.phone || '').trim()
    let phone: string | null = null
    let email: string | null = null
    if (phoneRaw.includes('@')) {
      email = phoneRaw
    } else if (phoneRaw) {
      phone = phoneRaw
    }

    // birth_date: parse YYMMDD- to YYYY-MM-DD, unparseable goes to memo
    const { date: birthDate, original: birthRaw } = parseBirthDate(r.birth_date)
    const memoRaw = (r.memo || '').trim()
    let memo: string | null = null
    if (birthRaw && memoRaw) {
      memo = `${memoRaw} / ID: ${birthRaw}`
    } else if (birthRaw) {
      memo = `ID: ${birthRaw}`
    } else if (memoRaw) {
      memo = memoRaw
    }

    return {
      id,
      name: (r.name || '').trim(),
      room_id: roomId,
      contract_start: str(r.contract_start),
      contract_end: str(r.contract_end),
      deposit: num(r.deposit),
      monthly_rent: num(r.monthly_rent),
      maintenance_fee: num(r.maintenance_fee),
      birth_date: birthDate,
      phone,
      email,
      home_address: str(r.address),
      memo,
      status: dbStatus,
      access_token: 't_' + randomBytes(32).toString('hex'),
    }
  })

  return { inserts, roomMissing }
}

// ── main ──
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE INSERT ===')
  console.log()

  // Current counts
  const { count: rc } = await supabase.from('rooms').select('*', { count: 'exact', head: true })
  const { count: tc } = await supabase.from('tenants').select('*', { count: 'exact', head: true })
  const { count: ic } = await supabase.from('investors').select('*', { count: 'exact', head: true })
  console.log(`Current DB: rooms=${rc}, tenants=${tc}, investors=${ic}`)
  console.log()

  // Load existing branches
  const { data: existingBranches } = await supabase.from('branches').select('id, name')
  const branchMap = new Map<string, string>()
  for (const b of existingBranches || []) branchMap.set(b.name, b.id)
  console.log(`Loaded ${branchMap.size} branches from DB`)

  // Prepare
  const { inserts: investorInserts, investorMap } = prepareInvestors()
  const { inserts: roomInserts, roomMap, branchMissing, investorMissing } = prepareRooms(branchMap, investorMap)
  const { inserts: tenantInserts, roomMissing } = prepareTenants(branchMap, roomMap)

  // Duplicate room_code check
  const roomKeys = roomInserts.map(r => `${r.branch_id}::${r.room_code}`)
  const dupeRooms = roomKeys.filter((k, i) => roomKeys.indexOf(k) !== i)

  console.log('--- Report ---')
  console.log(`investors: ${investorInserts.length} to insert`)
  console.log(`rooms:     ${roomInserts.length} to insert`)
  console.log(`tenants:   ${tenantInserts.length} to insert`)
  console.log()

  if (branchMissing.length) {
    console.log(`Branch match failures (${branchMissing.length}):`)
    branchMissing.forEach(b => console.log(`  - "${b}"`))
  } else {
    console.log('Branch matching: all OK')
  }

  if (investorMissing.length) {
    console.log(`Investor match failures (${investorMissing.length}):`)
    investorMissing.forEach(n => console.log(`  - "${n}"`))
  } else {
    console.log('Investor matching: all OK')
  }

  if (roomMissing.length) {
    console.log(`\nRoom match failures for tenants (${roomMissing.length}):`)
    roomMissing.forEach(r => console.log(`  - ${r}`))
  } else {
    console.log('Room matching for tenants: all OK')
  }

  if (dupeRooms.length) {
    console.log(`\nDuplicate room_code within same branch: ${dupeRooms.length}`)
    dupeRooms.forEach(d => console.log(`  - ${d}`))
  }
  console.log()

  if (DRY_RUN) {
    console.log('Dry run complete. Remove DRY_RUN to insert.')
    return
  }

  // ── Insert investors ──
  console.log('Inserting investors...')
  const { error: invErr } = await supabase.from('investors').insert(investorInserts)
  if (invErr) { console.error('Investor insert failed:', invErr.message); process.exit(1) }
  console.log(`  investors: ${investorInserts.length} inserted`)

  // ── Insert rooms (batches of 100) ──
  console.log('Inserting rooms...')
  let roomsDone = 0
  for (let i = 0; i < roomInserts.length; i += 100) {
    const batch = roomInserts.slice(i, i + 100)
    const { error: rErr } = await supabase.from('rooms').insert(batch)
    if (rErr) {
      console.error(`Room insert failed at batch ${i}:`, rErr.message)
      // Rollback
      const insertedRoomIds = roomInserts.slice(0, i).map(r => r.id)
      if (insertedRoomIds.length) await supabase.from('rooms').delete().in('id', insertedRoomIds)
      await supabase.from('investors').delete().in('id', investorInserts.map(x => x.id))
      process.exit(1)
    }
    roomsDone += batch.length
  }
  console.log(`  rooms: ${roomsDone} inserted`)

  // ── Insert tenants (batches of 100) ──
  console.log('Inserting tenants...')
  let tenantsDone = 0
  for (let i = 0; i < tenantInserts.length; i += 100) {
    const batch = tenantInserts.slice(i, i + 100)
    const { error: tErr } = await supabase.from('tenants').insert(batch)
    if (tErr) {
      console.error(`Tenant insert failed at batch ${i}:`, tErr.message)
      // Rollback
      const insertedTenantIds = tenantInserts.slice(0, i).map(t => t.id)
      if (insertedTenantIds.length) await supabase.from('tenants').delete().in('id', insertedTenantIds)
      await supabase.from('rooms').delete().in('id', roomInserts.map(r => r.id))
      await supabase.from('investors').delete().in('id', investorInserts.map(x => x.id))
      process.exit(1)
    }
    tenantsDone += batch.length
  }
  console.log(`  tenants: ${tenantsDone} inserted`)

  // ── Verify ──
  const { count: finalR } = await supabase.from('rooms').select('*', { count: 'exact', head: true })
  const { count: finalT } = await supabase.from('tenants').select('*', { count: 'exact', head: true })
  const { count: finalI } = await supabase.from('investors').select('*', { count: 'exact', head: true })

  console.log('\n=== Final Report ===')
  console.log(`investors: ${investorInserts.length} inserted (DB total: ${finalI})`)
  console.log(`rooms:     ${roomsDone} inserted (DB total: ${finalR})`)
  console.log(`tenants:   ${tenantsDone} inserted (DB total: ${finalT})`)
  if (roomMissing.length) {
    console.log(`\nTenants with room_id=NULL (${roomMissing.length}):`)
    roomMissing.forEach(r => console.log(`  - ${r}`))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
