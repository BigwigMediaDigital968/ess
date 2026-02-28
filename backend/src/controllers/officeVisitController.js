const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Employee requests to work from another office branch
exports.createVisitRequest = async (req, res) => {
    try {
        const { targetOfficeId, date } = req.body;
        const userId = req.user.id;

        // Find employee manager
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { managerId: true }
        });

        const newRequest = await prisma.officeVisitRequest.create({
            data: {
                userId,
                targetOfficeId,
                date: new Date(date),
                status: 'PENDING',
                managerId: user?.managerId || null
            }
        });

        res.status(201).json({ message: "Visit request submitted successfully", request: newRequest });
    } catch (error) {
        console.error("Create Visit Request Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Manager gets pending requests
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await prisma.officeVisitRequest.findMany({
            where: { managerId: userId, status: 'PENDING' },
            include: {
                user: { select: { name: true, email: true } },
                targetOffice: { select: { name: true } }
            },
            orderBy: { date: 'asc' }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Get Visit Requests Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Manager approves/rejects
exports.updateVisitRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // APPROVED or REJECTED
        const managerId = req.user.id;

        const request = await prisma.officeVisitRequest.findFirst({
            where: { id, managerId }
        });

        if (!request) {
            return res.status(404).json({ message: "Request not found or unauthorized" });
        }

        const updatedRequest = await prisma.officeVisitRequest.update({
            where: { id },
            data: { status }
        });

        res.status(200).json({ message: `Request ${status.toLowerCase()}`, request: updatedRequest });
    } catch (error) {
        console.error("Update Visit Request Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Employee sees their own requests
exports.getMyVisitRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await prisma.officeVisitRequest.findMany({
            where: { userId },
            include: { targetOffice: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Get My Visit Requests Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
