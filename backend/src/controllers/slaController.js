const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/servicedesk/sla
exports.getPolicies = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const data = await prisma.sLAPolicy.findMany({
            where: { organizationId },
            orderBy: [{ ticketType: 'asc' }, { priority: 'asc' }],
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch SLA policies', error: err.message });
    }
};

// POST /api/servicedesk/sla
exports.createPolicy = async (req, res) => {
    try {
        const { name, priority, ticketType, responseTimeMinutes, resolutionTimeMinutes } = req.body;
        const organizationId = req.user.organizationId;

        const policy = await prisma.sLAPolicy.create({
            data: { name, priority, ticketType, responseTimeMinutes, resolutionTimeMinutes, organizationId },
        });
        res.status(201).json({ success: true, data: policy });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create SLA policy', error: err.message });
    }
};

// PUT /api/servicedesk/sla/:id
exports.updatePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, priority, ticketType, responseTimeMinutes, resolutionTimeMinutes, isActive } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (priority !== undefined) updates.priority = priority;
        if (ticketType !== undefined) updates.ticketType = ticketType;
        if (responseTimeMinutes !== undefined) updates.responseTimeMinutes = responseTimeMinutes;
        if (resolutionTimeMinutes !== undefined) updates.resolutionTimeMinutes = resolutionTimeMinutes;
        if (isActive !== undefined) updates.isActive = isActive;

        const policy = await prisma.sLAPolicy.update({ where: { id }, data: updates });
        res.json({ success: true, data: policy });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update SLA policy', error: err.message });
    }
};

// DELETE /api/servicedesk/sla/:id
exports.deletePolicy = async (req, res) => {
    try {
        await prisma.sLAPolicy.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'SLA policy deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete SLA policy', error: err.message });
    }
};

// POST /api/servicedesk/sla/check-breaches  (can be called by a cron)
exports.checkAndMarkBreaches = async (req, res) => {
    try {
        const now = new Date();
        const result = await prisma.ticket.updateMany({
            where: {
                slaResolutionDue: { lt: now },
                slaBreached: false,
                status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
            data: { slaBreached: true },
        });
        res.json({ success: true, breachesMarked: result.count });
    } catch (err) {
        res.status(500).json({ message: 'Failed to check SLA breaches', error: err.message });
    }
};

// GET /api/servicedesk/sla/compliance  — SLA compliance stats
exports.getSLACompliance = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { days = 30 } = req.query;
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

        const [total, breached, byPriority] = await Promise.all([
            prisma.ticket.count({ where: { organizationId, createdAt: { gte: since } } }),
            prisma.ticket.count({ where: { organizationId, slaBreached: true, createdAt: { gte: since } } }),
            prisma.ticket.groupBy({
                by: ['priority'],
                where: { organizationId, createdAt: { gte: since } },
                _count: { id: true },
                // Note: groupBy on slaBreached requires separate queries per priority
            }),
        ]);

        const complianceRate = total > 0 ? (((total - breached) / total) * 100).toFixed(1) : '100.0';

        res.json({
            success: true,
            data: {
                total, breached, complianceRate: parseFloat(complianceRate), days: Number(days), byPriority,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to compute SLA compliance', error: err.message });
    }
};
