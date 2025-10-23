import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/setup')) {
    return NextResponse.next();
  }

  try {
    const setupCheck = await fetch(new URL('/api/setup', request.url), {
      method: 'GET',
      headers: request.headers,
    });
    
    const { needsSetup } = await setupCheck.json();

    if (needsSetup && !pathname.startsWith('/setup')) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    if (!needsSetup && pathname.startsWith('/setup')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/setup', '/api/'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication
  const session = await auth();

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    // Add callback URL to redirect back after login
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from root to dashboard
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect authenticated users from login to dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
