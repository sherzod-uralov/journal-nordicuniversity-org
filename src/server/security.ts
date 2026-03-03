import type { RequestHandler } from 'express';

export function securityHeaders(apiUrl = 'https://journal2.nordicun.uz'): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' ${apiUrl} data:`,
      `connect-src 'self' ${apiUrl}`,
      `frame-src 'self' ${apiUrl}`,
      `object-src 'self' ${apiUrl}`,
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
    next();
  };
}
