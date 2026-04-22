/**
 * Seed initial data: branches, workers, issues
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/seed-initial-data.ts   # dry-run
 *   npx tsx scripts/seed-initial-data.ts               # actual insert
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { randomBytes } from 'crypto'
import { resolve } from 'path'

const DRY_RUN = process.env.DRY_RUN === '1'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }
const supabase = createClient(url, key)

// ── helpers ──
function readCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(resolve(__dirname, 'seed-data', filename), 'utf-8')
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true })
}

function buildMemo(parts: Record<string, string>): string | null {
  const lines: string[] = []
  for (const [k, v] of Object.entries(parts)) {
    if (v && v.trim()) lines.push(`[${k}] ${v.trim()}`)
  }
  return lines.length ? lines.join('\n') : null
}

// ── 1) branches ──
function prepareBranches() {
  const rows = readCsv('houses.csv')
  const branchMap = new Map<string, string>()
  const inserts = rows.map(r => {
    const id = randomUUID()
    const name = r.name.trim()
    branchMap.set(name, id)
    return {
      id,
      name,
      district: r.region?.trim() || null,
      address: r.address?.trim() || null,
      door_code: r.door_code?.trim() || null,
      memo: buildMemo({
        보일러: r.boiler_info || '',
        와이파이: r.wifi_info || '',
        쓰레기: r.garbage_info || '',
        공과금: r.utility_info || '',
      }),
    }
  })
  return { inserts, branchMap }
}

// ── 2) workers ──
const WORKERS_RAW = [
  { name: '김기진',       role_tags: ['수리'],       bank_account: '케이뱅크 100-197-580163',                         tax_type: 'applied',     phone: '010-2930-9801', status: 'active' },
  { name: '진진수',       role_tags: ['수리'],       bank_account: '국민 460210664883',                                tax_type: 'none',        phone: '010-2433-6613', status: 'active' },
  { name: '강욥(뽀드득)', role_tags: ['수리'],       bank_account: '신한 110-4655-55558',                              tax_type: 'tax_invoice', phone: null,            status: 'active' },
  { name: '이인실',       role_tags: ['쉐어','청소'], bank_account: '농협 100120-56-185140',                           tax_type: 'applied',     phone: '010-3285-3277', status: 'active' },
  { name: '이미경',       role_tags: ['쉐어','청소'], bank_account: '국민 830-21-0128-041',                            tax_type: 'applied',     phone: '010-6861-0923', status: 'active' },
  { name: '장숙정',       role_tags: ['쉐어','투어'], bank_account: '카카오뱅크 3333-19-2591605 (예금주: 김혜경)',       tax_type: 'none',        phone: '010-4086-3504', status: 'active' },
  { name: '이한나',       role_tags: ['청소'],       bank_account: '카카오뱅크 3333-0411-98645 (예금주: 이한나)',       tax_type: 'none',        phone: '010-3566-9257', status: 'active' },
]

function prepareWorkers() {
  const workerMap = new Map<string, string>()
  const inserts = WORKERS_RAW.map(w => {
    const id = randomUUID()
    workerMap.set(w.name, id)
    const taxLabel: Record<string, string> = { applied: '3.3% 적용', none: '미적용', tax_invoice: '세금계산서' }
    return {
      id,
      name: w.name,
      category: w.role_tags[0] || null,
      account_info: w.bank_account,
      phone: w.phone,
      is_active: w.status === 'active',
      access_token: 'w_' + randomBytes(32).toString('hex'),
      memo: `역할: ${w.role_tags.join(', ')} / 원천징수: ${taxLabel[w.tax_type] || w.tax_type}`,
    }
  })
  return { inserts, workerMap }
}

// ── 3) issues ──
function prepareIssues(branchMap: Map<string, string>, workerMap: Map<string, string>) {
  const rows = readCsv('schedules-2026.csv')
  const branchMissing = new Set<string>()
  const workerMissing = new Set<string>()

  const inserts = rows.map(r => {
    const id = randomUUID()
    const primaryBranch = (r.primary_branch || '').trim()
    const secondaryBranch = (r.secondary_branch || '').trim()
    const workerName = (r.worker_name || '').trim()

    let branchId: string | null = null
    if (primaryBranch) {
      branchId = branchMap.get(primaryBranch) || null
      if (!branchId) branchMissing.add(primaryBranch)
    }

    let workerId: string | null = null
    if (workerName) {
      workerId = workerMap.get(workerName) || null
      if (!workerId) workerMissing.add(workerName)
    }

    // scheduled_date: trim to date portion (YYYY-MM-DD)
    let scheduledDate: string | null = (r.scheduled_date || '').trim()
    if (scheduledDate.length > 10) scheduledDate = scheduledDate.slice(0, 10)
    if (!scheduledDate) scheduledDate = null

    // memo: prepend secondary_branch info if exists
    const memoBase = (r.memo || '').trim()
    let memo: string | null = null
    if (secondaryBranch && memoBase) {
      memo = `→ ${secondaryBranch} / ${memoBase}`
    } else if (secondaryBranch) {
      memo = `→ ${secondaryBranch}`
    } else if (memoBase) {
      memo = memoBase
    }

    return {
      id,
      title: (r.title || '').trim(),
      category: (r.category || '').trim() || null,
      scheduled_date: scheduledDate,
      cost: parseInt(r.cost) || null,
      memo,
      branch_id: branchId,
      worker_id: workerId,
      status: 'pending' as const,
      payment_status: 'unpaid' as const,
    }
  })

  return { inserts, branchMissing: [...branchMissing], workerMissing: [...workerMissing] }
}

// ── main ──
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE INSERT ===')
  console.log()

  // Check existing data
  const { count: branchCount } = await supabase.from('branches').select('*', { count: 'exact', head: true })
  const { count: workerCount } = await supabase.from('workers').select('*', { count: 'exact', head: true })
  const { count: issueCount } = await supabase.from('issues').select('*', { count: 'exact', head: true })
  console.log(`Current DB: branches=${branchCount}, workers=${workerCount}, issues=${issueCount}`)
  console.log()

  // Load existing branches and workers to avoid duplicates
  const { data: existingBranches } = await supabase.from('branches').select('id, name')
  const existingBranchMap = new Map<string, string>()
  for (const b of existingBranches || []) existingBranchMap.set(b.name, b.id)

  const { data: existingWorkers } = await supabase.from('workers').select('id, name')
  const existingWorkerMap = new Map<string, string>()
  for (const w of existingWorkers || []) existingWorkerMap.set(w.name, w.id)

  // Prepare branches (skip existing)
  const { inserts: allBranchInserts, branchMap: csvBranchMap } = prepareBranches()
  // Merge: use existing IDs where name matches, only insert new ones
  const branchMap = new Map<string, string>([...existingBranchMap])
  const branchInserts = allBranchInserts.filter(b => {
    if (existingBranchMap.has(b.name)) {
      // Already exists, use existing ID in the map
      return false
    }
    branchMap.set(b.name, b.id)
    return true
  })

  // Prepare workers (skip existing)
  const { inserts: allWorkerInserts, workerMap: csvWorkerMap } = prepareWorkers()
  const workerMap = new Map<string, string>([...existingWorkerMap])
  const workerInserts = allWorkerInserts.filter(w => {
    if (existingWorkerMap.has(w.name)) {
      return false
    }
    workerMap.set(w.name, w.id)
    return true
  })
  const { inserts: issueInserts, branchMissing, workerMissing } = prepareIssues(branchMap, workerMap)

  console.log('--- Dry-run Report ---')
  console.log(`branches: ${branchInserts.length} new + ${existingBranchMap.size} existing = ${branchMap.size} total`)
  console.log(`workers:  ${workerInserts.length} new + ${existingWorkerMap.size} existing = ${workerMap.size} total`)
  console.log(`issues:   ${issueInserts.length} rows to insert`)
  console.log()

  if (branchMissing.length) {
    console.log(`Branch matching failures (${branchMissing.length}):`)
    branchMissing.forEach(b => console.log(`  - "${b}"`))
  } else {
    console.log('Branch matching: all OK')
  }

  if (workerMissing.length) {
    console.log(`Worker matching failures (${workerMissing.length}):`)
    workerMissing.forEach(w => console.log(`  - "${w}"`))
  } else {
    console.log('Worker matching: all OK')
  }
  console.log()

  // Issue titles with missing branches
  const issuesWithMissingBranch = issueInserts.filter(i => !i.branch_id && i.title)
  if (issuesWithMissingBranch.length) {
    console.log(`Issues with unmatched branch (${issuesWithMissingBranch.length}):`)
    issuesWithMissingBranch.slice(0, 10).forEach(i => console.log(`  - "${i.title}"`))
    if (issuesWithMissingBranch.length > 10) console.log(`  ... and ${issuesWithMissingBranch.length - 10} more`)
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. Set DRY_RUN=0 or remove DRY_RUN to insert.')
    return
  }

  // ── Insert branches ──
  console.log('\nInserting branches...')
  const { error: bErr } = await supabase.from('branches').insert(branchInserts)
  if (bErr) {
    console.error('Branch insert failed:', bErr.message)
    process.exit(1)
  }
  console.log(`  branches: ${branchInserts.length} inserted`)

  // ── Insert workers ──
  console.log('Inserting workers...')
  const { error: wErr } = await supabase.from('workers').insert(workerInserts)
  if (wErr) {
    console.error('Worker insert failed:', wErr.message)
    // Rollback branches
    console.log('Rolling back branches...')
    const branchIds = branchInserts.map(b => b.id)
    await supabase.from('branches').delete().in('id', branchIds)
    process.exit(1)
  }
  console.log(`  workers: ${workerInserts.length} inserted`)

  // ── Insert issues (in batches of 100) ──
  console.log('Inserting issues...')
  let issuesDone = 0
  const BATCH = 100
  for (let i = 0; i < issueInserts.length; i += BATCH) {
    const batch = issueInserts.slice(i, i + BATCH)
    const { error: iErr } = await supabase.from('issues').insert(batch)
    if (iErr) {
      console.error(`Issue insert failed at batch ${i}:`, iErr.message)
      // Rollback
      console.log('Rolling back all inserted data...')
      const insertedIssueIds = issueInserts.slice(0, i).map(x => x.id)
      if (insertedIssueIds.length) await supabase.from('issues').delete().in('id', insertedIssueIds)
      await supabase.from('workers').delete().in('id', workerInserts.map(w => w.id))
      await supabase.from('branches').delete().in('id', branchInserts.map(b => b.id))
      process.exit(1)
    }
    issuesDone += batch.length
  }
  console.log(`  issues: ${issuesDone} inserted`)

  // ── Final report ──
  console.log('\n=== Final Report ===')
  console.log(`branches: ${branchInserts.length}`)
  console.log(`workers:  ${workerInserts.length}`)
  console.log(`issues:   ${issuesDone}`)
  if (branchMissing.length) console.log(`Branch match failures: ${branchMissing.join(', ')}`)
  if (workerMissing.length) console.log(`Worker match failures: ${workerMissing.join(', ')}`)
}

main().catch(e => { console.error(e); process.exit(1) })
