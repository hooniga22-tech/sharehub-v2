/**
 * Seed monthly_payments, expenses, closed branches into Supabase.
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/seed-payments-expenses-2026.ts
 *   npx tsx scripts/seed-payments-expenses-2026.ts
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
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

function num(v: string | undefined): number {
  if (!v || !v.trim()) return 0
  const n = Number(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

/** Strip platform tags like (엔코), (우주), (앤코), (맘스테이) from tenant name */
function stripPlatformTag(name: string): string {
  return name.replace(/^\([^)]+\)/, '').replace(/\([^)]+\)$/, '').trim()
}

// ── 1) Closed branches ──
function prepareClosedBranches(existingNames: Set<string>) {
  const rows = readCsv('closed_branches.csv')
  const inserts = rows
    .filter(r => !existingNames.has(r.name.trim()))
    .map(r => ({
      id: randomUUID(),
      name: r.name.trim(),
      district: r.region?.trim() || null,
      is_active: false,
      memo: r.note?.trim() || null,
    }))
  return inserts
}

// ── 2) Monthly payments (merge rent + maintenance) ──
function preparePayments(
  branchMap: Map<string, string>,
  roomMap: Map<string, string>,
  tenantMap: Map<string, string>,
) {
  const rows = readCsv('payments-2026-q1h.csv')

  // Group by merge key
  type MergeVal = { rent: number; maint: number; scheduledDate: string; memo: string; daysOccupied: string; daysInMonth: string }
  const merged = new Map<string, MergeVal & { branchName: string; roomCode: string; tenantName: string; year: string; month: string }>()

  for (const r of rows) {
    const key = `${r.branch_name}::${r.room_code}::${r.tenant_name}::${r.year}::${r.month}`
    if (!merged.has(key)) {
      merged.set(key, {
        branchName: r.branch_name.trim(),
        roomCode: r.room_code.trim(),
        tenantName: r.tenant_name.trim(),
        year: r.year.trim(),
        month: r.month.trim(),
        scheduledDate: r.scheduled_date?.trim() || '',
        memo: '',
        daysOccupied: r.days_occupied || '',
        daysInMonth: r.days_in_month || '',
        rent: 0,
        maint: 0,
      })
    }
    const entry = merged.get(key)!
    if (r.category === 'rent') entry.rent = num(r.amount)
    else if (r.category === 'maintenance') entry.maint = num(r.amount)
    if (r.memo?.trim()) entry.memo = r.memo.trim()
  }

  const branchMissing = new Set<string>()
  const roomMissing = new Set<string>()
  let tenantMatch1 = 0, tenantMatch2 = 0, tenantFail = 0

  const inserts = [...merged.values()].map(e => {
    const branchId = branchMap.get(e.branchName) || null
    if (e.branchName && !branchId) branchMissing.add(e.branchName)

    const roomKey = `${e.branchName}::${e.roomCode}`
    const roomId = roomMap.get(roomKey) || null
    if (e.roomCode && !roomId) roomMissing.add(roomKey)

    // Tenant matching: 1st exact, 2nd stripped
    let tenantId = tenantMap.get(e.tenantName) || null
    if (tenantId) {
      tenantMatch1++
    } else {
      const stripped = stripPlatformTag(e.tenantName)
      tenantId = tenantMap.get(stripped) || null
      if (tenantId) {
        tenantMatch2++
      } else {
        tenantFail++
      }
    }

    const ym = `${e.year}-${String(e.month).padStart(2, '0')}`
    const isProrated = e.daysOccupied && e.daysInMonth && e.daysOccupied !== e.daysInMonth

    const memoLines: string[] = []
    if (!tenantId && e.tenantName) memoLines.push(`입주자: ${e.tenantName}`)
    if (e.memo && e.memo !== e.tenantName) memoLines.push(e.memo)
    if (isProrated) memoLines.push(`일할: ${e.daysOccupied}/${e.daysInMonth}일`)

    return {
      id: randomUUID(),
      tenant_id: tenantId,
      year_month: ym,
      rent_billed: e.rent,
      rent_paid: e.rent,
      rent_paid_date: e.scheduledDate.slice(0, 10) || null,
      maintenance_billed: e.maint,
      maintenance_paid: e.maint,
      maintenance_paid_date: e.scheduledDate.slice(0, 10) || null,
      is_prorated: !!isProrated,
      proration_reason: isProrated ? `${e.daysOccupied}/${e.daysInMonth}일` : null,
      memo: memoLines.length ? memoLines.join(' / ') : null,
    }
  })

  return {
    inserts,
    stats: { branchMissing: [...branchMissing], roomMissing: [...roomMissing], tenantMatch1, tenantMatch2, tenantFail },
  }
}

// ── 3) Expenses ──
function prepareExpenses(branchMap: Map<string, string>, catMap: Map<string, string>) {
  const rows = readCsv('expenses-2026-q1h.csv')
  const csvToCatCode: Record<string, string> = {
    landlord_rent: 'rent',
    electricity: 'electricity',
    gas: 'gas',
    water: 'water',
    internet: 'internet',
    water_purifier: 'water_purifier',
    building_maintenance: 'building_maintenance',
    misc_bundle: 'other',
    etc: 'other',
  }

  const branchMissing = new Set<string>()
  const catMissing = new Set<string>()

  const inserts = rows.map(r => {
    const branchName = r.branch_name.trim()
    const branchId = branchMap.get(branchName) || null
    if (branchName && !branchId) branchMissing.add(branchName)

    const csvCat = r.category.trim()
    const catCode = csvToCatCode[csvCat] || 'other'
    const catId = catMap.get(catCode) || null
    if (!catId) catMissing.add(csvCat)

    const ym = `${r.year}-${String(r.month).padStart(2, '0')}`
    const memoLines: string[] = []
    if (csvCat === 'misc_bundle') memoLines.push('청소/수리/쿠팡 묶음 - 5월부터 분리 예정')
    if (csvCat === 'etc' && r.gubun_raw?.trim()) memoLines.push(r.gubun_raw.trim())
    if (r.info?.trim()) memoLines.push(r.info.trim())

    return {
      id: randomUUID(),
      branch_id: branchId || '',
      category_id: catId || '',
      category_free_text: r.gubun_raw?.trim() || csvCat,
      year_month: ym,
      amount: num(r.amount),
      paid_date: r.scheduled_date?.trim().slice(0, 10) || null,
      memo: memoLines.length ? memoLines.join(' / ') : null,
    }
  }).filter(r => r.branch_id && r.category_id)

  return { inserts, branchMissing: [...branchMissing], catMissing: [...catMissing] }
}

// ── Main ──
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE INSERT ===')
  console.log()

  // Current counts
  const { count: mpCount } = await supabase.from('monthly_payments').select('*', { count: 'exact', head: true })
  const { count: expCount } = await supabase.from('expenses').select('*', { count: 'exact', head: true })
  console.log(`Current DB: monthly_payments=${mpCount}, expenses=${expCount}`)

  // Load lookups
  const { data: branches } = await supabase.from('branches').select('id, name')
  const branchMap = new Map<string, string>()
  const existingBranchNames = new Set<string>()
  for (const b of branches || []) { branchMap.set(b.name, b.id); existingBranchNames.add(b.name) }
  console.log(`Loaded ${branchMap.size} branches`)

  const { data: rooms } = await supabase.from('rooms').select('id, room_code, branch_id, branches(name)')
  const roomMap = new Map<string, string>()
  for (const r of rooms || []) {
    const bname = (r as any).branches?.name || ''
    if (bname && r.room_code) roomMap.set(`${bname}::${r.room_code}`, r.id)
  }
  console.log(`Loaded ${roomMap.size} rooms`)

  const { data: tenants } = await supabase.from('tenants').select('id, name')
  const tenantMap = new Map<string, string>()
  for (const t of tenants || []) tenantMap.set(t.name, t.id)
  console.log(`Loaded ${tenantMap.size} tenants`)

  const { data: cats } = await supabase.from('expense_categories').select('id, code')
  const catMap = new Map<string, string>()
  for (const c of cats || []) catMap.set(c.code, c.id)
  console.log(`Loaded ${catMap.size} expense categories`)
  console.log()

  // Prepare
  const closedInserts = prepareClosedBranches(existingBranchNames)
  // Add closed branches to branchMap for expense matching
  for (const cb of closedInserts) branchMap.set(cb.name, cb.id)

  const { inserts: payInserts, stats: payStats } = preparePayments(branchMap, roomMap, tenantMap)
  const { inserts: expInserts, branchMissing: expBranchMissing, catMissing: expCatMissing } = prepareExpenses(branchMap, catMap)

  console.log('--- Report ---')
  console.log(`closed branches: ${closedInserts.length} to insert`)
  console.log(`monthly_payments: ${payInserts.length} to insert (merged from CSV 2011 rows)`)
  console.log(`expenses: ${expInserts.length} to insert`)
  console.log()

  // Payment matching
  console.log('Payment matching:')
  console.log(`  branch fail: ${payStats.branchMissing.length}`, payStats.branchMissing.length ? payStats.branchMissing : '')
  console.log(`  room fail: ${payStats.roomMissing.length}`)
  console.log(`  tenant 1st match: ${payStats.tenantMatch1}`)
  console.log(`  tenant 2nd match (stripped): ${payStats.tenantMatch2}`)
  console.log(`  tenant fail: ${payStats.tenantFail}`)
  console.log()

  // Expense matching
  if (expBranchMissing.length) console.log('Expense branch fail:', expBranchMissing)
  if (expCatMissing.length) console.log('Expense category fail:', expCatMissing)

  // Monthly totals verification
  console.log('\n--- Monthly Totals (verification) ---')
  const revByMonth = new Map<string, number>()
  for (const p of payInserts) {
    const total = p.rent_billed + p.maintenance_billed
    revByMonth.set(p.year_month, (revByMonth.get(p.year_month) || 0) + total)
  }
  const expByMonth = new Map<string, number>()
  for (const e of expInserts) {
    expByMonth.set(e.year_month, (expByMonth.get(e.year_month) || 0) + e.amount)
  }
  for (const ym of ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05']) {
    console.log(`${ym}: revenue=${(revByMonth.get(ym) || 0).toLocaleString()} / expense=${(expByMonth.get(ym) || 0).toLocaleString()}`)
  }
  console.log()

  if (DRY_RUN) {
    console.log('Dry run complete.')
    return
  }

  // ── INSERT ──

  // 1) Closed branches
  if (closedInserts.length) {
    console.log('Inserting closed branches...')
    const { error } = await supabase.from('branches').insert(closedInserts)
    if (error) { console.error('Branch insert failed:', error.message); process.exit(1) }
    console.log(`  branches: ${closedInserts.length} inserted`)
  }

  // 2) Monthly payments (batch 200)
  console.log('Inserting monthly_payments...')
  let payDone = 0
  const PAY_BATCH = 200
  for (let i = 0; i < payInserts.length; i += PAY_BATCH) {
    const batch = payInserts.slice(i, i + PAY_BATCH)
    const { error } = await supabase.from('monthly_payments').insert(batch)
    if (error) {
      console.error(`Payment insert failed at batch ${i}:`, error.message)
      // Rollback
      const ids = payInserts.slice(0, i).map(p => p.id)
      if (ids.length) await supabase.from('monthly_payments').delete().in('id', ids)
      if (closedInserts.length) await supabase.from('branches').delete().in('id', closedInserts.map(b => b.id))
      process.exit(1)
    }
    payDone += batch.length
  }
  console.log(`  monthly_payments: ${payDone} inserted`)

  // 3) Expenses (batch 200)
  console.log('Inserting expenses...')
  let expDone = 0
  const EXP_BATCH = 200
  for (let i = 0; i < expInserts.length; i += EXP_BATCH) {
    const batch = expInserts.slice(i, i + EXP_BATCH)
    const { error } = await supabase.from('expenses').insert(batch)
    if (error) {
      console.error(`Expense insert failed at batch ${i}:`, error.message)
      // Rollback
      const ids = expInserts.slice(0, i).map(e => e.id)
      if (ids.length) await supabase.from('expenses').delete().in('id', ids)
      await supabase.from('monthly_payments').delete().in('id', payInserts.map(p => p.id))
      if (closedInserts.length) await supabase.from('branches').delete().in('id', closedInserts.map(b => b.id))
      process.exit(1)
    }
    expDone += batch.length
  }
  console.log(`  expenses: ${expDone} inserted`)

  // Verify
  const { count: finalMp } = await supabase.from('monthly_payments').select('*', { count: 'exact', head: true })
  const { count: finalExp } = await supabase.from('expenses').select('*', { count: 'exact', head: true })
  const { count: finalBr } = await supabase.from('branches').select('*', { count: 'exact', head: true })

  console.log('\n=== Final Report ===')
  console.log(`branches: ${finalBr} (added ${closedInserts.length} closed)`)
  console.log(`monthly_payments: ${finalMp}`)
  console.log(`expenses: ${finalExp}`)
}

main().catch(e => { console.error(e); process.exit(1) })
