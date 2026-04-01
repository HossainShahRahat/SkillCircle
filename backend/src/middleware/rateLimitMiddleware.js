const buckets = new Map();

function tooManyRequests(message) {
  const error = new Error(message);
  error.status = 429;
  return error;
}

export function createRateLimiter({ windowMs, max, keyPrefix, message }) {
  return (req, _res, next) => {
    const identity = req.user?.id || req.ip || 'anonymous';
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      return next(tooManyRequests(message));
    }

    return next();
  };
}
