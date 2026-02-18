const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helper: get manager's team member IDs ────────────────────────────────────
const getTeamMemberIds = async (managerId) => {
    const team = await prisma.user.findMany({
        where: { managerId, isActive: true },
        select: { id: true }
    });
    return team.map(u => u.id);
};

// ─── Get or create current quarter cycle ─────────────────────────────────────
exports.getCurrentCycle = async (req, res) => {
    try {
        const now = new Date();
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        const year = now.getFullYear();

        let cycle = await prisma.appraisalCycle.findUnique({
            where: { quarter_year: { quarter, year } },
            include: {
                goals: {
                    include: {
                        user: { select: { id: true, name: true, designation: true, department: { select: { name: true } } } },
                        setBy: { select: { id: true, name: true } }
                    }
                },
                reviews: {
                    include: {
                        user: { select: { id: true, name: true, designation: true, department: { select: { name: true } } } },
                        manager: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!cycle) {
            cycle = await prisma.appraisalCycle.create({
                data: { quarter, year, status: 'OPEN' },
                include: { goals: true, reviews: true }
            });
        }

        // Scope data based on role
        const userId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || req.user.isOwner;
        const isManager = role === 'MANAGER' || req.user.role?.type === 'LEADERSHIP';

        let filteredGoals = cycle.goals;
        let filteredReviews = cycle.reviews;

        if (isManager && !isPrivileged) {
            const teamIds = await getTeamMemberIds(userId);
            filteredGoals = cycle.goals.filter(g => teamIds.includes(g.userId));
            filteredReviews = cycle.reviews.filter(r => teamIds.includes(r.userId));
        } else if (!isPrivileged) {
            // Employee: only their own
            filteredGoals = cycle.goals.filter(g => g.userId === userId);
            filteredReviews = cycle.reviews.filter(r => r.userId === userId);
        }

        res.json({ ...cycle, goals: filteredGoals, reviews: filteredReviews });
    } catch (error) {
        console.error('getCurrentCycle error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── List all cycles (HR/Owner) ───────────────────────────────────────────────
exports.listCycles = async (req, res) => {
    try {
        const cycles = await prisma.appraisalCycle.findMany({
            orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
            include: {
                _count: { select: { goals: true, reviews: true } }
            }
        });
        res.json(cycles);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Update cycle status (HR/Owner) ──────────────────────────────────────────
exports.updateCycleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const cycle = await prisma.appraisalCycle.update({
            where: { id },
            data: { status }
        });
        res.json(cycle);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Set Goals (Manager) ──────────────────────────────────────────────────────
exports.setGoals = async (req, res) => {
    try {
        const { cycleId, userId, goals } = req.body;
        const managerId = req.user.id;

        // Verify userId is in manager's team
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || req.user.isOwner;
        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            if (!teamIds.includes(userId)) {
                return res.status(403).json({ message: 'You can only set goals for your direct reports' });
            }
        }

        // Delete existing goals for this user in this cycle, then recreate
        await prisma.appraisalGoal.deleteMany({ where: { cycleId, userId } });

        const created = await prisma.appraisalGoal.createMany({
            data: goals.map(g => ({
                cycleId,
                userId,
                setById: managerId,
                title: g.title,
                description: g.description || null,
                weight: g.weight || 100 / goals.length,
                status: 'PENDING'
            }))
        });

        res.json({ message: `${created.count} goals set`, count: created.count });
    } catch (error) {
        console.error('setGoals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Update Goal Status (Manager) ────────────────────────────────────────────
exports.updateGoalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const goal = await prisma.appraisalGoal.update({
            where: { id },
            data: { status }
        });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Self Assessment (Employee) ───────────────────────────────────────────────
exports.submitSelfAssessment = async (req, res) => {
    try {
        const { cycleId, selfRating, selfComment } = req.body;
        const userId = req.user.id;

        // Find manager
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { managerId: true }
        });

        const review = await prisma.appraisalReview.upsert({
            where: { cycleId_userId: { cycleId, userId } },
            create: {
                cycleId,
                userId,
                managerId: employee?.managerId || null,
                selfRating,
                selfComment,
                selfSubmittedAt: new Date(),
                status: 'SELF_DONE'
            },
            update: {
                selfRating,
                selfComment,
                selfSubmittedAt: new Date(),
                status: 'SELF_DONE'
            }
        });

        res.json(review);
    } catch (error) {
        console.error('submitSelfAssessment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Manager Review ───────────────────────────────────────────────────────────
exports.submitManagerReview = async (req, res) => {
    try {
        const { reviewId, managerRating, managerComment, managerApproved } = req.body;
        const managerId = req.user.id;

        const existing = await prisma.appraisalReview.findUnique({ where: { id: reviewId } });
        if (!existing) return res.status(404).json({ message: 'Review not found' });

        // Scope check: manager can only review their team
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || req.user.isOwner;
        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            if (!teamIds.includes(existing.userId)) {
                return res.status(403).json({ message: 'You can only review your direct reports' });
            }
        }

        const review = await prisma.appraisalReview.update({
            where: { id: reviewId },
            data: {
                managerRating,
                managerComment,
                managerApproved: managerApproved || false,
                managerReviewedAt: new Date(),
                managerId,
                status: managerApproved ? 'MANAGER_DONE' : 'SELF_DONE'
            }
        });

        res.json(review);
    } catch (error) {
        console.error('submitManagerReview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── HR: Set Salary Hike & Approve ───────────────────────────────────────────
exports.hrApproveAndSetHike = async (req, res) => {
    try {
        const { reviewId, salaryHike, hikeAmount, hrApproved } = req.body;

        const review = await prisma.appraisalReview.update({
            where: { id: reviewId },
            data: {
                salaryHike,
                hikeAmount,
                hrApproved: hrApproved || false,
                status: hrApproved ? 'HR_APPROVED' : 'MANAGER_DONE'
            }
        });

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── HR: Publish Cycle Results ────────────────────────────────────────────────
exports.publishCycle = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Compute final ratings from all 4 quarters for annual
        const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
        const allCyclesThisYear = await prisma.appraisalCycle.findMany({
            where: { year: cycle.year },
            include: { reviews: true }
        });

        // Get all unique user IDs across all quarters
        const allUserIds = [...new Set(allCyclesThisYear.flatMap(c => c.reviews.map(r => r.userId)))];

        // For each user, compute annual average rating
        for (const userId of allUserIds) {
            const userReviews = allCyclesThisYear.flatMap(c =>
                c.reviews.filter(r => r.userId === userId && r.managerRating !== null)
            );
            if (userReviews.length > 0) {
                const avgRating = userReviews.reduce((sum, r) => sum + (r.managerRating || 0), 0) / userReviews.length;
                // Update the current cycle's review with the annual avg
                await prisma.appraisalReview.updateMany({
                    where: { cycleId, userId },
                    data: { finalRating: Math.round(avgRating * 10) / 10 }
                });
            }
        }

        // Publish all HR-approved reviews in this cycle
        await prisma.appraisalReview.updateMany({
            where: { cycleId, hrApproved: true },
            data: { status: 'PUBLISHED', publishedAt: new Date() }
        });

        // Update cycle status
        await prisma.appraisalCycle.update({
            where: { id: cycleId },
            data: { status: 'PUBLISHED' }
        });

        res.json({ message: 'Cycle published successfully' });
    } catch (error) {
        console.error('publishCycle error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Get Annual Summary (all 4 quarters for a user) ──────────────────────────
exports.getAnnualSummary = async (req, res) => {
    try {
        const { year, userId } = req.query;
        const targetUserId = userId || req.user.id;
        const targetYear = parseInt(year) || new Date().getFullYear();

        // Scope check for managers
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || req.user.isOwner;
        const isManager = role === 'MANAGER' || req.user.role?.type === 'LEADERSHIP';

        if (!isPrivileged && targetUserId !== req.user.id) {
            if (isManager) {
                const teamIds = await getTeamMemberIds(req.user.id);
                if (!teamIds.includes(targetUserId)) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            } else {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const cycles = await prisma.appraisalCycle.findMany({
            where: { year: targetYear },
            orderBy: { quarter: 'asc' },
            include: {
                reviews: {
                    where: { userId: targetUserId },
                    include: {
                        manager: { select: { name: true } }
                    }
                },
                goals: {
                    where: { userId: targetUserId }
                }
            }
        });

        const quarters = cycles.map(c => ({
            quarter: c.quarter,
            year: c.year,
            cycleStatus: c.status,
            goals: c.goals,
            review: c.reviews[0] || null
        }));

        const publishedReviews = quarters.filter(q => q.review?.status === 'PUBLISHED');
        const annualAvgRating = publishedReviews.length > 0
            ? publishedReviews.reduce((sum, q) => sum + (q.review?.managerRating || 0), 0) / publishedReviews.length
            : null;

        res.json({ year: targetYear, quarters, annualAvgRating });
    } catch (error) {
        console.error('getAnnualSummary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Get Team Reviews (Manager-scoped) ───────────────────────────────────────
exports.getTeamReviews = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || req.user.isOwner;

        let userFilter = {};
        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            userFilter = { userId: { in: teamIds } };
        }

        const reviews = await prisma.appraisalReview.findMany({
            where: { cycleId, ...userFilter },
            include: {
                user: { select: { id: true, name: true, designation: true, department: { select: { name: true } }, profilePictureUrl: true } },
                manager: { select: { id: true, name: true } },
                cycle: { select: { quarter: true, year: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
