const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// ─── Helper: auto-generate ticket number ─────────────────────────────────────
async function generateNumber(prefix) {
    const counter = await prisma.serviceDeskCounter.update({
        where: { prefix },
        data: { current: { increment: 1 } },
    });
    return `${prefix}-${String(counter.current).padStart(4, '0')}`;
}

// ─── Helper: compute SLA due dates ───────────────────────────────────────────
async function computeSLADates(priority, type, organizationId) {
    const sla = await prisma.sLAPolicy.findFirst({
        where: { priority, ticketType: type, isActive: true, organizationId },
    });
    if (!sla) return { slaId: null, slaResponseDue: null, slaResolutionDue: null };

    const now = new Date();
    const slaResponseDue = new Date(now.getTime() + sla.responseTimeMinutes * 60 * 1000);
    const slaResolutionDue = new Date(now.getTime() + sla.resolutionTimeMinutes * 60 * 1000);
    return { slaId: sla.id, slaResponseDue, slaResolutionDue };
}

// ─── Helper: log activity ────────────────────────────────────────────────────
async function logActivity(ticketId, actorId, action, oldValue, newValue) {
    await prisma.ticketActivity.create({
        data: { ticketId, actorId, action, oldValue: oldValue || null, newValue: newValue || null },
    });
}

// ─── POST /api/servicedesk/tickets ───────────────────────────────────────────
exports.createTicket = async (req, res) => {
    try {
        const {
            title, description, type = 'INCIDENT', priority = 'MEDIUM',
            categoryId, ciId, teamId,
        } = req.body;

        const requesterId = req.user.id;
        const organizationId = req.user.organizationId;

        const prefix = type === 'INCIDENT' ? 'INC' : 'SR';
        const ticketNumber = await generateNumber(prefix);
        const slaData = await computeSLADates(priority, type, organizationId);

        let attachmentUrls = [];
        if (req.files && req.files.length > 0) {
            attachmentUrls = req.files.map(f => `/uploads/${f.filename}`);
        }

        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber, title, description, type, priority,
                requesterId, organizationId,
                categoryId: categoryId || null,
                teamId: teamId || null,
                ciId: ciId || null,
                attachmentUrls,
                ...slaData,
            },
            include: {
                requester: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                assignee: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                category: true,
                team: true,
                sla: true,
                ci: { select: { id: true, ciNumber: true, name: true, type: true } },
            },
        });
        // Attempt to create a chat context for the ticket
        try {
            const conversationName = `Ticket: ${ticketNumber}`;
            const conversation = await prisma.conversation.create({
                data: {
                    type: 'GROUP', // Using GROUP so we can add assignees later
                    name: conversationName,
                    participants: {
                        create: [{ userId: requesterId }]
                    }
                }
            });
            // Send welcome message
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: requesterId, // Sending from requester or system (can use requesterId for now)
                    text: `Hello! This chat has been automatically created for your ticket (${ticketNumber}). An engineer will join shortly.`
                }
            });

            // Log creation of chat
            await logActivity(ticket.id, requesterId, 'COMMENT_ADDED', null, `Chat room created for ticket.`);
        } catch (chatErr) {
            console.error('Error creating ticket chat:', chatErr);
        }

        await logActivity(ticket.id, requesterId, 'CREATED', null, ticket.ticketNumber);
        res.status(201).json({ success: true, data: ticket });
    } catch (err) {
        console.error('createTicket error:', err);
        res.status(500).json({ message: 'Failed to create ticket', error: err.message });
    }
};

// ─── GET /api/servicedesk/tickets ──────────────────────────────────────────
exports.getTickets = async (req, res) => {
    try {
        const { status, priority, type, assigneeId, teamId, page = 1, limit = 20, search } = req.query;
        const organizationId = req.user.organizationId;

        const where = { organizationId };
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (type) where.type = type;
        if (assigneeId) where.assigneeId = assigneeId;
        if (teamId) where.teamId = teamId;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                include: {
                    requester: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                    assignee: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                    category: true, team: true, sla: true,
                    _count: { select: { comments: true } },
                },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            prisma.ticket.count({ where }),
        ]);

        res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error('getTickets error:', err);
        res.status(500).json({ message: 'Failed to fetch tickets', error: err.message });
    }
};

// ─── GET /api/servicedesk/tickets/mine ───────────────────────────────────────
exports.getMyTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const organizationId = req.user.organizationId;
        const { status } = req.query;

        const where = {
            organizationId,
            OR: [{ requesterId: userId }, { assigneeId: userId }],
        };
        if (status) where.status = status;

        const data = await prisma.ticket.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                assignee: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                category: true, team: true, sla: true,
                _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error('getMyTickets error:', err);
        res.status(500).json({ message: 'Failed to fetch tickets', error: err.message });
    }
};

// ─── GET /api/servicedesk/tickets/:id ────────────────────────────────────────
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: req.params.id },
            include: {
                requester: { select: { id: true, name: true, email: true, profilePictureUrl: true, designation: true } },
                assignee: { select: { id: true, name: true, email: true, profilePictureUrl: true } },
                category: true, team: true, sla: true,
                ci: true,
                problem: { select: { id: true, problemNumber: true, title: true, status: true } },
                changeRequest: { select: { id: true, changeNumber: true, title: true, status: true } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                },
                activities: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json({ success: true, data: ticket });
    } catch (err) {
        console.error('getTicketById error:', err);
        res.status(500).json({ message: 'Failed to fetch ticket', error: err.message });
    }
};

// ─── PUT /api/servicedesk/tickets/:id ────────────────────────────────────────
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const actorId = req.user.id;
        const {
            status, priority, assigneeId, teamId, categoryId, resolution,
            problemId, changeRequestId, ciId, title, description,
        } = req.body;

        const existing = await prisma.ticket.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Ticket not found' });

        const updates = {};
        const activities = [];

        if (status && status !== existing.status) {
            updates.status = status;
            activities.push({ action: 'STATUS_CHANGED', oldValue: existing.status, newValue: status });
            if (status === 'RESOLVED') updates.resolvedAt = new Date();
            if (status === 'CLOSED') updates.closedAt = new Date();

            // Archive Chat into a File that gets attached if ticket is being resolved or closed
            if (status === 'RESOLVED' || status === 'CLOSED') {
                try {
                    const roomName = `Ticket: ${existing.ticketNumber}`;
                    const convo = await prisma.conversation.findFirst({
                        where: { name: roomName, type: 'GROUP' },
                        include: {
                            messages: {
                                include: { sender: { select: { name: true, email: true } } },
                                orderBy: { createdAt: 'asc' }
                            }
                        }
                    });

                    if (convo && convo.messages.length > 0) {
                        // Formatting the chat transcript
                        let transcript = `Chat Transcript for ${roomName}\n`;
                        transcript += `Generated on ${new Date().toLocaleString()}\n`;
                        transcript += `-------------------------------------------------\n\n`;

                        convo.messages.forEach(m => {
                            const senderName = m.sender ? m.sender.name : 'System/Unknown';
                            transcript += `[${new Date(m.createdAt).toLocaleString()}] ${senderName}: ${m.text}\n`;
                        });

                        const filename = `transcript_${existing.ticketNumber}_${Date.now()}.txt`;
                        const filepath = path.join(__dirname, '..', '..', 'uploads', filename);

                        // Ensure uploads dir exists (should exist due to docker)
                        fs.writeFileSync(filepath, transcript);

                        const fileUrl = `/uploads/${filename}`;
                        updates.attachmentUrls = { push: fileUrl }; // PostgreSQL specific syntax for arrays

                        // Create a special message to note the archive is final
                        await prisma.message.create({
                            data: {
                                conversationId: convo.id,
                                senderId: actorId,
                                text: `System: Ticket has been ${status}. This chat is now archived.`
                            }
                        });

                        // Delete or rename the conversation so it's not crowding active chats
                        // For this implementation, we will append [ARCHIVED] to the name to hide it or designate it
                        await prisma.conversation.update({
                            where: { id: convo.id },
                            data: { name: `${roomName} [ARCHIVED]` }
                        });
                    }
                } catch (chatArchiveErr) {
                    console.error('Error archiving chat transcript:', chatArchiveErr);
                }
            }
        }
        if (priority && priority !== existing.priority) {
            updates.priority = priority;
            activities.push({ action: 'PRIORITY_CHANGED', oldValue: existing.priority, newValue: priority });
        }
        if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
            updates.assigneeId = assigneeId || null;
            activities.push({ action: 'ASSIGNED', oldValue: existing.assigneeId, newValue: assigneeId });

            // If an assignee is set, try to add them to the ticket's chat room
            if (assigneeId) {
                try {
                    const roomName = `Ticket: ${existing.ticketNumber}`;
                    const convo = await prisma.conversation.findFirst({
                        where: { name: roomName, type: 'GROUP' },
                        include: { participants: true }
                    });
                    if (convo) {
                        const alreadyIn = convo.participants.some(p => p.userId === assigneeId);
                        if (!alreadyIn) {
                            await prisma.conversationParticipant.create({
                                data: { conversationId: convo.id, userId: assigneeId }
                            });
                            await prisma.message.create({
                                data: {
                                    conversationId: convo.id,
                                    senderId: assigneeId,
                                    text: `System: ${actorId} assigned this ticket. The assigned engineer has entered the chat.`
                                }
                            });
                        }
                    }
                } catch (chatErr) {
                    console.error('Error adding assignee to chat:', chatErr);
                }
            }
        }
        if (teamId !== undefined) updates.teamId = teamId || null;
        if (categoryId !== undefined) updates.categoryId = categoryId || null;
        if (resolution !== undefined) updates.resolution = resolution;
        if (problemId !== undefined) updates.problemId = problemId || null;
        if (changeRequestId !== undefined) updates.changeRequestId = changeRequestId || null;
        if (ciId !== undefined) updates.ciId = ciId || null;
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;

        // SLA breach check
        if (existing.slaResolutionDue && existing.slaResolutionDue < new Date() && !existing.slaBreached) {
            updates.slaBreached = true;
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: updates,
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                category: true, team: true, sla: true,
            },
        });

        // Log all activities
        for (const act of activities) {
            await logActivity(id, actorId, act.action, act.oldValue, act.newValue);
        }

        res.json({ success: true, data: ticket });
    } catch (err) {
        console.error('updateTicket error:', err);
        res.status(500).json({ message: 'Failed to update ticket', error: err.message });
    }
};

// ─── POST /api/servicedesk/tickets/:id/comments ──────────────────────────────
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { body, isInternal = false } = req.body;
        const authorId = req.user.id;

        if (!body?.trim()) return res.status(400).json({ message: 'Comment body is required' });

        const comment = await prisma.ticketComment.create({
            data: { ticketId: id, authorId, body, isInternal },
        });
        await logActivity(id, authorId, isInternal ? 'INTERNAL_NOTE' : 'COMMENT_ADDED', null, body.substring(0, 50));
        res.status(201).json({ success: true, data: comment });
    } catch (err) {
        console.error('addComment error:', err);
        res.status(500).json({ message: 'Failed to add comment', error: err.message });
    }
};

// ─── GET /api/servicedesk/dashboard/stats ────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        const [
            totalIncidents, openIncidents, resolvedToday, slaBreached,
            openChanges, openProblems, totalCIs, totalKedb,
            byPriority, byStatus, recentTickets,
        ] = await Promise.all([
            prisma.ticket.count({ where: { organizationId, type: 'INCIDENT' } }),
            prisma.ticket.count({ where: { organizationId, type: 'INCIDENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
            prisma.ticket.count({
                where: {
                    organizationId, resolvedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
            prisma.ticket.count({ where: { organizationId, slaBreached: true, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
            prisma.changeRequest.count({ where: { organizationId, status: { notIn: ['CLOSED'] } } }),
            prisma.problem.count({ where: { organizationId, status: { notIn: ['CLOSED'] } } }),
            prisma.cMDBItem.count({ where: { organizationId, status: 'ACTIVE' } }),
            prisma.kEDBEntry.count({ where: { organizationId } }),
            prisma.ticket.groupBy({ by: ['priority'], where: { organizationId, status: { notIn: ['RESOLVED', 'CLOSED'] } }, _count: true }),
            prisma.ticket.groupBy({ by: ['status'], where: { organizationId }, _count: true }),
            prisma.ticket.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    requester: { select: { id: true, name: true, profilePictureUrl: true } },
                    assignee: { select: { id: true, name: true } },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalIncidents, openIncidents, resolvedToday, slaBreached,
                openChanges, openProblems, totalCIs, totalKedb,
                byPriority, byStatus, recentTickets,
            },
        });
    } catch (err) {
        console.error('getDashboardStats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
    }
};
