import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value)
            })
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - /login (login page itself)
     * - /portal/* (public portal pages)
     * - /apply/* (public application forms)
     * - /api/apply/* (public apply APIs)
     * - /api/portal/* (portal APIs)
     * - /api/investor-portal/* (investor portal API)
     * - /api/tenant-portal/* (tenant portal API)
     * - /api/workers/by-token/* (worker portal API)
     * - /api/workers/portal/* (worker portal API)
     * - /api/tenants/portal/* (tenant portal API)
     * - /api/tenant-duty/* (tenant duty API)
     * - /api/house-guide/* (public house guide)
     * - /api/channeltalk/* (webhook)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /icon*, /apple-icon* (static files)
     */
    '/((?!login|portal|apply|api/apply|api/portal|api/investor-portal|api/tenant-portal|api/workers/by-token|api/workers/portal|api/tenants/portal|api/tenant-duty|api/house-guide|api/channeltalk|_next|favicon\\.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
}
