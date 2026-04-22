import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectHost = url.replace('https://', '').split('.')[0]

    return NextResponse.json({
      ok: true,
      projectHost,
      userCount: data.users.length,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
