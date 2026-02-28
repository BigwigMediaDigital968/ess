const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateNumber(prefix) {
    const counter = await prisma.serviceDeskCounter.update({
        where: { prefix },
        data: { current: { increment: 1 } },
    });
    return `${prefix}-${String(counter.current).padStart(4, '0')}`;
}

// POST /api/servicedesk/problems
exports.createProblem = async (req, res) => {
    try {
        const { title, description, assigneeId, impact, urgency, priority, categoryId, subcategoryId, assignmentGroupId, linkedIncidentIds } = req.body;
        const organizationId = req.user.organizationId;
        const problemNumber = await generateNumber('P');

        const attachmentUrls = req.files ? req.files.map(f => `/uploads/resumes/${f.filename}`) : [];

        const problem = await prisma.problem.create({
            data: {
                problemNumber, title, description,
                assigneeId: assigneeId || null,
                impact: impact || 'LOW',
                urgency: urgency || 'LOW',
                priority: priority || 'LOW',
                categoryId: categoryId || null,
                subcategoryId: subcategoryId || null,
                assignmentGroupId: assignmentGroupId || null,
                attachmentUrls,
                organizationId,
                activities: {
                    create: [{
                        actorId: req.user.id,
                        action: 'CREATED',
                        newValue: 'Problem record created'
                    }]
                }
            },
            include: {
                category: { select: { name: true } },
                subcategory: { select: { name: true } },
                assignmentGroup: { select: { name: true } },
                assignee: { select: { name: true } }
            }
        });

        let parsedIncidentIds = [];
        if (linkedIncidentIds) {
            try {
                parsedIncidentIds = JSON.parse(linkedIncidentIds);
            } catch (e) { }
        }

        if (parsedIncidentIds && parsedIncidentIds.length > 0) {
            await prisma.ticket.updateMany({
                where: { id: { in: parsedIncidentIds } },
                data: { problemId: problem.id }
            });
            await prisma.problemActivity.create({
                data: {
                    problemId: problem.id,
                    actorId: req.user.id,
                    action: 'INCIDENTS_LINKED',
                    newValue: `${parsedIncidentIds.length} incident(s) linked on creation`
                }
            });
        }

        res.status(201).json({ success: true, data: problem });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create problem', error: err.message });
    }
};

// GET /api/servicedesk/problems
exports.getProblems = async (req, res) => {
    try {
        const { status } = req.query;
        const organizationId = req.user.organizationId;
        const where = { organizationId };
        if (status) where.status = status;

        const data = await prisma.problem.findMany({
            where,
            include: {
                linkedIncidents: { select: { id: true, ticketNumber: true, title: true, status: true, priority: true } },
                kedbEntry: { select: { id: true, title: true } },
                category: { select: { name: true } },
                assignmentGroup: { select: { name: true } },
                assignee: { select: { name: true } },
                _count: { select: { attachments: false, linkedIncidents: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch problems', error: err.message });
    }
};

// GET /api/servicedesk/problems/:id
exports.getProblemById = async (req, res) => {
    try {
        const problem = await prisma.problem.findUnique({
            where: { id: req.params.id },
            include: {
                linkedIncidents: true,
                kedbEntry: true,
                category: true,
                subcategory: true,
                assignmentGroup: { select: { name: true } },
                assignee: { select: { name: true, email: true } },
                activities: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }
            },
        });
        if (!problem) return res.status(404).json({ message: 'Problem not found' });
        res.json({ success: true, data: problem });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch problem', error: err.message });
    }
};

// PUT /api/servicedesk/problems/:id
exports.updateProblem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rootCause, workaround, assigneeId, title, description, impact, urgency, priority, categoryId, subcategoryId, assignmentGroupId } = req.body;

        const problem = await prisma.problem.findUnique({ where: { id } });
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        const updates = {};
        const activitiesToCreate = [];
        const actorId = req.user.id;

        const checkAndLog = (field, newValue, actionLabel) => {
            if (newValue !== undefined && newValue !== problem[field]) {
                updates[field] = newValue;
                activitiesToCreate.push({
                    actorId,
                    action: actionLabel,
                    oldValue: String(problem[field] || 'None'),
                    newValue: String(newValue || 'None')
                });
            }
        };

        checkAndLog('status', status, 'STATUS_CHANGED');
        checkAndLog('impact', impact, 'IMPACT_CHANGED');
        checkAndLog('urgency', urgency, 'URGENCY_CHANGED');
        checkAndLog('priority', priority, 'PRIORITY_CHANGED');
        checkAndLog('categoryId', categoryId, 'CATEGORY_CHANGED');
        checkAndLog('subcategoryId', subcategoryId, 'SUBCATEGORY_CHANGED');
        checkAndLog('assignmentGroupId', assignmentGroupId || null, 'REASSIGNED_GROUP');
        checkAndLog('assigneeId', assigneeId || null, 'REASSIGNED_USER');
        checkAndLog('rootCause', rootCause, 'ROOT_CAUSE_UPDATED');
        checkAndLog('workaround', workaround, 'WORKAROUND_UPDATED');

        if (title) updates.title = title;
        if (description) updates.description = description;

        if (req.files && req.files.length > 0) {
            const newUrls = req.files.map(f => `/uploads/resumes/${f.filename}`);
            updates.attachmentUrls = [...(problem.attachmentUrls || []), ...newUrls];
            activitiesToCreate.push({
                actorId,
                action: 'FILES_UPLOADED',
                newValue: `${req.files.length} file(s) attached`
            });
        }

        const updatedProblem = await prisma.problem.update({
            where: { id },
            data: {
                ...updates,
                ...(activitiesToCreate.length > 0 && {
                    activities: { create: activitiesToCreate }
                })
            }
        });

        res.json({ success: true, data: updatedProblem });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update problem', error: err.message });
    }
};

// POST /api/servicedesk/problems/:id/link-incident
exports.linkIncident = async (req, res) => {
    try {
        const { ticketId } = req.body;
        const { id: problemId } = req.params;

        await prisma.ticket.update({
            where: { id: ticketId },
            data: { problemId },
        });
        res.json({ success: true, message: 'Incident linked to problem' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to link incident', error: err.message });
    }
};

// POST /api/servicedesk/problems/:id/convert-to-known-error
exports.convertToKnownError = async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const { title, symptoms, rootCause, workaround, resolution, articleUrl } = req.body;
        const organizationId = req.user.organizationId;
        const createdById = req.user.id;

        // Update problem status
        await prisma.problem.update({
            where: { id: problemId },
            data: { status: 'KNOWN_ERROR' },
        });

        const kedb = await prisma.kEDBEntry.upsert({
            where: { problemId },
            create: { title, symptoms, rootCause, workaround, resolution, articleUrl, problemId, createdById, organizationId },
            update: { title, symptoms, rootCause, workaround, resolution, articleUrl },
        });
        res.status(201).json({ success: true, data: kedb });
    } catch (err) {
        res.status(500).json({ message: 'Failed to convert to known error', error: err.message });
    }
};
