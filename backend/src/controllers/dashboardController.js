const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: { userId, date: { gte: today } }
        });

        let attendanceStatus = "Not Checked In";
        if (attendance) {
            if (attendance.clockOut) attendanceStatus = "Checked Out";
            else attendanceStatus = "Checked In";
        }

        let leaveBalance = 0;
        const balance = await prisma.leaveBalance.findUnique({ where: { userId } });
        if (balance) {
            leaveBalance = balance.casualLeaves + balance.earnedLeaves;
        } else {
            leaveBalance = 44;
        }

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const workingDays = await prisma.attendance.count({
            where: { userId, date: { gte: startOfMonth }, status: 'PRESENT' }
        });

        res.json({
            attendance: attendanceStatus,
            leaveBalance: Math.floor(leaveBalance),
            workingDays
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── Sign-In Stats for HR / Manager / Owner ──────────────────────────────────
exports.getSignInStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalEmployees = await prisma.user.count({ where: { isActive: true } });

        const todayRecords = await prisma.attendance.findMany({
            where: { date: { gte: today } },
            include: { user: { select: { name: true, department: { select: { name: true } } } } }
        });

        const signedIn = todayRecords.filter(r => !r.clockOut).length;
        const checkedOut = todayRecords.filter(r => r.clockOut).length;
        const wfh = todayRecords.filter(r => r.status?.toLowerCase() === 'wfh').length;
        const late = todayRecords.filter(r => r.status?.toLowerCase() === 'late').length;
        const absent = Math.max(0, totalEmployees - todayRecords.length);

        // Hourly sign-in trend (8am–7pm)
        const hourlyTrend = [];
        for (let h = 8; h <= 19; h++) {
            const count = todayRecords.filter(r => {
                const hr = new Date(r.clockIn).getHours();
                return hr === h;
            }).length;
            hourlyTrend.push({ hour: `${h}:00`, count });
        }

        // Dept-wise today
        const deptMap = {};
        todayRecords.forEach(r => {
            const dept = r.user?.department?.name || 'Unassigned';
            deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        const byDept = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }));

        // Recent sign-ins (last 5)
        const recent = todayRecords
            .sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn))
            .slice(0, 5)
            .map(r => ({
                name: r.user?.name,
                dept: r.user?.department?.name,
                time: new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                status: r.status
            }));

        res.json({
            totalEmployees,
            signedIn,
            checkedOut,
            wfh,
            late,
            absent,
            attendanceRate: totalEmployees > 0 ? Math.round((todayRecords.length / totalEmployees) * 100) : 0,
            hourlyTrend,
            byDept,
            recent
        });
    } catch (error) {
        console.error("Sign-in stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
