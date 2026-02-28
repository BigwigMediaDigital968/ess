const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { Redis } = require('ioredis');

dotenv.config();

const {
    securityHeaders,
    corsOptions,
    globalLimiter,
    authLimiter,
    requestId,
    auditLogger,
    sanitiseInput,
    payloadGuard,
} = require('./middleware/securityMiddleware');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS,
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});

app.set('io', io);

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3434;

// ── Security middleware stack ─────────────────────────────────────────────────
app.use(requestId);          // Attach X-Request-ID to every request
app.use(securityHeaders);    // OWASP / SOC-2 security headers
app.use(cors(corsOptions));  // Strict, origin-allowlist CORS
app.use(globalLimiter);      // Global rate limiter
app.use(auditLogger);        // SOC-2 structured audit log
app.use(payloadGuard);       // Reject oversized payloads early
app.use(express.json({ limit: '10mb' }));
app.use(sanitiseInput);      // Strip null bytes & unsafe key chars
app.use('/uploads', express.static('uploads'));

// ── Redis Session Setup ───────────────────────────────────────────────────────
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redisClient.on('error', (err) => console.error('[Redis Client] Error:', err));
redisClient.on('connect', () => console.log('[Redis Client] Connected successfully'));

app.use(
    session({
        store: new RedisStore({ client: redisClient, prefix: 'ess:sess:' }),
        secret: process.env.SESSION_SECRET || 'dev_secret_fallback_replace_in_prod',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // lax for OIDC
        }
    })
);

// Socket.io Logic
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on("send_message", async (data) => {
        // data: { conversationId, senderId, content, type, fileUrl }
        try {
            const newMessage = await prisma.message.create({
                data: {
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                    content: data.content,
                    type: data.type || 'TEXT',
                    fileUrl: data.fileUrl,
                },
                include: { sender: true }
            });

            // Emit to everyone in the room including sender (or excluding sender if verified locally)
            io.to(data.conversationId).emit("receive_message", newMessage);
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authLimiter, authRoutes); // tighter rate-limit on auth
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/wfh', require('./routes/wfhRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/organization', require('./routes/organizationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/chat', chatRoutes);
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/talent', require('./routes/talentRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/appraisal', require('./routes/appraisalRoutes'));
app.use('/api/roster', require('./routes/rosterRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/offices', require('./routes/officeRoutes'));
app.use('/api/office-visits', require('./routes/officeVisitRoutes'));
app.use('/api/offboarding', require('./routes/offboardingRoutes'));

// Service Desk / ITSM routes
app.use('/api/servicedesk/tickets', require('./routes/ticketRoutes'));
app.use('/api/servicedesk/changes', require('./routes/changeRoutes'));
app.use('/api/servicedesk/problems', require('./routes/problemRoutes'));
app.use('/api/servicedesk/cmdb', require('./routes/cmdbRoutes'));
app.use('/api/servicedesk/kedb', require('./routes/kedbRoutes'));
app.use('/api/servicedesk/sla', require('./routes/slaRoutes'));
app.use('/api/servicedesk/admin', require('./routes/servicedeskAdminRoutes'));





// OIDC Provider Setup
const { Provider } = require('oidc-provider');
const oidcConfiguration = require('./oidc/configuration');
const oidcRoutes = require('./oidc/routes');

const oidc = new Provider(process.env.OIDC_ISSUER || 'http://ess_portal:3434', oidcConfiguration);

// Trust proxy if behind reverse proxy (Docker)
app.enable('trust proxy');
oidc.proxy = true;

app.use('/oidc', oidc.callback());

// Interaction routes for login UI
// We need to use a router for this
// app.use('/', oidcRoutes(oidc)); // This needs rework as oidcRoutes exports a function returning router
// Let's implement interaction handling directly here or mount the router properly

// Use the router we created
const interactionRouter = require('./oidc/routes')(oidc);
app.use(interactionRouter);

app.get('/', (req, res) => {
    res.send('Employee Self Service Portal API is running');
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// SonarQube / SOC-2: never expose stack traces or internal messages in production
app.use((err, req, res, _next) => {
    const requestId = req.requestId || 'unknown';
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
        console.error(JSON.stringify({
            type: 'ERROR',
            requestId,
            message: err.message,
            stack: err.stack,
            path: req.path,
            timestamp: new Date().toISOString(),
        }));
        return res.status(err.status || 500).json({
            error: 'Internal Server Error',
            requestId,
        });
    }
    console.error('Global Error Handler:', err);
    return res.status(err.status || 500).json({ error: err.message, requestId });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
