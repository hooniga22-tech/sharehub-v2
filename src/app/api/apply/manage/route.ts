import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const TABLE_MAP: Record<string, string> = {
  tour: 'tour_applications',
  cleaning: 'cleaning_applications',
  aircon: 'aircon_applications',
  checkout: 'checkout_applications',
  supplies: 'supplies_applications',
}

// PUT: update status
export async function PUT(req: Request) {
  try {
    const { type, id, status } = await req.json()
    const table = TABLE_MAP[type]
    if (!table) return NextResponse.json({ error: 'unknown type' }, { status: 400 })

    const supabase = createAdminClient()
    const update: Record<string, any> = {}
    if (status) update.status = status

    const { error } = await supabase.from(table).update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE: remove row
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    if (!type || !id) return NextResponse.json({ error: 'missing params' }, { status: 400 })

    const table = TABLE_MAP[type]
    if (!table) return NextResponse.json({ error: 'unknown type' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
