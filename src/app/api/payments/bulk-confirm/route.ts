import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const confirmItems: { id: string; 납부액: number; 납부일: string }[] = body.items || []
    if (confirmItems.length === 0) return NextResponse.json({ error: 'no items' }, { status: 400 })

    const supabase = createAdminClient()
    let updated = 0

    for (const item of confirmItems) {
      const { error } = await supabase.from('monthly_payments').update({
        rent_paid: Number(item.납부액) || 0,
        rent_paid_date: item.납부일 || new Date().toISOString().slice(0, 10),
      }).eq('id', item.id)
      if (!error) updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
