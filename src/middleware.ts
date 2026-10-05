import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Block common automated vulnerability scanner paths & malicious patterns
const BLOCKED_PATTERNS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/\.well-known\/(?!pki-validation)/i,
  /\/\.aws/i,
  /\/\.ssh/i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/phpmyadmin/i,
  /\/xmlrpc\.php/i,
  /\/cgi-bin/i,
  /\.(php|asp|aspx|jsp|cgi|pl|sh|bash|bat|exe|dll)$/i,
  /\/\.\./,          // Path traversal
  /%00/,             // Null byte injection
  /<script>/i        // Inline script injection in URI
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block malicious paths and automated vulnerability probes
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Access Denied (Security Rule Violation)', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // 2. Pass request with standard security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
