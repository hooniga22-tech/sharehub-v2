import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { generateMonthlyPayments, kstYearMonth } from '@/lib/generatePayments'

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json().catch(() => ({}))
    const yearMonth = body.year_month || kstYearMonth()

    const result = await generateMonthlyPayments(yearMonth, 'manual', auth.user.email)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
