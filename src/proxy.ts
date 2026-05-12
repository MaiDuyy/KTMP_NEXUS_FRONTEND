import { NextRequest, NextResponse } from 'next/server';

// Các path không cần login
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/auth',
  '/api/public',
  '/_next',
  '/favicon.ico',
];

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Handles site-wide redirects and auth checks at the edge.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Kiểm tra nếu là public path
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  // 2. Lấy token từ cookie (đồng bộ với API Gateway)
  const token = request.cookies.get('accessToken')?.value;

  // 3. Logic Redirect
  // Nếu chưa login mà vào trang private -> Redirect về login
  if (!token && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Lưu lại trang đang định vào để sau khi login thì quay lại
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Nếu đã login mà định vào login/register -> Redirect về home
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Cấu hình matcher
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
