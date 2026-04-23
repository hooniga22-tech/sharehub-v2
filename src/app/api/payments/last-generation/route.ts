import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('payment_generation_logs')
      .select('year_month, executed_at, triggered_by, created_count, skipped_count, status')
      .order('executed_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ data: data || null })
  } catch (e: any) {
    return NextResponse.json({ data: null })
  }
}
