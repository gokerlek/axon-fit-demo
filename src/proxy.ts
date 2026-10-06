import { NextResponse, type NextRequest } from 'next/server';

/** Public demo deployment: only the browser-backed sample app is reachable. */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/demo' || path === '/demo/') return NextResponse.next();
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'Bu dağıtım yalnız yerel veri demosudur.' }, { status: 404 });
  }
  return NextResponse.redirect(new URL('/demo', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|woff2)$).*)'],
};
