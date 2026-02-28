const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');

async function generateNumber(prefix) {
    const counter = await prisma.serviceDeskCounter.update({
        where: { prefix },
        data: { current: { increment: 1 } },
    });
    return `${prefix}-${String(counter.current).padStart(4, '0')}`;
}

// POST /api/servicedesk/changes
exports.createChangeRequest = async (req, res) => {
    try {
        const {
            title, description, risk = 'LOW',
            plannedStart, plannedEnd, rollbackPlan, cabMeetingDate,
            type = 'NORMAL', impact = 'LOW', urgency = 'LOW',
            justification, implementationPlan, testPlan,
            assignmentGroupId, implementerId,
            linkedCIIds, cabApproverIds
        } = req.body;
        const requesterId = req.user.id;
        const organizationId = req.user.organizationId;

        // Restriction Check: Must be Platform Operations OR Manager
        const isPlatformOps = req.user.department?.name === 'Platform Operations';
        const isManager = req.user.role?.name === 'Manager';
        if (!isPlatformOps && !isManager) {
            return res.status(403).json({ message: 'RFC submission is restricted to Platform Operations or Managers.' });
        }

        // CAB Approver Rules
        const approverList = cabApproverIds ? (Array.isArray(cabApproverIds) ? cabApproverIds : [cabApproverIds]) : [];
        if (type === 'NORMAL' && approverList.length < 2) {
            return res.status(400).json({ message: 'Normal Changes require at least 2 CAB Approvers.' });
        }
        if (type === 'EMERGENCY' && approverList.length < 3) {
            return res.status(400).json({ message: 'Emergency Changes require at least 3 CAB Approvers (Admin + 2 Managers).' });
        }

        const changeNumber = await generateNumber('C');
        const attachmentUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

        // Connect linked configuration items if provided during creation
        let ciConnections = [];
        if (linkedCIIds) {
            const ciIds = Array.isArray(linkedCIIds) ? linkedCIIds : [linkedCIIds];
            ciConnections = ciIds.map(id => ({ ciId: id }));
        }

        // Prepare approvals
        const approvalConnections = approverList.map(id => ({ approverId: id, status: 'PENDING' }));

        const change = await prisma.changeRequest.create({
            data: {
                changeNumber, title, description, risk,
                type, impact, urgency,
                justification: justification || null,
                implementationPlan: implementationPlan || null,
                testPlan: testPlan || null,
                requesterId, organizationId,
                assignmentGroupId: assignmentGroupId || null,
                implementerId: implementerId || null,
                plannedStart: plannedStart ? new Date(plannedStart) : null,
                plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
                cabMeetingDate: cabMeetingDate ? new Date(cabMeetingDate) : null,
                rollbackPlan: rollbackPlan || null,
                attachmentUrls,
                linkedCIs: { create: ciConnections },
                approvers: { create: approvalConnections },
                activities: {
                    create: [{
                        actorId: requesterId,
                        action: 'CREATED_CHANGE_REQUEST',
                        newValue: type
                    }]
                }
            },
            include: {
                comments: true, linkedCIs: { include: { ci: true } },
                approvers: { include: { approver: { select: { name: true, email: true } } } },
                activities: { include: { actor: { select: { name: true } } } },
                assignmentGroup: { select: { name: true } },
                implementer: { select: { name: true } }
            },
        });
        res.status(201).json({ success: true, data: change });
    } catch (err) {
        console.error('createChangeRequest error:', err);
        res.status(500).json({ message: 'Failed to create change request', error: err.message });
    }
};

// GET /api/servicedesk/changes
exports.getChanges = async (req, res) => {
    try {
        const { status, risk, page = 1, limit = 20 } = req.query;
        const organizationId = req.user.organizationId;

        const where = { organizationId };
        if (status) where.status = status;
        if (risk) where.risk = risk;

        const [data, total] = await Promise.all([
            prisma.changeRequest.findMany({
                where,
                include: {
                    linkedCIs: { include: { ci: { select: { id: true, ciNumber: true, name: true } } } },
                    comments: true,
                    approvers: { include: { approver: { select: { name: true, email: true } } } },
                    assignmentGroup: { select: { name: true } },
                    implementer: { select: { name: true } },
                    _count: { select: { linkedTickets: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            prisma.changeRequest.count({ where }),
        ]);
        res.json({ success: true, data, total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch changes', error: err.message });
    }
};

// GET /api/servicedesk/changes/:id
exports.getChangeById = async (req, res) => {
    try {
        const change = await prisma.changeRequest.findUnique({
            where: { id: req.params.id },
            include: {
                linkedTickets: {
                    select: { id: true, ticketNumber: true, title: true, status: true, priority: true },
                },
                linkedCIs: { include: { ci: true } },
                comments: { orderBy: { createdAt: 'asc' } },
                approvers: { include: { approver: { select: { name: true, email: true } } } },
                activities: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
                assignmentGroup: { select: { name: true } },
                implementer: { select: { name: true } }
            },
        });
        if (!change) return res.status(404).json({ message: 'Change request not found' });
        res.json({ success: true, data: change });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch change', error: err.message });
    }
};

// PUT /api/servicedesk/changes/:id
exports.updateChange = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status, risk, approvedById, actualStart, actualEnd, pirNotes,
            plannedStart, plannedEnd, cabMeetingDate, rollbackPlan, title, description,
            type, impact, urgency, justification, implementationPlan, testPlan,
            assignmentGroupId, implementerId
        } = req.body;

        const existing = await prisma.changeRequest.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Change request not found' });

        const updates = {};
        const activities = [];
        const actorId = req.user.id;

        if (status && status !== existing.status) {
            updates.status = status;
            activities.push({ actorId, action: 'STATUS_CHANGED', oldValue: existing.status, newValue: status });
        }
        if (assignmentGroupId && assignmentGroupId !== existing.assignmentGroupId) {
            updates.assignmentGroupId = assignmentGroupId;
            activities.push({ actorId, action: 'ASSIGNMENT_GROUP_CHANGED', newValue: assignmentGroupId });
        }
        if (implementerId && implementerId !== existing.implementerId) {
            updates.implementerId = implementerId;
            activities.push({ actorId, action: 'IMPLEMENTER_ASSIGNED', newValue: implementerId });
        }

        const newAttachments = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        if (newAttachments.length > 0) {
            updates.attachmentUrls = { push: newAttachments };
            activities.push({ actorId, action: 'FILES_UPLOADED', newValue: `${newAttachments.length} files` });
        }

        if (risk) updates.risk = risk;
        if (type) updates.type = type;
        if (impact) updates.impact = impact;
        if (urgency) updates.urgency = urgency;
        if (approvedById) updates.approvedById = approvedById;
        if (actualStart) updates.actualStart = new Date(actualStart);
        if (actualEnd) updates.actualEnd = new Date(actualEnd);
        if (pirNotes !== undefined) updates.pirNotes = pirNotes;
        if (plannedStart) updates.plannedStart = new Date(plannedStart);
        if (plannedEnd) updates.plannedEnd = new Date(plannedEnd);
        if (cabMeetingDate) updates.cabMeetingDate = new Date(cabMeetingDate);
        if (rollbackPlan !== undefined) updates.rollbackPlan = rollbackPlan;
        if (justification !== undefined) updates.justification = justification;
        if (implementationPlan !== undefined) updates.implementationPlan = implementationPlan;
        if (testPlan !== undefined) updates.testPlan = testPlan;
        if (title) updates.title = title;
        if (description !== undefined) updates.description = description;

        // Auto-log any updates
        if (activities.length > 0) {
            updates.activities = { create: activities };
        }

        const change = await prisma.changeRequest.update({
            where: { id },
            data: updates,
            include: { activities: { include: { actor: { select: { name: true } } } } }
        });
        res.json({ success: true, data: change });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update change', error: err.message });
    }
};

// POST /api/servicedesk/changes/:id/approve
exports.approveChange = async (req, res) => {
    try {
        const { id: changeRequestId } = req.params;
        const { status, comments } = req.body;
        const approverId = req.user.id;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid approval status' });
        }

        const approval = await prisma.changeApproval.update({
            where: { changeRequestId_approverId: { changeRequestId, approverId } },
            data: { status, comments, approvedAt: new Date() },
        });

        // Log Approval Event
        await prisma.changeActivity.create({
            data: {
                changeRequestId, actorId: approverId,
                action: status === 'APPROVED' ? 'VOTED_APPROVE' : 'VOTED_REJECT',
                newValue: comments || null
            }
        });

        res.json({ success: true, data: approval });
    } catch (err) {
        if (err.code === 'P2025') return res.status(403).json({ message: 'You are not assigned as an approver for this RFC.' });
        res.status(500).json({ message: 'Failed to process CAB approval', error: err.message });
    }
};

// POST /api/servicedesk/changes/:id/comments
exports.addChangeComment = async (req, res) => {
    try {
        const { body } = req.body;
        const { id: changeRequestId } = req.params;
        const authorId = req.user.id;
        if (!body?.trim()) return res.status(400).json({ message: 'Comment body is required' });

        const comment = await prisma.changeComment.create({
            data: { changeRequestId, authorId, body },
        });
        res.status(201).json({ success: true, data: comment });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add comment', error: err.message });
    }
};

// POST /api/servicedesk/changes/:id/link-ci
exports.linkCI = async (req, res) => {
    try {
        const { ciId } = req.body;
        const { id: changeRequestId } = req.params;

        const link = await prisma.changeRequestCI.create({
            data: { changeRequestId, ciId },
            include: { ci: true },
        });
        res.status(201).json({ success: true, data: link });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ message: 'CI already linked' });
        res.status(500).json({ message: 'Failed to link CI', error: err.message });
    }
};

// GET /api/servicedesk/changes/:id/pdf
exports.exportChangePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const change = await prisma.changeRequest.findUnique({
            where: { id },
            include: {
                requester: { select: { name: true, email: true, department: { select: { name: true } } } },
                implementer: { select: { name: true } },
                assignmentGroup: { select: { name: true } },
                approvers: { include: { approver: { select: { name: true } } } },
                linkedCIs: { include: { ci: { select: { name: true } } } }
            }
        });

        if (!change) return res.status(404).json({ message: 'RFC not found' });

        const org = await prisma.organization.findUnique({ where: { id: change.organizationId } });

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="RFC-${change.changeNumber}.pdf"`);
        doc.pipe(res);

        // Header
        doc.rect(0, 0, doc.page.width, 70).fill('#a855f7');
        doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(org?.name || 'ESS Portal', 40, 15);
        doc.fontSize(10).font('Helvetica').text('CHANGE MANAGEMENT RECORD', 40, 42);
        doc.fontSize(16).font('Helvetica-Bold').text(change.changeNumber, 0, 20, { align: 'right', width: doc.page.width - 40 });
        doc.fontSize(10).font('Helvetica').text(`Status: ${change.status}`, 0, 42, { align: 'right', width: doc.page.width - 40 });

        doc.fillColor('#1a1a1a');
        let y = 90;

        // Title
        doc.fontSize(14).font('Helvetica-Bold').text('Change Request Details', 40, y); y += 20;
        doc.fontSize(11).font('Helvetica').text(`Title: ${change.title}`, 40, y); y += 15;
        doc.text(`Requester: ${change.requester?.name || 'Unknown'} (${change.requester?.department?.name || 'N/A'})`, 40, y); y += 15;
        doc.text(`Implementer: ${change.implementer?.name || 'Unassigned'} | Group: ${change.assignmentGroup?.name || 'Unassigned'}`, 40, y); y += 20;

        // Metadata grid
        doc.font('Helvetica-Bold').text('Classification:', 40, y); y += 15;
        doc.font('Helvetica').text(`Type: ${change.type}  |  Risk: ${change.risk}  |  Impact: ${change.impact}  |  Urgency: ${change.urgency}`, 40, y); y += 25;

        // Dates
        doc.font('Helvetica-Bold').text('Schedule:', 40, y); y += 15;
        doc.font('Helvetica');
        if (change.plannedStart) doc.text(`Planned Start: ${change.plannedStart.toLocaleString()}`, 40, y); y += 15;
        if (change.plannedEnd) doc.text(`Planned End: ${change.plannedEnd.toLocaleString()}`, 40, y); y += 15;
        if (change.actualStart) doc.text(`Actual Start: ${change.actualStart.toLocaleString()}`, 40, y); y += 15;
        if (change.actualEnd) doc.text(`Actual End: ${change.actualEnd.toLocaleString()}`, 40, y); y += 20;

        // Long text fields
        const addSection = (title, text) => {
            if (!text) return;
            if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
            doc.font('Helvetica-Bold').text(title, 40, y); y += 15;
            doc.font('Helvetica').text(text, 40, y, { width: doc.page.width - 80 });
            y = doc.y + 20;
        };

        addSection('Description', change.description);
        addSection('Justification', change.justification);
        addSection('Implementation Plan', change.implementationPlan);
        addSection('Rollback Plan', change.rollbackPlan);
        addSection('Test Plan', change.testPlan);

        // Approvers
        if (change.approvers.length > 0) {
            if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
            doc.font('Helvetica-Bold').text('CAB Approvals', 40, y); y += 15;
            change.approvers.forEach(a => {
                doc.font('Helvetica').text(`• ${a.approver.name} - ${a.status}`, 50, y); y += 15;
            });
            y += 10;
        }

        // Linked CIs
        if (change.linkedCIs.length > 0) {
            if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
            doc.font('Helvetica-Bold').text('Linked Configuration Items', 40, y); y += 15;
            change.linkedCIs.forEach(l => {
                doc.font('Helvetica').text(`• ${l.ci.name}`, 50, y); y += 15;
            });
        }

        doc.fontSize(8).fillColor('#888').text(`Generated on ${new Date().toLocaleString()} by ESS System`, 40, doc.page.height - 40);

        doc.end();

    } catch (err) {
        console.error('exportChangePDF error:', err);
        if (!res.headersSent) res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
    }
};
