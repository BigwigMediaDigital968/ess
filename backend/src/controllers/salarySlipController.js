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
