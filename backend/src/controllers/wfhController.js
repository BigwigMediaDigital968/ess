const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.requestWFHLocation = async (req, res) => {
    const { latitude, longitude, address } = req.body;
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

        const request = await prisma.wFHLocation.create({
            data: {
                userId: req.user.id,
                latitude,
                longitude,
                address,
                status
            },
        });
        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.approveWFHLocation = async (req, res) => {
    const { status } = req.body; // APPROVED, REJECTED
    try {
        const request = await prisma.wFHLocation.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyWFHLocations = async (req, res) => {
    try {
        const locations = await prisma.wFHLocation.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingWFHRequests = async (req, res) => {
    // For Managers
    try {
        const requests = await prisma.wFHLocation.findMany({
            where: {
                status: 'PENDING',
                user: {
                    managerId: req.user.id
                }
            },
            include: { user: { select: { name: true, email: true } } }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getApprovedWFHRequests = async (req, res) => {
    try {
        const requests = await prisma.wFHLocation.findMany({
            where: { status: 'APPROVED' },
            include: { user: { select: { name: true } } }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
