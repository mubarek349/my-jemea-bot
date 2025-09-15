/**
 * @fileoverview Next.js middleware for authentication and security
 * @description Handles authentication, security headers, and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

/**
 * Security headers configuration
 */
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

/**
 * Rate limiting configuration
 */
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

/**
 * Check if request exceeds rate limit
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()??"unknown";
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Log request
  logger.info('Request received', {
    method: request.method,
    url: request.url,
    ip: clientIP,
    userAgent,
    action: 'http_request'
  });

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    logger.warn('Rate limit exceeded', {
      ip: clientIP,
      url: request.url,
      action: 'rate_limit_exceeded'
    });
    
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        ...securityHeaders
      }
    });
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Authentication for protected routes
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api');
  
  if (isProtectedRoute) {
    try {
      const session = await auth();
      
      if (!session?.user) {
        logger.warn('Unauthorized access attempt', {
          ip: clientIP,
          url: request.url,
          action: 'unauthorized_access'
        });
        
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check admin access for admin routes
      if (pathname.startsWith('/admin') && !(session.user as any)?.isAdmin) {
        logger.warn('Admin access denied', {
          ip: clientIP,
          userId: session.user.id,
          url: request.url,
          action: 'admin_access_denied'
        });
        
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Add user info to headers for API routes
      if (pathname.startsWith('/api')) {
        response.headers.set('x-user-id', session.user.id || '');
        response.headers.set('x-user-email', session.user.email || '');
        response.headers.set('x-user-admin', String((session.user as any)?.isAdmin || false));
      }
      
    } catch (error) {
      logger.error('Authentication error in middleware', {
        ip: clientIP,
        url: request.url,
        error: error instanceof Error ? error : new Error(String(error)),
        action: 'auth_error'
      });
      
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Log response time
  const duration = Date.now() - startTime;
  logger.performance('Request processed', duration, {
    method: request.method,
    url: request.url,
    ip: clientIP,
    action: 'http_request'
  });

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};