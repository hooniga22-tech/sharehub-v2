import { NextResponse } from 'next/server'
import { generateMonthlyPayments, kstYearMonth } from '@/lib/generatePayments'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const yearMonth = kstYearMonth()
    const result = await generateMonthlyPayments(yearMonth, 'auto')
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
