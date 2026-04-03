import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
    localeDetection: false
});

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Skip i18n redirect for static assets (videos, audio, etc.)
    if (pathname.startsWith('/videos/') || pathname.endsWith('.mp4') || pathname.endsWith('.webm')) {
        return NextResponse.next();
    }
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        '/',
        '/(zh|en)/:path*',
        '/((?!api|m|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico).*)'
    ]
};
