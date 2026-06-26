import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    
    // Renamed to plural to match its array type
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://algotrack-seven.vercel.app', // Note: removed trailing slash to match standard origin format
    ];

    // Check if the current origin is allowed
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // Handle Preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const preflightHeaders = {
        // Return the specific origin if allowed, otherwise an empty string or omit it
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
      };
      return new NextResponse(null, { status: 200, headers: preflightHeaders });
    }

    // Prepare a base response for standard API requests
    let apiResponse = NextResponse.next({ request });
    if (isAllowedOrigin) {
      apiResponse.headers.set('Access-Control-Allow-Origin', origin);
      apiResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      apiResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      apiResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return apiResponse;
  }

  // 2. Existing Supabase Session and Page Protection Logic
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard and /problems pages
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/problems'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// 3. Updated matcher config to capture API endpoints along with protected page assets
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/problems/:path*',
    '/api/:path*'
  ],
};