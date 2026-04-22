import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()
    const update: Record<string, any> = {}
    if (body.status !== undefined) update.status = body.status
    if (body.status === '처리완료') update.delivery_date = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('supplies_applications').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
