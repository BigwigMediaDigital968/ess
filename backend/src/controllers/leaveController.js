const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.applyLeave = async (req, res) => {
    const { type, startDate, endDate, reason } = req.body;
    try {
        // Auto-approve if Owner
        let status = 'PENDING';
        if (req.user.organizationId) {
            const org = await prisma.organization.findUnique({
                where: { id: req.user.organizationId }
            });
            if (org && org.ownerId === req.user.id) {
                status = 'APPROVED';
            }
        }

        const leave = await prisma.leave.create({
            data: {
                userId: req.user.id,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status
            },
            include: { user: true }
        });

        // Chat Integration: Send Approval Request to Manager
        if (req.user.managerId) {
            try {
                // Find or Create Conversation
                const senderId = req.user.id;
                const receiverId = req.user.managerId;

                // Check if direct conversation exists
                // We do a raw lookup or findFirst logic similar to chatController
                // Simplified: Just find any conversation with these 2 participants and type DIRECT

                let conversation = await prisma.conversation.findFirst({
                    where: {
                        type: 'DIRECT',
                        AND: [
                            { participants: { some: { userId: senderId } } },
                            { participants: { some: { userId: receiverId } } }
                        ]
                    }
                });

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            type: 'DIRECT',
                            participants: {
                                create: [{ userId: senderId }, { userId: receiverId }]
                            }
                        }
                    });
                }

                // Create Message
                const message = await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderId: senderId,
                        content: `Leave Application: ${type} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Reason: ${reason}`,
                        type: 'APPROVAL_REQUEST',
                        approvalStatus: 'PENDING',
                        referenceId: leave.id
                    },
                    include: { sender: true }
                });

                // Socket Emit
                const io = req.app.get('io');
                if (io) {
                    io.to(conversation.id).emit("receive_message", message);
                }

            } catch (chatError) {
                console.error("Failed to send chat notification:", chatError);
                // Don't fail the request if chat fails
            }
        }

        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    // Manager or Admin can approve
    const { status } = req.body; // APPROVED, REJECTED
    try {
        const leave = await prisma.leave.update({
            where: { id: req.params.id },
            data: {
                status,
                approverId: req.user.id
            }
        });

        // Chat Integration: Update Message Status
        try {
            const message = await prisma.message.findFirst({
                where: { referenceId: leave.id, type: 'APPROVAL_REQUEST' }
            });

            if (message) {
                const updatedMessage = await prisma.message.update({
                    where: { id: message.id },
                    data: { approvalStatus: status },
                    include: { sender: true }
                });

                // Socket Emit
                const io = req.app.get('io');
                if (io) {
                    io.to(message.conversationId).emit("receive_message", updatedMessage);
                    // Also emit an event to update specific message if UI supports it, 
                    // but receive_message with same ID might be handled by UI as update or duplicate.
                    // Chat.jsx logic: setMessages((prev) => [...prev, message]); -> This appends.
                    // We need a way to UPDATE.
                    // For now, let's just emit. The UI might need a tweak to handle updates or we just accept the duplicate/append for now?
                    // Better: UI should check ID.
                }
            }
        } catch (chatError) {
            console.error("Failed to update chat message:", chatError);
        }

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await prisma.leave.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingLeaves = async (req, res) => {
    // Get leaves applied by subordinates
    try {
        const leaves = await prisma.leave.findMany({
            where: {
                status: 'PENDING',
                user: {
                    managerId: req.user.id
                }
            },
            include: { user: { select: { name: true, email: true } } }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getApprovedLeaves = async (req, res) => {
    try {
        const leaves = await prisma.leave.findMany({
            where: { status: 'APPROVED' },
            include: { user: { select: { name: true } } }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLeaveStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01`);
        const endOfYear = new Date(`${currentYear}-12-31`);

        // Get Policy (Default quotas)
        // If user has organization, use that policy, else defaults
        let casualTotal = 24;
        let earnedTotal = 20;

        if (req.user.organizationId) {
            const policy = await prisma.leavePolicy.findUnique({
                where: { organizationId: req.user.organizationId }
            });
            if (policy) {
                casualTotal = policy.casualLeaves;
                earnedTotal = policy.earnedLeaves;
            }
        }

        // Calculate Taken Leaves (Approved & Inside Current Year)
        // Note: For "Taken", we count number of days? Or number of requests?
        // Usually it's days. We need to sum the duration of each leave.
        // Prisma doesn't have a direct "Sum of Date Difference" aggregate.
        // We fetch the leaves and calculate in JS.

        const approvedLeaves = await prisma.leave.findMany({
            where: {
                userId,
                status: 'APPROVED',
                startDate: { gte: startOfYear },
                endDate: { lte: endOfYear }
            }
        });

        let casualTaken = 0;
        let earnedTaken = 0;

        approvedLeaves.forEach(leave => {
            // Calculate days: (end - start) / (1000 * 60 * 60 * 24) + 1
            const diffTime = Math.abs(new Date(leave.endDate) - new Date(leave.startDate));
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (leave.type === 'CASUAL') casualTaken += days;
            else if (leave.type === 'EARNED') earnedTaken += days;
        });

        // Balance
        const casualBalance = Math.max(0, casualTotal - casualTaken);
        const earnedBalance = Math.max(0, earnedTotal - earnedTaken);

        res.json({
            casual: { total: casualTotal, taken: casualTaken, balance: casualBalance },
            earned: { total: earnedTotal, taken: earnedTaken, balance: earnedBalance }
        });

    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

