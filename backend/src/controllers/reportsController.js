const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');


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

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────

function pdfDrawTable(doc, headers, rows, startX, startY, colWidths) {
    const rowH = 22;
    let y = startY;
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    // Header
    doc.fillColor('#a855f7').rect(startX, y, totalW, rowH).fill();
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    let x = startX;
    headers.forEach((h, i) => {
        doc.text(h, x + 4, y + 6, { width: colWidths[i] - 8, lineBreak: false });
        x += colWidths[i];
    });
    y += rowH;

    // Rows
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, ri) => {
        const bg = ri % 2 === 0 ? '#ffffff' : '#f5f0ff';
        doc.fillColor(bg).rect(startX, y, totalW, rowH).fill();
        doc.fillColor('#1a1a1a');
        x = startX;
        row.forEach((cell, ci) => {
            doc.text(String(cell ?? '-'), x + 4, y + 6, { width: colWidths[ci] - 8, lineBreak: false });
            x += colWidths[ci];
        });
        y += rowH;
        if (y > doc.page.height - 60) { doc.addPage(); y = 50; }
    });
    return y + 10;
}

function pdfHeader(doc, org, title, subtitle) {
    doc.rect(0, 0, doc.page.width, 68).fill('#a855f7');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(org?.name || 'ESS Portal', 30, 12, { width: 330 });
    doc.fontSize(8).font('Helvetica').text('EMPLOYEE SELF SERVICE', 30, 36);
    doc.fontSize(14).font('Helvetica-Bold').text(title, 0, 16, { align: 'right', width: doc.page.width - 30 });
    if (subtitle) doc.fontSize(9).font('Helvetica').text(subtitle, 0, 38, { align: 'right', width: doc.page.width - 30 });
    doc.fillColor('#1a1a1a');
    return 82;
}

exports.exportReportPDF = async (req, res) => {
    const { type, month, year } = req.query;
    const orgId = req.user.organizationId;

    try {
        const org = orgId ? await prisma.organization.findUnique({ where: { id: orgId } }) : null;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        const m = month ? parseInt(month) : new Date().getMonth() + 1;
        const y = year ? parseInt(year) : new Date().getFullYear();
        const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' });
        const period = `${monthName} ${y}`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${period.replace(/ /g, '-')}.pdf"`);
        doc.pipe(res);

        if (type === 'attendance') {
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 1);
            const records = await prisma.attendance.findMany({
                where: { date: { gte: startDate, lt: endDate }, user: orgId ? { organizationId: orgId } : undefined },
                include: { user: { select: { name: true, department: { select: { name: true } } } } }
            });
            const empMap = {};
            for (const r of records) {
                if (!empMap[r.userId]) empMap[r.userId] = { name: r.user.name, dept: r.user.department?.name || 'N/A', present: 0, half: 0, absent: 0, late: 0, wfh: 0 };
                const e = empMap[r.userId];
                if (r.status === 'PRESENT') e.present++;
                else if (r.status === 'HALF_DAY') e.half++;
                else if (r.status === 'ABSENT') e.absent++;
                if (r.isLate) e.late++;
                if (r.type === 'WFH') e.wfh++;
            }
            let y2 = pdfHeader(doc, org, 'Attendance Report', period);
            doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Records: ${records.length}`, 30, y2);
            y2 += 16;
            const rows = Object.values(empMap).map(e => {
                const total = e.present + e.half + e.absent || 1;
                return [e.name, e.dept, e.present, e.half, e.absent, e.late, e.wfh, `${Math.round(((e.present + e.half * 0.5) / total) * 100)}%`];
            });
            pdfDrawTable(doc, ['Employee', 'Department', 'Present', 'Half Day', 'Absent', 'Late', 'WFH', 'Present %'], rows, 30, y2, [110, 90, 47, 53, 47, 40, 40, 63]);

        } else if (type === 'recruitment') {
            const pipeline = await prisma.application.groupBy({ by: ['status'], _count: { status: true } });
            const totalJobs = await prisma.jobPosting.count();
            const openJobs = await prisma.jobPosting.count({ where: { status: 'OPEN' } });
            let y2 = pdfHeader(doc, org, 'Recruitment Report', period);
            doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Jobs: ${totalJobs}  Open: ${openJobs}`, 30, y2); y2 += 16;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Application Pipeline', 30, y2); y2 += 16;
            y2 = pdfDrawTable(doc, ['Status', 'Count'], pipeline.map(r => [r.status, r._count.status]), 30, y2, [250, 210]);
            const appsPerJob = await prisma.application.groupBy({ by: ['jobId'], _count: { jobId: true }, orderBy: { _count: { jobId: 'desc' } }, take: 10 });
            const jobs = await prisma.jobPosting.findMany({ where: { id: { in: appsPerJob.map(a => a.jobId) } }, select: { id: true, title: true, department: true } });
            const jMap = Object.fromEntries(jobs.map(j => [j.id, j]));
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Top Jobs by Applications', 30, y2); y2 += 16;
            pdfDrawTable(doc, ['Job Title', 'Department', 'Applications'], appsPerJob.map(a => [jMap[a.jobId]?.title || a.jobId, jMap[a.jobId]?.department || '-', a._count.jobId]), 30, y2, [230, 150, 80]);

        } else if (type === 'ess') {
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 1);
            const leavesByType = await prisma.leaveRequest.groupBy({ by: ['type', 'status'], _count: { type: true }, where: { startDate: { gte: startDate, lt: endDate } } });
            const wfhCount = await prisma.attendance.count({ where: { date: { gte: startDate, lt: endDate }, type: 'WFH', user: orgId ? { organizationId: orgId } : undefined } });
            let y2 = pdfHeader(doc, org, 'ESS Report', period);
            doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  WFH Days This Period: ${wfhCount}`, 30, y2); y2 += 16;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Leave Requests by Type & Status', 30, y2); y2 += 16;
            pdfDrawTable(doc, ['Leave Type', 'Status', 'Count'], leavesByType.map(l => [l.type, l.status, l._count.type]), 30, y2, [160, 160, 140]);

        } else if (type === 'servicedesk') {
            const orgFilter = orgId ? { organizationId: orgId } : {};

            let dateFilter = {};
            if (req.query.startDate && req.query.endDate) {
                dateFilter = {
                    createdAt: {
                        gte: new Date(req.query.startDate),
                        lt: new Date(req.query.endDate)
                    }
                };
            }

            const subType = req.query.subType || 'summary';

            if (subType === 'summary') {
                const totalIncs = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, type: 'INCIDENT' } });
                const resolvedIncs = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', status: { in: ['RESOLVED', 'CLOSED'] } } });
                const breached = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, slaBreached: true } });
                const totalChanges = await prisma.changeRequest.count({ where: { ...orgFilter, ...dateFilter } });
                const activeProbs = await prisma.problem.count({ where: { ...orgFilter, ...dateFilter, status: { notIn: ['CLOSED', 'KNOWN_ERROR'] } } });

                let y2 = pdfHeader(doc, org, 'ITIL Service Desk Executive Summary', period);
                doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Incidents: ${totalIncs}  |  Resolved: ${resolvedIncs}`, 30, y2); y2 += 24;

                doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Volume Breakdown', 30, y2); y2 += 16;
                pdfDrawTable(doc, ['Metric', 'Count'], [
                    ['Open Incidents', totalIncs - resolvedIncs],
                    ['SLA Breaches', breached],
                    ['Total Change Requests', totalChanges],
                    ['Active Problems / Known Errors', activeProbs]
                ], 30, y2, [250, 120]);

            } else if (subType === 'incident_monthly') {
                const incidents = await prisma.ticket.findMany({
                    where: { ...orgFilter, ...dateFilter, type: 'INCIDENT' },
                    select: { ticketNumber: true, title: true, status: true, priority: true, createdAt: true },
                    orderBy: { createdAt: 'desc' }
                });
                let y2 = pdfHeader(doc, org, 'Incident Report', period);
                doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Incidents: ${incidents.length}`, 30, y2); y2 += 24;
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Incident Log', 30, y2); y2 += 16;

                const rows = incidents.map(i => [
                    i.ticketNumber,
                    (i.title || '').substring(0, 30) + (i.title?.length > 30 ? '...' : ''),
                    i.status,
                    i.priority,
                    i.createdAt.toLocaleDateString()
                ]);
                pdfDrawTable(doc, ['Ticket #', 'Title', 'Status', 'Priority', 'Logged On'], rows, 30, y2, [70, 200, 80, 70, 80]);

            } else if (subType === 'sla_monthly') {
                const tickets = await prisma.ticket.findMany({
                    where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', slaId: { not: null } },
                    include: { sla: true },
                    orderBy: { createdAt: 'desc' }
                });

                let y2 = pdfHeader(doc, org, 'SLA Compliance Report', period);
                doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total SLA Tracked Tickets: ${tickets.length}`, 30, y2); y2 += 24;
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('SLA Execution Log', 30, y2); y2 += 16;

                const rows = tickets.map(t => [
                    t.ticketNumber,
                    t.sla?.name || 'Default',
                    t.slaBreached ? 'BREACHED' : (['RESOLVED', 'CLOSED'].includes(t.status) ? 'ACCOMPLISHED' : 'IN_PROGRESS'),
                    t.slaResolutionDue ? t.slaResolutionDue.toLocaleDateString() : 'N/A'
                ]);
                pdfDrawTable(doc, ['Ticket #', 'Policy', 'Compliance State', 'Resolution Due'], rows, 30, y2, [80, 180, 130, 110]);

            } else if (subType === 'engineer_wise') {
                const closures = await prisma.ticket.findMany({
                    where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', status: { in: ['RESOLVED', 'CLOSED'] } },
                    include: { assignee: { select: { name: true } } }
                });

                const agentMap = {};
                closures.forEach(t => {
                    const name = t.assignee?.name || 'Unassigned';
                    if (!agentMap[name]) agentMap[name] = 0;
                    agentMap[name]++;
                });

                let y2 = pdfHeader(doc, org, 'Engineer-wise Closure Report', period);
                doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Closures: ${closures.length}`, 30, y2); y2 += 24;
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#top').text('Agent Resolution Scoreboard', 30, y2); y2 += 16;

                const rows = Object.entries(agentMap).sort((a, b) => b[1] - a[1]);
                pdfDrawTable(doc, ['Engineer Name', 'Tickets Resolved'], rows, 30, y2, [250, 150]);

            } else if (subType === 'team_category_wise') {
                const tickets = await prisma.ticket.findMany({
                    where: { ...orgFilter, ...dateFilter },
                    include: { team: { select: { name: true } }, category: { select: { name: true } } }
                });

                const teamCatMap = {};
                tickets.forEach(t => {
                    const teamName = t.team?.name || 'No Team';
                    const catName = t.category?.name || 'Uncategorized';
                    const key = `${teamName} | ${catName}`;
                    if (!teamCatMap[key]) teamCatMap[key] = { team: teamName, category: catName, count: 0 };
                    teamCatMap[key].count++;
                });

                let y2 = pdfHeader(doc, org, 'Team & Category Load Report', period);
                doc.fontSize(8).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}  |  Total Tickets: ${tickets.length}`, 30, y2); y2 += 24;
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#a855f7').text('Assignment Distribution', 30, y2); y2 += 16;

                const rows = Object.values(teamCatMap)
                    .sort((a, b) => b.count - a.count)
                    .map(tc => [tc.team, tc.category, tc.count]);
                pdfDrawTable(doc, ['Assigned Team', 'Ticket Category', 'Volume'], rows, 30, y2, [200, 200, 100]);

            }
        } else {
            doc.text('Unknown report type. Supported: attendance, recruitment, ess', 30, 100);
        }

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
};

// ─── ASSET REPORT ───────────────────────────────────────────────────────────────
exports.getAssetsReport = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const where = orgId ? { organizationId: orgId } : {};

        const total = await prisma.asset.count({ where });
        const assigned = await prisma.asset.count({ where: { ...where, status: 'ASSIGNED' } });
        const inStock = await prisma.asset.count({ where: { ...where, status: 'IN_STOCK' } });
        const retired = await prisma.asset.count({ where: { ...where, status: 'RETIRED' } });

        // By category
        const byCategoryRaw = await prisma.asset.groupBy({
            by: ['category'], _count: { category: true }, where
        });
        const byCategory = byCategoryRaw.map(r => ({ category: r.category, count: r._count.category }));

        // By status
        const byStatusRaw = await prisma.asset.groupBy({
            by: ['status'], _count: { status: true }, where
        });
        const byStatus = byStatusRaw.map(r => ({ status: r.status, count: r._count.status }));

        // Warranty expiring within 90 days or expired
        const now = new Date();
        const in90 = new Date(); in90.setDate(in90.getDate() + 90);
        const expiringAssets = await prisma.asset.findMany({
            where: { ...where, warrantyExpiry: { lte: in90 } },
            select: { name: true, serialNumber: true, warrantyExpiry: true },
            orderBy: { warrantyExpiry: 'asc' }
        });
        const expiringWarranty = expiringAssets.map(a => ({
            name: a.name,
            serialNumber: a.serialNumber,
            daysLeft: Math.ceil((new Date(a.warrantyExpiry) - now) / 86400000)
        }));

        // Top employees with most assigned assets
        const assignedAssets = await prisma.asset.findMany({
            where: { ...where, assignedToId: { not: null } },
            select: { assignedToId: true, assignedTo: { select: { name: true } } }
        });
        const assigneeCount = {};
        assignedAssets.forEach(a => {
            const name = a.assignedTo?.name || a.assignedToId;
            assigneeCount[name] = (assigneeCount[name] || 0) + 1;
        });
        const topAssigned = Object.entries(assigneeCount)
            .sort((a, b) => b[1] - a[1]).slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        res.json({ summary: { total, assigned, inStock, retired }, byCategory, byStatus, expiringWarranty, topAssigned });
    } catch (error) {
        console.error('getAssetsReport error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── LEAVE REPORT ───────────────────────────────────────────────────────────────
exports.getLeavesReport = async (req, res) => {
    try {
        const orgId = req.user.organizationId;

        // Summary counts
        const total = await prisma.leave.count();
        const approved = await prisma.leave.count({ where: { status: 'APPROVED' } });
        const pending = await prisma.leave.count({ where: { status: 'PENDING' } });
        const rejected = await prisma.leave.count({ where: { status: 'REJECTED' } });

        // By type
        const byTypeRaw = await prisma.leave.groupBy({
            by: ['type'], _count: { type: true }
        });
        const byType = byTypeRaw.map(r => ({ type: r.type, count: r._count.type }));

        // Monthly trend (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        const recentLeaves = await prisma.leave.findMany({
            where: { createdAt: { gte: twelveMonthsAgo } },
            select: { createdAt: true }
        });
        const monthlyMap = {};
        recentLeaves.forEach(l => {
            const key = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[key] = (monthlyMap[key] || 0) + 1;
        });
        const monthlyTrend = Object.entries(monthlyMap).sort().map(([month, count]) => ({ month, count }));

        // Leave balance heatmap (top 30 by lowest casual)
        const balances = await prisma.leaveBalance.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { casualLeaves: 'asc' },
            take: 30
        });
        const balanceHeatmap = balances.map(b => ({
            name: b.user?.name || 'Unknown',
            casual: b.casualLeaves ?? 0,
            earned: b.earnedLeaves ?? 0,
            sick: b.sickLeaves ?? 0
        }));

        // Top leave takers (by approved days)
        const approvedLeaves = await prisma.leave.findMany({
            where: { status: 'APPROVED' },
            select: { userId: true, startDate: true, endDate: true, user: { select: { name: true } } }
        });
        const takerMap = {};
        approvedLeaves.forEach(l => {
            const name = l.user?.name || l.userId;
            const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
            takerMap[name] = (takerMap[name] || 0) + days;
        });
        const topTakers = Object.entries(takerMap)
            .sort((a, b) => b[1] - a[1]).slice(0, 10)
            .map(([name, days]) => ({ name, days }));

        res.json({ summary: { total, approved, pending, rejected }, byType, monthlyTrend, balanceHeatmap, topTakers });
    } catch (error) {
        console.error('getLeavesReport error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── SERVICE DESK REPORT (ITIL) ────────────────────────────────────────────────
exports.getServiceDeskReport = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const orgFilter = orgId ? { organizationId: orgId } : {};

        const dateFilter = {};
        if (req.query.startDate && req.query.endDate) {
            dateFilter.createdAt = {
                gte: new Date(req.query.startDate),
                lt: new Date(req.query.endDate)
            };
        }

        // 1. Core Incident Metrics
        const totalIncidents = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, type: 'INCIDENT' } });
        const openIncidents = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } });
        const resolvedIncidents = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', status: { in: ['RESOLVED', 'CLOSED'] } } });

        // 2. Incident Volume by Priority
        const byPriorityRaw = await prisma.ticket.groupBy({
            by: ['priority'], _count: { priority: true },
            where: { ...orgFilter, ...dateFilter, type: 'INCIDENT' }
        });
        const byPriority = byPriorityRaw.map(r => ({ priority: r.priority, count: r._count.priority }));

        // 3. Incident Volume by Status
        const byStatusRaw = await prisma.ticket.groupBy({
            by: ['status'], _count: { status: true },
            where: { ...orgFilter, ...dateFilter, type: 'INCIDENT' }
        });
        const byStatus = byStatusRaw.map(r => ({ status: r.status, count: r._count.status }));

        // 4. SLA Metrics
        const breached = await prisma.ticket.count({ where: { ...orgFilter, ...dateFilter, slaBreached: true } });
        const slaMetrics = [
            { metric: 'Breached', count: breached },
            { metric: 'Accomplished', count: Math.max(0, resolvedIncidents - breached) }
        ];

        // 5. Agent Performance (Top resolving assignees)
        const agentClosures = await prisma.ticket.findMany({
            where: { ...orgFilter, ...dateFilter, type: 'INCIDENT', status: { in: ['RESOLVED', 'CLOSED'] }, assigneeId: { not: null } },
            select: { assignee: { select: { name: true } } }
        });
        const agentMap = {};
        agentClosures.forEach(t => {
            const name = t.assignee?.name || 'Unknown';
            agentMap[name] = (agentMap[name] || 0) + 1;
        });
        const agentPerformance = Object.entries(agentMap)
            .sort((a, b) => b[1] - a[1]).slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // 6. Monthly Ticket Trend (Last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        const recentTickets = await prisma.ticket.findMany({
            where: { ...orgFilter, createdAt: { gte: twelveMonthsAgo } },
            select: { createdAt: true }
        });
        const monthlyMap = {};
        recentTickets.forEach(t => {
            const m = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[m] = (monthlyMap[m] || 0) + 1;
        });
        const ticketTrend = Object.entries(monthlyMap).sort().map(([month, count]) => ({ month, count }));

        // 7. ITIL Distribution (Change & Problem)
        const activeChangesFilter = { ...orgFilter, ...dateFilter };
        const totalChanges = await prisma.changeRequest.count({ where: activeChangesFilter });
        const openChanges = await prisma.changeRequest.count({ where: { ...activeChangesFilter, status: { notIn: ['CLOSED', 'REJECTED', 'IMPLEMENTED'] } } });
        const changesByTypeRaw = await prisma.changeRequest.groupBy({
            by: ['type'], _count: { type: true }, where: activeChangesFilter
        });
        const changesByType = changesByTypeRaw.map(r => ({ type: r.type, count: r._count.type }));

        const totalProblems = await prisma.problem.count({ where: { ...orgFilter, ...dateFilter } });
        const activeProblems = await prisma.problem.count({ where: { ...orgFilter, ...dateFilter, status: { notIn: ['CLOSED', 'KNOWN_ERROR'] } } });

        res.json({
            summary: {
                totalIncidents, openIncidents, resolvedIncidents,
                totalChanges, openChanges, totalProblems, activeProblems
            },
            byPriority,
            byStatus,
            slaMetrics,
            agentPerformance,
            ticketTrend,
            changesByType
        });
    } catch (error) {
        console.error('getServiceDeskReport error:', error);
        res.status(500).json({ message: error.message });
    }
};
