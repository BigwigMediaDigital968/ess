const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/employees/:id/offboard
exports.offboardEmployee = async (req, res) => {
    const { id } = req.params;
    const { exitDate, exitReason, exitNotes } = req.body;

    try {
        const employee = await prisma.user.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        if (!employee.isActive) {
            return res.status(400).json({ message: 'Employee is already off-boarded' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                exitDate: exitDate ? new Date(exitDate) : new Date(),
                exitReason: exitReason || 'RESIGNATION',
                exitNotes: exitNotes || null,
            },
            include: { role: true, department: true }
        });

        const { password: _, ...safeUser } = updated;
        res.json({ message: 'Employee off-boarded successfully', user: safeUser });
    } catch (error) {
        console.error('Off-boarding error:', error);
        res.status(500).json({ message: 'Off-boarding failed', error: error.message });
    }
};

// POST /api/employees/:id/reactivate
exports.reactivateEmployee = async (req, res) => {
    const { id } = req.params;

    try {
        const employee = await prisma.user.findUnique({ where: { id } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        if (employee.isActive) {
            return res.status(400).json({ message: 'Employee is already active' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                isActive: true,
                exitDate: null,
                exitReason: null,
                exitNotes: null,
            },
            include: { role: true, department: true }
        });

        const { password: _, ...safeUser } = updated;
        res.json({ message: 'Employee reactivated successfully', user: safeUser });
    } catch (error) {
        console.error('Reactivation error:', error);
        res.status(500).json({ message: 'Reactivation failed', error: error.message });
    }
};
