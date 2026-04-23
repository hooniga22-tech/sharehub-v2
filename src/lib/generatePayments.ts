import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { randomUUID } from 'crypto'

type TriggerType = 'auto' | 'manual' | 'tenant_create'

interface GenerateResult {
  created: number
  skipped: number
  total: number
  logId: string
}

/**
 * Generate monthly payment records for active tenants.
 * - If tenantIds is provided, only those tenants are processed.
 * - If tenantIds is omitted, all active tenants are processed.
 * - Existing records for the same tenant+yearMonth are skipped.
 * - Execution is logged to payment_generation_logs.
 */
export async function generateMonthlyPayments(
  yearMonth: string,
  triggeredBy: TriggerType,
  executedBy?: string,
  tenantIds?: string[],
): Promise<GenerateResult> {
  const supabase = createAdminClient()
  const logId = randomUUID()

  try {
    // 1. Get active tenants
    let tenantQuery = supabase
      .from('tenants')
      .select('id, monthly_rent, maintenance_fee')
      .eq('status', 'active')

    if (tenantIds && tenantIds.length > 0) {
      tenantQuery = tenantQuery.in('id', tenantIds)
    }

    const activeTenants = await listOrEmpty<{
      id: string
      monthly_rent: number | null
      maintenance_fee: number | null
    }>(tenantQuery)

    const total = activeTenants.length
    if (total === 0) {
      await insertLog(supabase, {
        id: logId, year_month: yearMonth, triggered_by: triggeredBy,
        created_count: 0, skipped_count: 0, total_active_tenants: 0,
        status: 'success', executed_by: executedBy || null,
      })
      return { created: 0, skipped: 0, total: 0, logId }
    }

    // 2. Check existing records
    const existingRows = await listOrEmpty<{ tenant_id: string }>(
      supabase
        .from('monthly_payments')
        .select('tenant_id')
        .eq('year_month', yearMonth)
        .in('tenant_id', activeTenants.map(t => t.id))
    )
    const existingSet = new Set(existingRows.map(r => r.tenant_id))

    // 3. Build insert batch
    const toInsert = activeTenants
      .filter(t => !existingSet.has(t.id))
      .map(t => ({
        id: randomUUID(),
        tenant_id: t.id,
        year_month: yearMonth,
        rent_billed: t.monthly_rent || 0,
        maintenance_billed: t.maintenance_fee || 0,
        rent_paid: 0,
        maintenance_paid: 0,
      }))

    const skipped = existingSet.size
    let created = 0

    // 4. Batch insert (200 per batch)
    const BATCH = 200
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH)
      const { error } = await supabase.from('monthly_payments').insert(batch)
      if (error) {
        // Partial failure: log and throw
        await insertLog(supabase, {
          id: logId, year_month: yearMonth, triggered_by: triggeredBy,
          created_count: created, skipped_count: skipped, total_active_tenants: total,
          status: 'partial', error_message: error.message, executed_by: executedBy || null,
        })
        throw new Error(`Insert failed at batch ${i}: ${error.message}`)
      }
      created += batch.length
    }

    // 5. Log success
    await insertLog(supabase, {
      id: logId, year_month: yearMonth, triggered_by: triggeredBy,
      created_count: created, skipped_count: skipped, total_active_tenants: total,
      status: 'success', executed_by: executedBy || null,
    })

    return { created, skipped, total, logId }
  } catch (e: any) {
    // If not already logged (partial), log as failed
    const { data: existing } = await supabase
      .from('payment_generation_logs')
      .select('id')
      .eq('id', logId)
      .single()

    if (!existing) {
      await insertLog(supabase, {
        id: logId, year_month: yearMonth, triggered_by: triggeredBy,
        created_count: 0, skipped_count: 0, total_active_tenants: 0,
        status: 'failed', error_message: e.message, executed_by: executedBy || null,
      })
    }
    throw e
  }
}

async function insertLog(supabase: any, data: {
  id: string
  year_month: string
  triggered_by: string
  created_count: number
  skipped_count: number
  total_active_tenants: number
  status: string
  error_message?: string
  executed_by: string | null
}) {
  await supabase.from('payment_generation_logs').insert(data)
}

/** Get current year-month in KST (e.g. "2026-06") */
export function kstYearMonth(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
}
