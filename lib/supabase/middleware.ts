import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session cookie if needed.
  // Do NOT remove this — it keeps sessions alive.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Read role from JWT user_metadata — no DB query needed, no RLS recursion possible.
  // This is safe because user_metadata is signed by Supabase and cannot be spoofed.
  const role = user?.user_metadata?.role as string | undefined

  // ── Unauthenticated: redirect to /login ────────────────────────────────────
  if (!user) {
    if (
      pathname.startsWith('/employee') ||
      pathname.startsWith('/manager')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Let /login and /signup through as-is
    return supabaseResponse
  }

  // ── Authenticated on auth pages: redirect to their dashboard ──────────────
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Role guard: employee trying to reach /manager/* ───────────────────────
  if (pathname.startsWith('/manager') && role !== 'manager') {
    const url = request.nextUrl.clone()
    url.pathname = '/employee/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Role guard: manager trying to reach /employee/* ───────────────────────
  if (pathname.startsWith('/employee') && role === 'manager') {
    const url = request.nextUrl.clone()
    url.pathname = '/manager/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
