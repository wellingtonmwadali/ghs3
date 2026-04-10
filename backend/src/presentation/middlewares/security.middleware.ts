import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiter for login endpoint - stricter limit
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter for registration endpoint
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Input sanitization middleware to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters and scripts
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

// Validate MongoDB ObjectId format
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Validate geolocation coordinates
export const validateGeolocation = (req: Request, res: Response, next: NextFunction) => {
  const location = req.body.location;
  
  if (!location) {
    return res.status(400).json({
      success: false,
      message: 'Geolocation is required. Please enable location services.'
    });
  }
  
  const { latitude, longitude } = location;
  
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Invalid geolocation format. Latitude and longitude must be numbers.'
    });
  }
  
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid geolocation coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
    });
  }
  
  next();
};

// Security headers middleware (additional to helmet)
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature Policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  
  next();
};

// IP-based request tracking for suspicious activity detection
const requestTracker = new Map<string, { count: number; firstRequest: number; suspicious: boolean }>();

export const trackSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const timeWindow = 60000; // 1 minute
  const suspiciousThreshold = 500; // 500 requests per minute
  
  if (!requestTracker.has(ip)) {
    requestTracker.set(ip, { count: 1, firstRequest: now, suspicious: false });
  } else {
    const tracker = requestTracker.get(ip)!;
    
    // Reset if time window passed
    if (now - tracker.firstRequest > timeWindow) {
      tracker.count = 1;
      tracker.firstRequest = now;
      tracker.suspicious = false;
    } else {
      tracker.count++;
      
      if (tracker.count > suspiciousThreshold) {
        tracker.suspicious = true;
        console.warn(`⚠️ Suspicious activity detected from IP: ${ip} - ${tracker.count} requests in 1 minute`);
        
        return res.status(429).json({
          success: false,
          message: 'Suspicious activity detected. Access temporarily blocked.'
        });
      }
    }
  }
  
  next();
};

// Clean up old tracking data periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const cleanupThreshold = 300000; // 5 minutes
  
  for (const [ip, tracker] of requestTracker.entries()) {
    if (now - tracker.firstRequest > cleanupThreshold) {
      requestTracker.delete(ip);
    }
  }
}, 300000);
