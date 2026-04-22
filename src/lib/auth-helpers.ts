import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-client'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Require an authenticated admin user (Supabase Auth session via cookie).
 * Call at the top of any admin API route handler.
 * Returns the authenticated user or a 401 NextResponse.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string }; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
    }
    return { user: { id: user.id, email: user.email } }
  } catch {
    return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
}

/**
 * Require a valid portal token for the given role.
 * Returns the matched record or a 401 NextResponse.
 */
export async function requirePortalToken(
  token: string | null | undefined,
  role: 'investor' | 'worker' | 'tenant',
): Promise<
  | { record: any; error?: undefined }
  | { record?: undefined; error: NextResponse }
> {
  if (!token) {
    return { error: NextResponse.json({ error: 'token required' }, { status: 401 }) }
  }

  const tableMap = { investor: 'investors', worker: 'workers', tenant: 'tenants' } as const
  const table = tableMap[role]
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('access_token', token)
    .single()

  if (error || !data) {
    return { error: NextResponse.json({ error: 'invalid token' }, { status: 401 }) }
  }

  return { record: data }
}
