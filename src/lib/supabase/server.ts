// ─── Server-only Supabase Admin Client ───
// 이 파일은 서버 전용입니다. 절대 'use client' 컴포넌트에서 import하지 마세요.
// Service Role Key를 사용하며 RLS를 우회합니다.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
