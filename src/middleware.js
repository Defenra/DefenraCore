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

  if (pathname === '/login' || pathname === '/setup' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
