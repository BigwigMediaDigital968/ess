const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

app.set('io', io); // Make io accessible in controllers via req.app.get('io')

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3434;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// Routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Will be added

app.use('/api/auth', authRoutes);
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




// OIDC Provider Setup
const { Provider } = require('oidc-provider');
const oidcConfiguration = require('./oidc/configuration');
const oidcRoutes = require('./oidc/routes');

const oidc = new Provider('http://ess_portal:3434', oidcConfiguration);

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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
