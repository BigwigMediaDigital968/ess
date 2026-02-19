const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── SHIFT MANAGEMENT ────────────────────────────────────────────────────────

// GET /api/roster/shifts — list all shifts
exports.getShifts = async (req, res) => {
    try {
        const shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } });
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/roster/shifts — create a shift (Manager, HR, Admin)
exports.createShift = async (req, res) => {
    const { name, startTime, endTime } = req.body;
    if (!name || !startTime || !endTime) {
        return res.status(400).json({ message: 'name, startTime, endTime are required' });
    }
    try {
        const shift = await prisma.shift.create({ data: { name, startTime, endTime } });
        res.status(201).json(shift);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/roster/shifts/:id — update a shift
exports.updateShift = async (req, res) => {
    const { name, startTime, endTime } = req.body;
    try {
        const shift = await prisma.shift.update({
            where: { id: req.params.id },
            data: { name, startTime, endTime }
        });
        res.json(shift);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/roster/shifts/:id
exports.deleteShift = async (req, res) => {
    try {
        await prisma.shift.delete({ where: { id: req.params.id } });
        res.json({ message: 'Shift deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── ROSTER MANAGEMENT ──────────────────────────────────────────────────────

// POST /api/roster/assign — assign a shift to an employee for a date
exports.assignRoster = async (req, res) => {
    const { userId, date, shiftId } = req.body;
    if (!userId || !date || !shiftId) {
        return res.status(400).json({ message: 'userId, date, shiftId are required' });
    }
    try {
        const roster = await prisma.roster.upsert({
            where: { userId_date: { userId, date: new Date(date) } },
            update: { shiftId, assignedBy: req.user.id },
            create: { userId, date: new Date(date), shiftId, assignedBy: req.user.id },
            include: { shift: true, user: { select: { id: true, name: true, email: true } } }
        });
        res.status(201).json(roster);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/roster/bulk-assign — assign shifts to multiple employees
exports.bulkAssignRoster = async (req, res) => {
    const { assignments } = req.body; // [{ userId, date, shiftId }]
    if (!Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({ message: 'assignments array is required' });
    }
    try {
        const results = [];
        for (const a of assignments) {
            const roster = await prisma.roster.upsert({
                where: { userId_date: { userId: a.userId, date: new Date(a.date) } },
                update: { shiftId: a.shiftId, assignedBy: req.user.id },
                create: { userId: a.userId, date: new Date(a.date), shiftId: a.shiftId, assignedBy: req.user.id },
                include: { shift: true, user: { select: { id: true, name: true } } }
            });
            results.push(roster);
        }
        res.status(201).json({ message: `${results.length} roster entries assigned`, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/roster/team?startDate=&endDate= — get roster for manager's team
exports.getTeamRoster = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        // Find manager's direct reports
        const subordinates = await prisma.user.findMany({
            where: { managerId: req.user.id, isActive: true },
            select: { id: true, name: true, email: true, designation: true, profilePictureUrl: true }
        });

        const subIds = subordinates.map(s => s.id);

        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const rosters = await prisma.roster.findMany({
            where: {
                userId: { in: subIds },
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
            },
            include: {
                shift: true,
                user: { select: { id: true, name: true, email: true, designation: true } }
            },
            orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }]
        });

        res.json({ subordinates, rosters });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/roster/my?startDate=&endDate= — get own roster (read-only for employees)
exports.getMyRoster = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const rosters = await prisma.roster.findMany({
            where: {
                userId: req.user.id,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
            },
            include: { shift: true },
            orderBy: { date: 'asc' }
        });

        // Also fetch attendance for the same range for clock-in/out display
        const attendance = await prisma.attendance.findMany({
            where: {
                userId: req.user.id,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
            },
            orderBy: { date: 'asc' }
        });

        res.json({ rosters, attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/roster/:id
exports.deleteRoster = async (req, res) => {
    try {
        await prisma.roster.delete({ where: { id: req.params.id } });
        res.json({ message: 'Roster entry removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
