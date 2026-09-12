import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const protectedRoutes: Record<string, string> = {
  citizen: 'citizen',
  contractor: 'contractor',
  police: 'police',
  authority: 'authority',
};

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const locales = routing.locales as readonly string[];
  const hasLocale = locales.includes(segments[0] as any);
  const locale = hasLocale ? segments[0] : routing.defaultLocale;
  const firstSegment = hasLocale ? segments[1] : segments[0];

  if (firstSegment && protectedRoutes[firstSegment]) {
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('role')?.value;

    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    if (role !== protectedRoutes[firstSegment]) {
      return NextResponse.redirect(new URL(`/${locale}/${role}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};