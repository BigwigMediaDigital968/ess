const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── RECRUITMENT REPORTS ─────────────────────────────────────────────────────

exports.getRecruitmentReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);

        // Pipeline funnel: count applications by status
        const pipelineRaw = await prisma.application.groupBy({
            by: ['status'],
            _count: { status: true },
            where: from || to ? { createdAt: dateFilter } : {}
        });
        const pipeline = pipelineRaw.map(r => ({ status: r.status, count: r._count.status }));

        // Jobs summary
        const totalJobs = await prisma.jobPosting.count();
        const openJobs = await prisma.jobPosting.count({ where: { status: 'OPEN' } });
        const closedJobs = await prisma.jobPosting.count({ where: { status: 'CLOSED' } });

        // Applications summary
        const totalApplications = await prisma.application.count();
        const hired = await prisma.application.count({ where: { status: 'HIRED' } });
        const rejected = await prisma.application.count({ where: { status: 'REJECTED' } });
        const inOffer = await prisma.application.count({ where: { status: 'OFFER' } });

        // Offers
        const offers = await prisma.offer.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        // Applications per job (top 10)
        const appsPerJob = await prisma.application.groupBy({
            by: ['jobId'],
            _count: { jobId: true },
            orderBy: { _count: { jobId: 'desc' } },
            take: 10
        });
        const jobIds = appsPerJob.map(a => a.jobId);
        const jobs = await prisma.jobPosting.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } });
        const jobMap = Object.fromEntries(jobs.map(j => [j.id, j.title]));
        const appsPerJobData = appsPerJob.map(a => ({ job: jobMap[a.jobId] || a.jobId, count: a._count.jobId }));

        // Monthly applications trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentApps = await prisma.application.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, status: true }
        });
        const monthlyTrend = {};
        recentApps.forEach(a => {
            const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
        });
        const trendData = Object.entries(monthlyTrend).sort().map(([month, count]) => ({ month, count }));

        // AI Score distribution
        const assessments = await prisma.assessment.findMany({
            where: { aiScore: { not: null } },
            select: { aiScore: true, recommendation: true }
        });
        const scoreRanges = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        assessments.forEach(a => {
            const s = a.aiScore;
            if (s <= 40) scoreRanges['0-40']++;
            else if (s <= 60) scoreRanges['41-60']++;
            else if (s <= 80) scoreRanges['61-80']++;
            else scoreRanges['81-100']++;
        });

        res.json({
            summary: { totalJobs, openJobs, closedJobs, totalApplications, hired, rejected, inOffer },
            pipeline,
            offers: offers.map(o => ({ status: o.status, count: o._count.status })),
            appsPerJob: appsPerJobData,
            monthlyTrend: trendData,
            aiScoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({ range, count }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ─── ESS / EMPLOYEE REPORTS ──────────────────────────────────────────────────

exports.getESSReport = async (req, res) => {
    try {
        // Headcount by department
        const byDept = await prisma.user.groupBy({
            by: ['departmentId'],
            _count: { departmentId: true },
            where: { isActive: true }
        });
        const deptIds = byDept.map(d => d.departmentId).filter(Boolean);
        const depts = await prisma.department.findMany({ where: { id: { in: deptIds } } });
        const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));
        const headcountByDept = byDept.map(d => ({
            department: deptMap[d.departmentId] || 'Unassigned',
            count: d._count.departmentId
        })).sort((a, b) => b.count - a.count);

        // Total employees
        const totalEmployees = await prisma.user.count({ where: { isActive: true } });
        const totalDepts = await prisma.department.count();

        // Leave utilization by type
        const leaveByType = await prisma.leave.groupBy({
            by: ['type', 'status'],
            _count: { type: true }
        });

        // Leave requests by status
        const leaveByStatus = await prisma.leave.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        // Salary distribution (band buckets)
        const structures = await prisma.salaryStructure.findMany({ select: { basic: true, userId: true } });
        const bands = { '<20K': 0, '20-40K': 0, '40-60K': 0, '60-80K': 0, '80-100K': 0, '>100K': 0 };
        structures.forEach(s => {
            const b = s.basic;
            if (b < 20000) bands['<20K']++;
            else if (b < 40000) bands['20-40K']++;
            else if (b < 60000) bands['40-60K']++;
            else if (b < 80000) bands['60-80K']++;
            else if (b < 100000) bands['80-100K']++;
            else bands['>100K']++;
        });

        // Employees by designation (top 10)
        const byDesignation = await prisma.user.groupBy({
            by: ['designation'],
            _count: { designation: true },
            where: { isActive: true, designation: { not: null } },
            orderBy: { _count: { designation: 'desc' } },
            take: 10
        });

        // New hires last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const newHires = await prisma.user.findMany({
            where: { createdAt: { gte: sixMonthsAgo }, isActive: true },
            select: { createdAt: true }
        });
        const hiresByMonth = {};
        newHires.forEach(u => {
            const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`;
            hiresByMonth[key] = (hiresByMonth[key] || 0) + 1;
        });
        const hiringTrend = Object.entries(hiresByMonth).sort().map(([month, count]) => ({ month, count }));

        res.json({
            summary: { totalEmployees, totalDepts, configuredSalaries: structures.length },
            headcountByDept,
            leaveByType: leaveByType.map(l => ({ type: l.type, status: l.status, count: l._count.type })),
            leaveByStatus: leaveByStatus.map(l => ({ status: l.status, count: l._count.status })),
            salaryBands: Object.entries(bands).map(([band, count]) => ({ band, count })),
            byDesignation: byDesignation.map(d => ({ designation: d.designation || 'N/A', count: d._count.designation })),
            hiringTrend
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ─── ATTENDANCE REPORTS ──────────────────────────────────────────────────────

exports.getAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);
        const targetYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // All attendance in period
        const records = await prisma.attendance.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            include: { user: { select: { id: true, name: true, department: { select: { name: true } } } } }
        });

        // Status breakdown
        const statusBreakdown = {};
        records.forEach(r => {
            statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        });

        // Daily trend (present count per day)
        const dailyTrend = {};
        records.forEach(r => {
            const day = r.date.toISOString().split('T')[0];
            if (!dailyTrend[day]) dailyTrend[day] = { present: 0, absent: 0, late: 0, wfh: 0 };
            const s = r.status?.toLowerCase();
            if (s === 'present') dailyTrend[day].present++;
            else if (s === 'absent') dailyTrend[day].absent++;
            else if (s === 'late') dailyTrend[day].late++;
            else if (s === 'wfh') dailyTrend[day].wfh++;
        });
        const dailyData = Object.entries(dailyTrend).sort().map(([date, counts]) => ({ date, ...counts }));

        // Per-employee summary
        const empMap = {};
        records.forEach(r => {
            const id = r.userId;
            if (!empMap[id]) empMap[id] = { name: r.user?.name, dept: r.user?.department?.name, present: 0, absent: 0, late: 0, wfh: 0, total: 0 };
            empMap[id].total++;
            const s = r.status?.toLowerCase();
            if (s === 'present') empMap[id].present++;
            else if (s === 'absent') empMap[id].absent++;
            else if (s === 'late') empMap[id].late++;
            else if (s === 'wfh') empMap[id].wfh++;
        });
        const employeeSummary = Object.values(empMap)
            .map(e => ({ ...e, attendancePct: e.total > 0 ? Math.round((e.present + e.wfh) / e.total * 100) : 0 }))
            .sort((a, b) => a.attendancePct - b.attendancePct);

        // Dept-wise attendance rate
        const deptMap = {};
        records.forEach(r => {
            const dept = r.user?.department?.name || 'Unassigned';
            if (!deptMap[dept]) deptMap[dept] = { present: 0, total: 0 };
            deptMap[dept].total++;
            if (['present', 'wfh'].includes(r.status?.toLowerCase())) deptMap[dept].present++;
        });
        const deptAttendance = Object.entries(deptMap).map(([dept, d]) => ({
            dept,
            rate: d.total > 0 ? Math.round(d.present / d.total * 100) : 0,
            total: d.total
        })).sort((a, b) => b.rate - a.rate);

        // Total employees (for context)
        const totalEmployees = await prisma.user.count({ where: { isActive: true } });

        res.json({
            period: { month: targetMonth, year: targetYear },
            summary: {
                totalRecords: records.length,
                totalEmployees,
                ...statusBreakdown
            },
            statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
            dailyTrend: dailyData,
            employeeSummary,
            deptAttendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ─── TEAM ATTENDANCE REPORT (Manager's subordinates only) ────────────────────

exports.getTeamAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const managerId = req.user.id;
        const now = new Date();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);
        const targetYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Get subordinates
        const subordinates = await prisma.user.findMany({
            where: { managerId, isActive: true },
            select: { id: true, name: true, designation: true, department: { select: { name: true } } }
        });
        const subIds = subordinates.map(s => s.id);

        if (subIds.length === 0) {
            return res.json({ subordinates: [], summary: {}, records: [] });
        }

        const records = await prisma.attendance.findMany({
            where: { userId: { in: subIds }, date: { gte: startDate, lte: endDate } },
            orderBy: { date: 'asc' }
        });

        // Per-employee summary
        const empMap = {};
        subordinates.forEach(s => {
            empMap[s.id] = { name: s.name, designation: s.designation, dept: s.department?.name, present: 0, late: 0, absent: 0, halfDay: 0, total: 0 };
        });
        records.forEach(r => {
            if (!empMap[r.userId]) return;
            empMap[r.userId].total++;
            const s = r.status?.toUpperCase();
            if (s === 'PRESENT') empMap[r.userId].present++;
            else if (s === 'LATE') empMap[r.userId].late++;
            else if (s === 'ABSENT') empMap[r.userId].absent++;
            else if (s === 'HALF_DAY') empMap[r.userId].halfDay++;
        });

        const workingDays = new Set(records.map(r => r.date.toISOString().split('T')[0])).size || 1;

        res.json({
            period: { month: targetMonth, year: targetYear },
            summary: { totalSubordinates: subIds.length, workingDays, totalRecords: records.length },
            employees: Object.values(empMap).map(e => ({
                ...e,
                attendancePct: workingDays > 0 ? Math.round(((e.present + e.late) / workingDays) * 100) : 0
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ─── INDIVIDUAL EMPLOYEE REPORT ──────────────────────────────────────────────

exports.getIndividualReport = async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;
        const now = new Date();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);
        const targetYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, designation: true, department: { select: { name: true } } }
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const records = await prisma.attendance.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            orderBy: { date: 'asc' }
        });

        // Roster for this period
        const rosters = await prisma.roster.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            include: { shift: true },
            orderBy: { date: 'asc' }
        });

        // Leaves in period
        const leaves = await prisma.leave.findMany({
            where: {
                userId,
                OR: [
                    { startDate: { gte: startDate, lte: endDate } },
                    { endDate: { gte: startDate, lte: endDate } }
                ]
            }
        });

        // Daily breakdown
        const dailyMap = {};
        records.forEach(r => {
            const d = r.date.toISOString().split('T')[0];
            dailyMap[d] = {
                status: r.status,
                clockIn: r.clockIn,
                clockOut: r.clockOut,
                type: r.type
            };
        });

        // Status counts
        const counts = { present: 0, late: 0, absent: 0, halfDay: 0, totalDays: records.length };
        records.forEach(r => {
            const s = r.status?.toUpperCase();
            if (s === 'PRESENT') counts.present++;
            else if (s === 'LATE') counts.late++;
            else if (s === 'ABSENT') counts.absent++;
            else if (s === 'HALF_DAY') counts.halfDay++;
        });

        res.json({
            employee,
            period: { month: targetMonth, year: targetYear },
            counts,
            dailyBreakdown: dailyMap,
            rosters: rosters.map(r => ({ date: r.date, shift: r.shift })),
            leaves: leaves.map(l => ({ type: l.type, startDate: l.startDate, endDate: l.endDate, status: l.status }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ─── MONTHLY SUMMARY (Org-wide, with team aggregation) ──────────────────────

exports.getMonthlySummary = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();

        const monthlySummary = [];

        for (let m = 1; m <= 12; m++) {
            const startDate = new Date(targetYear, m - 1, 1);
            const endDate = new Date(targetYear, m, 0, 23, 59, 59);

            const records = await prisma.attendance.findMany({
                where: { date: { gte: startDate, lte: endDate } },
                select: { status: true, userId: true }
            });

            const uniqueEmployees = new Set(records.map(r => r.userId)).size;
            let present = 0, late = 0, absent = 0;
            records.forEach(r => {
                const s = r.status?.toUpperCase();
                if (s === 'PRESENT') present++;
                else if (s === 'LATE') late++;
                else if (s === 'ABSENT') absent++;
            });

            monthlySummary.push({
                month: m,
                monthName: new Date(targetYear, m - 1).toLocaleString('default', { month: 'short' }),
                totalRecords: records.length,
                uniqueEmployees,
                present,
                late,
                absent,
                attendanceRate: records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 0
            });
        }

        // Department-wise annual summary
        const yearStart = new Date(targetYear, 0, 1);
        const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59);
        const allRecords = await prisma.attendance.findMany({
            where: { date: { gte: yearStart, lte: yearEnd } },
            include: { user: { select: { department: { select: { name: true } } } } }
        });

        const deptSummary = {};
        allRecords.forEach(r => {
            const dept = r.user?.department?.name || 'Unassigned';
            if (!deptSummary[dept]) deptSummary[dept] = { present: 0, late: 0, total: 0 };
            deptSummary[dept].total++;
            const s = r.status?.toUpperCase();
            if (s === 'PRESENT') deptSummary[dept].present++;
            else if (s === 'LATE') deptSummary[dept].late++;
        });

        res.json({
            year: targetYear,
            monthlySummary,
            departmentSummary: Object.entries(deptSummary).map(([dept, d]) => ({
                department: dept,
                totalRecords: d.total,
                present: d.present,
                late: d.late,
                rate: d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 0
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
