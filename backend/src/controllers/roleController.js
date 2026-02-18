const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Roles ---
exports.getRoles = async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            where: { organizationId: req.user.organizationId }
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createRole = async (req, res) => {
    try {
        const { name, type } = req.body;
        const role = await prisma.role.create({
            data: {
                name,
                type,
                organizationId: req.user.organizationId
            }
        });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { name, type } = req.body;
        const role = await prisma.role.update({
            where: { id: req.params.id },
            data: { name, type }
        });
        res.json(role);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        await prisma.role.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Bands ---
exports.getBands = async (req, res) => {
    try {
        const bands = await prisma.band.findMany({
            where: { organizationId: req.user.organizationId },
            orderBy: { level: 'asc' }
        });
        res.json(bands);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createBand = async (req, res) => {
    try {
        const { name, level } = req.body;
        const band = await prisma.band.create({
            data: {
                name,
                level: parseInt(level),
                organizationId: req.user.organizationId
            }
        });
        res.status(201).json(band);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateBand = async (req, res) => {
    try {
        const { name, level } = req.body;
        const band = await prisma.band.update({
            where: { id: req.params.id },
            data: { name, level: parseInt(level) }
        });
        res.json(band);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteBand = async (req, res) => {
    try {
        await prisma.band.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Band deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
