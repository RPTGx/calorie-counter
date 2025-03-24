import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Check auth condition
  if (session) {
    // If the user is signed in and tries to access auth pages, redirect to dashboard
    if (request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } else {
    // If the user is not signed in and tries to access protected pages, redirect to login
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*', '/onboarding']
} 