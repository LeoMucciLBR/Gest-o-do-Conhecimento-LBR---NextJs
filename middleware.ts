import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login']
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // PWA files that should be publicly accessible
  const isPWAFile = pathname === '/manifest.json' || 
                    pathname === '/sw.js' || 
                    pathname.startsWith('/icons/')
  
  // Allow public paths, PWA files, and API routes to pass through
  if (isPublicPath || isPWAFile || pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/images/')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('sid')

  if (!sessionCookie) {
    // No session cookie found - redirect to login
    const loginUrl = new URL('/login', request.url)
    // Store the original URL to redirect back after login
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session by calling our API
  try {
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        Cookie: `sid=${sessionCookie.value}`,
      },
    })

    if (!response.ok) {
      // Invalid session - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      
      // Clear invalid cookie
      const redirectResponse = NextResponse.redirect(loginUrl)
      redirectResponse.cookies.delete('sid')
      return redirectResponse
    }

    // Valid session - allow request to proceed
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware session validation error:', error)
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
