import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1. API Shared Secret for Telemetry Endpoint
  if (req.nextUrl.pathname.startsWith('/api/telemetry')) {
    const authHeader = req.headers.get('authorization')
    const secret = process.env.API_SECRET
    
    if (!secret) {
      console.error("API_SECRET environment variable is missing!")
      return new NextResponse(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }
    return NextResponse.next()
  }

  // 2. Ultra-Simple Dashboard Password (Basic Auth) for everything else
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')
    const expectedPassword = process.env.DASHBOARD_PASSWORD

    if (pwd === expectedPassword) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
    },
  })
}

export const config = {
  // Apply middleware to all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
