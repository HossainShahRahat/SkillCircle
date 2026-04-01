import { config } from '../config.js';

export function applySecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  if (config.forceHttps && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  return next();
}
