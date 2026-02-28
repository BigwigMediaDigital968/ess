const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Teams ────────────────────────────────────────────────────────────────────

// GET /api/servicedesk/admin/teams
exports.getTeams = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const data = await prisma.serviceDeskTeam.findMany({
            where: { organizationId },
            include: {
                members: true,
                _count: { select: { categories: true, tickets: true } },
            },
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch teams', error: err.message });
    }
};

// POST /api/servicedesk/admin/teams
exports.createTeam = async (req, res) => {
    try {
        const { name, description, memberUserIds = [] } = req.body;
        const organizationId = req.user.organizationId;

        const team = await prisma.serviceDeskTeam.create({
            data: {
                name, description, organizationId,
                members: {
                    create: memberUserIds.map((userId) => ({ userId })),
                },
            },
            include: { members: true },
        });
        res.status(201).json({ success: true, data: team });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'Team name already exists' });
        res.status(500).json({ message: 'Failed to create team', error: err.message });
    }
};

// PUT /api/servicedesk/admin/teams/:id
exports.updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, memberUserIds } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;

        if (memberUserIds) {
            // Replace members
            await prisma.serviceDeskMember.deleteMany({ where: { teamId: id } });
            updates.members = { create: memberUserIds.map((userId) => ({ userId })) };
        }

        const team = await prisma.serviceDeskTeam.update({
            where: { id },
            data: updates,
            include: { members: true },
        });
        res.json({ success: true, data: team });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update team', error: err.message });
    }
};

// DELETE /api/servicedesk/admin/teams/:id
exports.deleteTeam = async (req, res) => {
    try {
        await prisma.serviceDeskTeam.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Team deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete team', error: err.message });
    }
};

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /api/servicedesk/admin/categories
exports.getCategories = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { ticketType } = req.query;
        const where = { organizationId };
        if (ticketType) where.ticketType = ticketType;

        const data = await prisma.ticketCategoryModel.findMany({
            where,
            include: {
                team: { select: { id: true, name: true } },
                _count: { select: { tickets: true } },
            },
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
    }
};

// POST /api/servicedesk/admin/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, ticketType = 'INCIDENT', teamId } = req.body;
        const organizationId = req.user.organizationId;

        const cat = await prisma.ticketCategoryModel.create({
            data: { name, ticketType, teamId: teamId || null, organizationId },
            include: { team: true },
        });
        res.status(201).json({ success: true, data: cat });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'Category name already exists' });
        res.status(500).json({ message: 'Failed to create category', error: err.message });
    }
};

// PUT /api/servicedesk/admin/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ticketType, teamId } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (ticketType) updates.ticketType = ticketType;
        if (teamId !== undefined) updates.teamId = teamId || null;

        const cat = await prisma.ticketCategoryModel.update({
            where: { id }, data: updates, include: { team: true },
        });
        res.json({ success: true, data: cat });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update category', error: err.message });
    }
};

// DELETE /api/servicedesk/admin/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        await prisma.ticketCategoryModel.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
};
