const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/servicedesk/kedb
exports.getEntries = async (req, res) => {
    try {
        const { search } = req.query;
        const organizationId = req.user.organizationId;

        const where = { organizationId };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { symptoms: { contains: search, mode: 'insensitive' } },
                { rootCause: { contains: search, mode: 'insensitive' } },
                { workaround: { contains: search, mode: 'insensitive' } },
            ];
        }

        const data = await prisma.kEDBEntry.findMany({
            where,
            include: {
                problem: { select: { id: true, problemNumber: true, title: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch KEDB entries', error: err.message });
    }
};

// GET /api/servicedesk/kedb/:id
exports.getEntryById = async (req, res) => {
    try {
        const entry = await prisma.kEDBEntry.findUnique({
            where: { id: req.params.id },
            include: {
                problem: {
                    include: {
                        linkedIncidents: { select: { id: true, ticketNumber: true, title: true, status: true } },
                    },
                },
            },
        });
        if (!entry) return res.status(404).json({ message: 'KEDB entry not found' });
        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch KEDB entry', error: err.message });
    }
};

// POST /api/servicedesk/kedb
exports.createEntry = async (req, res) => {
    try {
        const { title, symptoms, rootCause, workaround, resolution, articleUrl, problemId } = req.body;
        const organizationId = req.user.organizationId;
        const createdById = req.user.id;

        const entry = await prisma.kEDBEntry.create({
            data: {
                title, symptoms, rootCause, workaround,
                resolution: resolution || null,
                articleUrl: articleUrl || null,
                problemId: problemId || null,
                createdById, organizationId,
            },
        });
        if (problemId) {
            await prisma.problem.update({ where: { id: problemId }, data: { status: 'KNOWN_ERROR' } });
        }
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'KEDB article already linked to this problem' });
        res.status(500).json({ message: 'Failed to create KEDB entry', error: err.message });
    }
};

// PUT /api/servicedesk/kedb/:id
exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, symptoms, rootCause, workaround, resolution, articleUrl } = req.body;

        const updates = {};
        if (title) updates.title = title;
        if (symptoms) updates.symptoms = symptoms;
        if (rootCause) updates.rootCause = rootCause;
        if (workaround) updates.workaround = workaround;
        if (resolution !== undefined) updates.resolution = resolution;
        if (articleUrl !== undefined) updates.articleUrl = articleUrl;

        const entry = await prisma.kEDBEntry.update({ where: { id }, data: updates });
        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update KEDB entry', error: err.message });
    }
};

// DELETE /api/servicedesk/kedb/:id
exports.deleteEntry = async (req, res) => {
    try {
        await prisma.kEDBEntry.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'KEDB entry deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete KEDB entry', error: err.message });
    }
};
