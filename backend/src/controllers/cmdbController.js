const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateNumber(prefix) {
    const counter = await prisma.serviceDeskCounter.update({
        where: { prefix },
        data: { current: { increment: 1 } },
    });
    return `${prefix}-${String(counter.current).padStart(4, '0')}`;
}

// POST /api/servicedesk/cmdb
exports.createCI = async (req, res) => {
    try {
        const {
            name, type = 'SERVER', status = 'ACTIVE', environment = 'PROD',
            ownerId, managedById, ipAddress, hostName, location, description, attributes,
        } = req.body;
        const organizationId = req.user.organizationId;
        const ciNumber = await generateNumber('CI');

        const ci = await prisma.cMDBItem.create({
            data: {
                ciNumber, name, type, status, environment,
                ownerId: ownerId || null,
                managedById: managedById || null,
                ipAddress, hostName, location, description,
                attributes: attributes || undefined,
                organizationId,
            },
        });
        res.status(201).json({ success: true, data: ci });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create CI', error: err.message });
    }
};

// GET /api/servicedesk/cmdb
exports.getCIs = async (req, res) => {
    try {
        const { type, status, environment, search, page = 1, limit = 20 } = req.query;
        const organizationId = req.user.organizationId;

        const where = { organizationId };
        if (type) where.type = type;
        if (status) where.status = status;
        if (environment) where.environment = environment;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { ciNumber: { contains: search, mode: 'insensitive' } },
                { hostName: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.cMDBItem.findMany({
                where,
                include: {
                    relationsAsSource: { include: { target: { select: { id: true, ciNumber: true, name: true, type: true } } } },
                    _count: { select: { tickets: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            prisma.cMDBItem.count({ where }),
        ]);
        res.json({ success: true, data, total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch CIs', error: err.message });
    }
};

// GET /api/servicedesk/cmdb/:id
exports.getCIById = async (req, res) => {
    try {
        const ci = await prisma.cMDBItem.findUnique({
            where: { id: req.params.id },
            include: {
                relationsAsSource: { include: { target: true } },
                relationsAsTarget: { include: { source: true } },
                tickets: { select: { id: true, ticketNumber: true, title: true, status: true, priority: true }, take: 10 },
                changeRequests: { include: { changeRequest: { select: { id: true, changeNumber: true, title: true, status: true } } } },
            },
        });
        if (!ci) return res.status(404).json({ message: 'CI not found' });
        res.json({ success: true, data: ci });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch CI', error: err.message });
    }
};

// PUT /api/servicedesk/cmdb/:id
exports.updateCI = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        delete updates.ciNumber; // can't change number
        delete updates.organizationId;

        const ci = await prisma.cMDBItem.update({ where: { id }, data: updates });
        res.json({ success: true, data: ci });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update CI', error: err.message });
    }
};

// DELETE /api/servicedesk/cmdb/:id
exports.deleteCI = async (req, res) => {
    try {
        await prisma.cMDBItem.update({
            where: { id: req.params.id },
            data: { status: 'RETIRED' },
        });
        res.json({ success: true, message: 'CI retired' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to retire CI', error: err.message });
    }
};

// POST /api/servicedesk/cmdb/:id/relationships
exports.addRelationship = async (req, res) => {
    try {
        const { targetId, relationshipType = 'DEPENDS_ON' } = req.body;
        const sourceId = req.params.id;

        const rel = await prisma.cMDBRelationship.create({
            data: { sourceId, targetId, relationshipType },
            include: {
                source: { select: { id: true, ciNumber: true, name: true } },
                target: { select: { id: true, ciNumber: true, name: true } },
            },
        });
        res.status(201).json({ success: true, data: rel });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'Relationship already exists' });
        res.status(500).json({ message: 'Failed to add relationship', error: err.message });
    }
};

// DELETE /api/servicedesk/cmdb/relationships/:id
exports.deleteRelationship = async (req, res) => {
    try {
        await prisma.cMDBRelationship.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Relationship removed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete relationship', error: err.message });
    }
};
