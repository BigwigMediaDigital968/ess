/**
 * Security Middleware — SonarQube / SOC-2 / ISMS hardening
 * Applied globally in index.js
 */

const rateLimit = require('express-rate-limit');

// ─── Security Headers (replaces helmet) ─────────────────────────────────────
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // CSP — restrictive but allows inline scripts needed for Vite
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob: https:; " +
        "connect-src 'self' wss: ws:; " +
        "frame-src 'none';"
    );
    // Remove fingerprinting header
    res.removeHeader('X-Powered-By');
    next();
};

// ─── CORS Configuration ───────────────────────────────────────────────────────
const corsOptions = {
    origin: (origin, callback) => {
        const allowed = [
            process.env.FRONTEND_URL,
            process.env.ALLOWED_ORIGINS,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://135.181.104.191:5173',
            'http://135.181.104.191',
            'https://135.181.104.191',
            'https://ess.bigwigmediadigital.com',
            'http://ess.bigwigmediadigital.com',
        ].filter(Boolean);

        // Allow same-origin and non-browser requests
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
};

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── Stricter Auth Limiter ────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again in 15 minutes.' },
    skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── Request ID (audit / trace) ───────────────────────────────────────────────
const { randomUUID } = require('crypto');
const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
};

// ─── Audit Logger ─────────────────────────────────────────────────────────────
const auditLogger = (req, res, next) => {
    const start = Date.now();
    const sensitiveRoutes = ['/auth', '/admin', '/servicedesk'];
    const shouldAudit = sensitiveRoutes.some(r => req.path.startsWith(r));

    if (shouldAudit) {
        res.on('finish', () => {
            const entry = {
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userId: req.user?.id || 'anonymous',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
                duration: `${Date.now() - start}ms`,
            };
            // SOC-2: structured audit log to stdout (captured by Docker logging driver)
            console.log(JSON.stringify({ type: 'AUDIT', ...entry }));
        });
    }
    next();
};

// ─── Input Sanitiser — strip null bytes / oversized payloads ─────────────────
const sanitiseInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitise = (obj) => {
            if (typeof obj === 'string') {
                return obj.replace(/\0/g, '').substring(0, 100000);
            }
            if (Array.isArray(obj)) return obj.map(sanitise);
            if (obj && typeof obj === 'object') {
                const clean = {};
                for (const [k, v] of Object.entries(obj)) {
                    clean[k.replace(/[^\w.-]/g, '')] = sanitise(v);
                }
                return clean;
            }
            return obj;
        };
        req.body = sanitise(req.body);
    }
    next();
};

// ─── Payload Size Guard ───────────────────────────────────────────────────────
const payloadGuard = (req, res, next) => {
    const limit = 10 * 1024 * 1024; // 10 MB
    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > limit) {
        return res.status(413).json({ error: 'Payload too large' });
    }
    next();
};

module.exports = {
    securityHeaders,
    corsOptions,
    globalLimiter,
    authLimiter,
    requestId,
    auditLogger,
    sanitiseInput,
    payloadGuard,
};
