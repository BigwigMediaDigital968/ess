const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Legacy exports expected by employeeRoutes.js
exports.offboardEmployee = async (req, res) => {
    // Redirect to the new offboarding workflow create
    req.body.userId = req.params.id;
    return exports.createOffboarding(req, res);
};

exports.reactivateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.offboardingRequest.findUnique({ where: { userId: id } });
        if (existing) {
            await prisma.offboardingRequest.delete({ where: { userId: id } });
        }
        res.json({ message: 'Employee reactivated.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Employee or HR self-initiates offboarding / resignation
exports.createOffboarding = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const role = req.user.LegacyRole;
        const { userId, lastDay, reason } = req.body;

        const targetId = userId || requesterId;
        const initiatedBy = (targetId === requesterId) ? 'SELF' : 'HR';

        if (targetId !== requesterId && !['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role)) {
            return res.status(403).json({ message: 'Only HR/Owner can initiate offboarding for another employee.' });
        }

        const existing = await prisma.offboardingRequest.findUnique({ where: { userId: targetId } });
        if (existing) return res.status(400).json({ message: 'Offboarding request already exists.' });

        const request = await prisma.offboardingRequest.create({
            data: {
                userId: targetId,
                lastDay: new Date(lastDay),
                reason: reason || null,
                initiatedBy,
                status: 'PENDING'
            },
            include: { user: { select: { id: true, name: true, email: true, designation: true, manager: { select: { id: true, name: true } } } } }
        });

        res.status(201).json(request);
    } catch (error) {
        console.error('createOffboarding:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateStep = async (req, res) => {
    try {
        const { id } = req.params;
        const { step } = req.body;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole;

        const request = await prisma.offboardingRequest.findUnique({
            where: { id },
            include: { user: { select: { managerId: true } } }
        });
        if (!request) return res.status(404).json({ message: 'Not found.' });

        let update = {};
        const now = new Date();

        if (step === 'MANAGER') {
            if (request.user.managerId !== requesterId && !['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role)) {
                return res.status(403).json({ message: 'Only the direct manager can approve this step.' });
            }
            update = { managerApprovedAt: now, status: 'MANAGER_APPROVED' };
        } else if (step === 'IT') {
            // IT/Platform Operations step: only ADMIN or OWNER can clear
            if (!['ADMIN', 'OWNER'].includes(role)) {
                return res.status(403).json({ message: 'Only Platform Operations (Admin/Owner) can mark IT clearance.' });
            }
            update = { itClearedAt: now, status: 'IT_CLEARED' };
        } else if (step === 'HR') {
            // HR final step: only HR role can approve
            if (role !== 'HR') {
                return res.status(403).json({ message: 'Only HR team can approve the final HR step.' });
            }
            update = { hrApprovedAt: now, status: 'COMPLETED' };
        } else {
            return res.status(400).json({ message: 'Invalid step.' });
        }

        const updated = await prisma.offboardingRequest.update({
            where: { id },
            data: update,
            include: { user: { select: { id: true, name: true, email: true } } }
        });
        res.json(updated);
    } catch (error) {
        console.error('updateStep:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyOffboarding = async (req, res) => {
    try {
        const request = await prisma.offboardingRequest.findUnique({
            where: { userId: req.user.id },
            include: { user: { select: { name: true, designation: true, manager: { select: { name: true } } } } }
        });
        res.json(request || null);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTeamOffboarding = async (req, res) => {
    try {
        const role = req.user.LegacyRole;
        const requesterId = req.user.id;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role);

        const requests = await prisma.offboardingRequest.findMany({
            where: isPrivileged ? {} : { user: { managerId: requesterId } },
            include: {
                user: {
                    select: {
                        id: true, name: true, email: true, designation: true, profilePictureUrl: true,
                        manager: { select: { id: true, name: true } },
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.cancelOffboarding = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole;

        const request = await prisma.offboardingRequest.findUnique({ where: { id } });
        if (!request) return res.status(404).json({ message: 'Not found.' });

        if (request.userId !== requesterId && !['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        await prisma.offboardingRequest.delete({ where: { id } });
        res.json({ message: 'Offboarding cancelled.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
