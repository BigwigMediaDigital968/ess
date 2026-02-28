const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Salary Slip PDF Data Endpoint ───────────────────────────────────────────
// Returns all data needed to render a beautiful salary slip.
// The frontend renders it as HTML and uses jsPDF/html2canvas to download.
// Also sends a chat message with a download link to the employee's DM.

exports.getSalarySlipData = async (req, res) => {
    try {
        const { month, year, userId: queryUserId } = req.query;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;

        // Default to self if not specified
        let targetUserId = requesterId;

        // If trying to view someone else's slip
        if (queryUserId && queryUserId !== requesterId) {
            const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) || req.user.isOwner;

            if (isPrivileged) {
                targetUserId = queryUserId;
            } else {
                // Check if Manager viewing direct report
                const targetUser = await prisma.user.findUnique({
                    where: { id: queryUserId },
                    select: { managerId: true }
                });

                if (targetUser && targetUser.managerId === requesterId) {
                    targetUserId = queryUserId;
                } else {
                    return res.status(403).json({ message: "Access denied: You can only view salary slips for your direct reports." });
                }
            }
        }

        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        // Get employee info
        const employee = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                department: { select: { name: true } },
                manager: { select: { name: true } },
                salaryStructure: true,
            }
        });

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Get payroll record for this month
        const payrollRecord = await prisma.payrollRecord.findFirst({
            where: { userId: targetUserId, month: m, year: y }
        });

        // Get attendance for this month
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59);
        const attendanceRecords = await prisma.attendance.findMany({
            where: { userId: targetUserId, date: { gte: startOfMonth, lte: endOfMonth } }
        });

        const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'WFH').length;
        const lopDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;

        // Get org info
        const org = await prisma.organization.findFirst();

        // Build salary components
        const ss = employee.salaryStructure;
        const basic = ss?.basic || 0;
        const hra = ss?.hra || 0;
        const da = ss?.da || 0;
        const travel = ss?.travelAllowance || 0;
        const medical = ss?.medicalAllowance || 0;
        const special = ss?.specialAllowance || 0;
        const bonus = ss?.bonus || 0;
        const grossEarnings = basic + hra + da + travel + medical + special + bonus;

        const pfEmployee = payrollRecord?.pfEmployee || Math.round(Math.min(basic, 15000) * 0.12);
        const pt = payrollRecord?.professionalTax || (basic > 10000 ? 200 : 0);
        const tds = payrollRecord?.tds || 0;
        const totalDeductions = pfEmployee + pt + tds;
        const netPay = payrollRecord?.netPay || (grossEarnings - totalDeductions);

        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        res.json({
            employee: {
                id: employee.employeeId || employee.id.slice(0, 8).toUpperCase(),
                name: employee.name,
                designation: employee.designation || 'Employee',
                department: employee.department?.name || 'General',
                manager: employee.manager?.name || '—',
                email: employee.email,
                profilePictureUrl: employee.profilePictureUrl,
            },
            org: {
                name: org?.name || 'Bigwig Media',
                address: org?.address || '',
                logoUrl: org?.logoUrl || null,
            },
            period: { month: m, year: y, monthName: MONTHS[m - 1] },
            attendance: {
                totalDays: new Date(y, m, 0).getDate(),
                presentDays,
                lopDays,
                workingDays: presentDays,
            },
            earnings: [
                { label: 'Basic Salary', amount: basic },
                { label: 'House Rent Allowance (HRA)', amount: hra },
                { label: 'Dearness Allowance (DA)', amount: da },
                { label: 'Travel Allowance', amount: travel },
                { label: 'Medical Allowance', amount: medical },
                { label: 'Special Allowance', amount: special },
                { label: 'Performance Bonus', amount: bonus },
            ].filter(e => e.amount > 0),
            deductions: [
                { label: 'Provident Fund (Employee)', amount: pfEmployee },
                { label: 'Professional Tax', amount: pt },
                { label: 'TDS (Income Tax)', amount: tds },
            ].filter(d => d.amount > 0),
            summary: {
                grossEarnings,
                totalDeductions,
                netPay,
                annualCTC: (grossEarnings + Math.round(Math.min(basic, 15000) * 0.12)) * 12,
            }
        });
    } catch (error) {
        console.error('getSalarySlipData error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Send Salary Slip to Chat ─────────────────────────────────────────────────
exports.sendSalarySlipToChat = async (req, res) => {
    try {
        const { month, year, userId: targetUserId } = req.body;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) || req.user.isOwner;

        // HR/Admin can send to any employee; employee can only send to themselves
        const recipientId = isPrivileged && targetUserId ? targetUserId : requesterId;

        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();
        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Find or create a direct conversation between HR and the employee
        // (or a self-conversation for the employee)
        let conversation;

        if (isPrivileged && targetUserId && targetUserId !== requesterId) {
            // Find existing DM between HR and employee
            const existing = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    participants: {
                        every: { userId: { in: [requesterId, recipientId] } }
                    }
                },
                include: { participants: true }
            });

            if (existing && existing.participants.length === 2) {
                conversation = existing;
            } else {
                conversation = await prisma.conversation.create({
                    data: {
                        type: 'DIRECT',
                        participants: {
                            create: [
                                { userId: requesterId },
                                { userId: recipientId }
                            ]
                        }
                    }
                });
            }
        } else {
            // Employee's own DM with HR (find any HR user)
            const hrUser = await prisma.user.findFirst({
                where: { LegacyRole: 'HR', isActive: true }
            });

            if (hrUser) {
                const existing = await prisma.conversation.findFirst({
                    where: {
                        type: 'DIRECT',
                        participants: {
                            every: { userId: { in: [requesterId, hrUser.id] } }
                        }
                    },
                    include: { participants: true }
                });

                if (existing && existing.participants.length === 2) {
                    conversation = existing;
                } else {
                    conversation = await prisma.conversation.create({
                        data: {
                            type: 'DIRECT',
                            participants: {
                                create: [
                                    { userId: requesterId },
                                    { userId: hrUser.id }
                                ]
                            }
                        }
                    });
                }
            }
        }

        if (!conversation) {
            return res.status(400).json({ message: 'Could not find or create conversation' });
        }

        // Send a message with the salary slip download link
        const slipUrl = `/api/salary/slip-pdf?month=${m}&year=${y}&userId=${recipientId}`;
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: requesterId,
                content: `📄 **Salary Slip — ${MONTHS[m - 1]} ${y}**\n\nYour salary slip for ${MONTHS[m - 1]} ${y} is ready. Click the link below to download your PDF.\n\n🔗 [Download Salary Slip](${slipUrl})`,
                type: 'TEXT',
            }
        });

        res.json({ message: 'Salary slip sent to chat', conversationId: conversation.id, messageId: message.id });
    } catch (error) {
        console.error('sendSalarySlipToChat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.downloadSalarySlipPdf = async (req, res) => {
    try {
        const { month, year, userId: queryUserId } = req.query;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        let targetUserId = requesterId;

        if (queryUserId && queryUserId !== requesterId) {
            const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) || req.user.isOwner;
            if (isPrivileged) targetUserId = queryUserId;
            else {
                const targetUser = await prisma.user.findUnique({ where: { id: queryUserId }, select: { managerId: true } });
                if (targetUser && targetUser.managerId === requesterId) targetUserId = queryUserId;
                else return res.status(403).json({ message: "Access denied." });
            }
        }

        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();
        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const employee = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                department: true,
                manager: true,
                salaryStructure: true,
                assignedOffice: true
            }
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const payrollRecord = await prisma.payrollRecord.findFirst({ where: { userId: targetUserId, month: m, year: y } });
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59);
        const attendanceRecords = await prisma.attendance.findMany({
            where: { userId: targetUserId, date: { gte: startOfMonth, lte: endOfMonth } }
        });

        const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'WFH').length;
        const lopDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;
        const totalDays = new Date(y, m, 0).getDate();

        const org = await prisma.organization.findFirst();

        const ss = employee.salaryStructure;
        const basic = ss?.basic || 0;
        const hra = ss?.hra || 0;
        const da = ss?.da || 0;
        const travel = ss?.travelAllowance || 0;
        const medical = ss?.medicalAllowance || 0;
        const special = ss?.specialAllowance || 0;
        const bonus = ss?.bonus || 0;
        const grossEarnings = basic + hra + da + travel + medical + special + bonus;

        const pfEmployee = payrollRecord?.pfEmployee || Math.round(Math.min(basic, 15000) * 0.12);
        const pt = payrollRecord?.professionalTax || (basic > 10000 ? 200 : 0);
        const tds = payrollRecord?.tds || 0;
        const totalDeductions = pfEmployee + pt + tds;
        const netPay = payrollRecord?.netPay || (grossEarnings - totalDeductions);

        const inr = (v) => `INR ${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-disposition', `attachment; filename=SalarySlip_${employee.name.replace(/\s+/g, '_')}_${MONTHS[m - 1]}_${y}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        const PAGE_WIDTH = 595;
        const CONTENT_WIDTH = PAGE_WIDTH - 100; // 50 left + 50 right margin
        const LEFT = 50;

        // ─── HEADER BAND ──────────────────────────────────────────────────────
        // Deep purple gradient using stacked rect trick
        doc.rect(0, 0, PAGE_WIDTH, 120).fill('#1e0544');
        doc.rect(0, 80, PAGE_WIDTH, 40).fill('#2d1260');

        // Try to load org logo from filesystem
        const logoPath = org?.logoUrl ? path.join(process.cwd(), 'uploads', path.basename(org.logoUrl)) : null;
        if (logoPath && fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, LEFT, 12, { height: 48, fit: [160, 48] });
            } catch (e) { /* Logo load failed silently */ }
        }

        // Company name & address on right side
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
            .text(org?.name || 'Binary Semantics Limited', LEFT + 170, 16, { width: 330, align: 'right' });

        // Office address: use employee's assigned office address, or org address
        const officeAddress = employee.assignedOffice?.address || org?.address || 'Plot 38, Sector 18, Udyog Vihar, Gurugram, Haryana 122015';
        doc.font('Helvetica').fontSize(8).fillColor('#c4b5fd')
            .text(officeAddress, LEFT + 170, 40, { width: 330, align: 'right' });
        if (org?.website) {
            doc.text(org.website, LEFT + 170, 62, { width: 330, align: 'right' });
        }

        // Slip title bar
        doc.rect(0, 90, PAGE_WIDTH, 30).fill('#6d28d9');
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
            .text(`SALARY SLIP — ${MONTHS[m - 1].toUpperCase()} ${y}`, 0, 98, { align: 'center' });

        // ─── EMPLOYEE INFO GRID ───────────────────────────────────────────────
        let Y = 135;
        doc.fillColor('#000000');

        // Light purple info section background
        doc.rect(LEFT, Y, CONTENT_WIDTH, 90).fillAndStroke('#f3f0ff', '#8b5cf6');

        const infoLeft = [
            ['Employee ID', employee.employeeId || employee.id.slice(0, 8).toUpperCase()],
            ['Name', employee.name],
            ['Designation', employee.designation || 'Employee'],
            ['Department', employee.department?.name || 'General'],
        ];
        const infoRight = [
            ['PAN Number', employee.panNumber || '—'],
            ['UFN', employee.ufn || '—'],
            ['Manager', employee.manager?.name || '—'],
            ['Tax Regime', 'New Regime (FY 2025-26)'],
        ];

        const colW = CONTENT_WIDTH / 2;
        infoLeft.forEach(([label, value], i) => {
            const rowY = Y + 8 + i * 20;
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#5b21b6').text(label + ':', LEFT + 8, rowY);
            doc.font('Helvetica').fontSize(9).fillColor('#1e1b4b').text(value, LEFT + 8 + 80, rowY);
        });
        infoRight.forEach(([label, value], i) => {
            const rowY = Y + 8 + i * 20;
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#5b21b6').text(label + ':', LEFT + colW + 8, rowY);
            doc.font('Helvetica').fontSize(9).fillColor('#1e1b4b').text(value, LEFT + colW + 8 + 80, rowY);
        });

        // ─── ATTENDANCE ROW ───────────────────────────────────────────────────
        Y += 98;
        doc.rect(LEFT, Y, CONTENT_WIDTH, 24).fill('#4c1d95');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('ATTENDANCE & PERIOD', LEFT + 8, Y + 7);

        Y += 24;
        doc.rect(LEFT, Y, CONTENT_WIDTH, 20).fill('#ede9fe');
        const attItems = [
            `Working Days: ${totalDays}`,
            `Present Days: ${presentDays}`,
            `LOP Days: ${lopDays}`,
            `Pay Period: ${MONTHS[m - 1]} ${y}`
        ];
        attItems.forEach((item, i) => {
            doc.font('Helvetica').fontSize(8).fillColor('#374151')
                .text(item, LEFT + 8 + i * (CONTENT_WIDTH / 4), Y + 6, { width: CONTENT_WIDTH / 4 - 4 });
        });

        // ─── EARNINGS & DEDUCTIONS TABLE ──────────────────────────────────────
        Y += 30;
        const halfW = (CONTENT_WIDTH - 4) / 2;

        // Header rows
        doc.rect(LEFT, Y, halfW, 20).fill('#059669'); // green for earnings
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('EARNINGS', LEFT + 8, Y + 6)
            .text('AMOUNT (₹)', LEFT + halfW - 75, Y + 6);

        doc.rect(LEFT + halfW + 4, Y, halfW, 20).fill('#dc2626'); // red for deductions
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('DEDUCTIONS', LEFT + halfW + 12, Y + 6)
            .text('AMOUNT (₹)', LEFT + halfW + 4 + halfW - 75, Y + 6);

        Y += 20;

        const eItems = [
            ['Basic Salary', basic], ['HRA', hra], ['DA', da],
            ['Travel Allowance', travel], ['Medical Allowance', medical],
            ['Special Allowance', special], ['Performance Bonus', bonus]
        ].filter(i => i[1] > 0);

        const dItems = [
            ['Provident Fund (EE)', pfEmployee],
            ['Professional Tax', pt],
            ['TDS (Income Tax)', tds]
        ].filter(i => i[1] > 0);

        const maxRows = Math.max(eItems.length, dItems.length);

        for (let i = 0; i < maxRows; i++) {
            const bg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';
            doc.rect(LEFT, Y, halfW, 18).fill(bg);
            const dbg = i % 2 === 0 ? '#fff1f2' : '#ffffff';
            doc.rect(LEFT + halfW + 4, Y, halfW, 18).fill(dbg);

            if (eItems[i]) {
                doc.font('Helvetica').fontSize(8).fillColor('#111827')
                    .text(eItems[i][0], LEFT + 8, Y + 5)
                    .text(eItems[i][1].toLocaleString('en-IN'), LEFT + halfW - 75, Y + 5, { width: 67, align: 'right' });
            }
            if (dItems[i]) {
                doc.font('Helvetica').fontSize(8).fillColor('#111827')
                    .text(dItems[i][0], LEFT + halfW + 12, Y + 5)
                    .text(dItems[i][1].toLocaleString('en-IN'), LEFT + halfW + 4 + halfW - 75, Y + 5, { width: 67, align: 'right' });
            }
            Y += 18;
        }

        // Totals row
        doc.rect(LEFT, Y, halfW, 20).fill('#d1fae5');
        doc.rect(LEFT + halfW + 4, Y, halfW, 20).fill('#fee2e2');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46')
            .text('GROSS EARNINGS', LEFT + 8, Y + 6)
            .text(grossEarnings.toLocaleString('en-IN'), LEFT + halfW - 75, Y + 6, { width: 67, align: 'right' });
        doc.fillColor('#991b1b')
            .text('TOTAL DEDUCTIONS', LEFT + halfW + 12, Y + 6)
            .text(totalDeductions.toLocaleString('en-IN'), LEFT + halfW + 4 + halfW - 75, Y + 6, { width: 67, align: 'right' });

        // ─── NET PAY BOX ─────────────────────────────────────────────────────
        Y += 28;
        doc.rect(LEFT, Y, CONTENT_WIDTH, 34).fill('#0d9488'); // teal
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
            .text('NET PAY  ₹' + netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                LEFT + 10, Y + 10, { align: 'center', width: CONTENT_WIDTH - 20 });

        // ─── FOOTER ──────────────────────────────────────────────────────────
        Y += 44;
        doc.rect(LEFT, Y, CONTENT_WIDTH, 1).fill('#d1d5db');
        Y += 8;
        doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
            .text('This is a computer-generated payslip and does not require a signature.', LEFT, Y, { align: 'center', width: CONTENT_WIDTH });
        if (org?.gstNumber) {
            Y += 12;
            doc.text(`GSTIN: ${org.gstNumber}`, LEFT, Y, { align: 'center', width: CONTENT_WIDTH });
        }

        doc.end();
    } catch (error) {
        console.error('downloadSalarySlipPdf error:', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
