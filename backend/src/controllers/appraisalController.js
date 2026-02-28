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

const isPrivilegedRole = (role) => ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role);
const isManagerRole = (role, roleType) => role === 'MANAGER' || roleType === 'LEADERSHIP';

// ─── Check if current user has any direct reports ────────────────────────────
exports.checkHasTeam = async (req, res) => {
    try {
        const teamIds = await getTeamMemberIds(req.user.id);
        res.json({ hasTeam: teamIds.length > 0, count: teamIds.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', hasTeam: false });
    }
};

// ─── Get actual direct reports for the current user ───────────────────────────
exports.getMyTeamMembers = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        let where = { managerId, isActive: true };
        // Privileged users (HR/Admin/Owner) can optionally filter by managerId query param
        if (isPrivileged && req.query.managerId) {
            where = { managerId: req.query.managerId, isActive: true };
        }

        const members = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                designation: true,
                email: true,
                profilePictureUrl: true,
                department: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
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
                data: { quarter, year, status: 'OPEN', phase: 'KRA_DRAFT' },
                include: { goals: true, reviews: true }
            });
        }

        const userId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        let filteredGoals = cycle.goals;
        let filteredReviews = cycle.reviews;

        if (!isPrivileged) {
            // Check if this user manages anyone (regardless of role title)
            const teamIds = await getTeamMemberIds(userId);
            if (teamIds.length > 0) {
                // Show self + team
                filteredGoals = cycle.goals.filter(g => g.userId === userId || teamIds.includes(g.userId));
                filteredReviews = cycle.reviews.filter(r => r.userId === userId || teamIds.includes(r.userId));
            } else {
                // Pure employee: only their own data
                filteredGoals = cycle.goals.filter(g => g.userId === userId);
                filteredReviews = cycle.reviews.filter(r => r.userId === userId);
            }
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
            include: { _count: { select: { goals: true, reviews: true } } }
        });
        res.json(cycles);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Create a cycle manually (HR/Owner) ───────────────────────────────────────
exports.createCycle = async (req, res) => {
    try {
        const { quarter, year } = req.body;
        const existing = await prisma.appraisalCycle.findUnique({ where: { quarter_year: { quarter: parseInt(quarter), year: parseInt(year) } } });
        if (existing) return res.status(400).json({ message: 'Cycle already exists for this quarter/year.' });
        const cycle = await prisma.appraisalCycle.create({
            data: { quarter: parseInt(quarter), year: parseInt(year), status: 'OPEN', phase: 'KRA_DRAFT' }
        });
        res.status(201).json(cycle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Update cycle status/phase (HR/Owner) ─────────────────────────────────────
exports.updateCycleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, phase } = req.body;
        const data = {};
        if (status) data.status = status;
        if (phase) data.phase = phase;
        const cycle = await prisma.appraisalCycle.update({ where: { id }, data });
        res.json(cycle);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 1: Manager initiates Team KRA ───────────────────────────────────────
// We store a KRA at the goal-level with userId = managerId (team-level marker)
exports.initiateKRA = async (req, res) => {
    try {
        const { cycleId, kraTitle, kraObjectives } = req.body;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        if (!isManagerRole(role, req.user.role?.type) && !isPrivilegedRole(role)) {
            return res.status(403).json({ message: 'Only managers can initiate a KRA.' });
        }

        // Find team members
        const teamIds = isPrivilegedRole(role) ? [] : await getTeamMemberIds(managerId);

        // Create or update the team KRA record (stored as a special goal with userId=managerId for team-level)
        await prisma.appraisalGoal.deleteMany({ where: { cycleId, setById: managerId, kraCategory: 'TEAM_KRA' } });

        const kra = await prisma.appraisalGoal.create({
            data: {
                cycleId,
                userId: managerId,     // Team-level: manager is also "owner" of this KRA record
                setById: managerId,
                title: kraTitle,
                description: kraObjectives,
                kraCategory: 'TEAM_KRA',
                weight: 0,
                status: 'PENDING',
                hrApproved: false
            }
        });

        // Advance cycle phase
        await prisma.appraisalCycle.update({ where: { id: cycleId }, data: { phase: 'KRA_DRAFT' } });

        res.status(201).json(kra);
    } catch (error) {
        console.error('initiateKRA error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── STEP 2: Owner/Admin lists pending KRAs ──────────────────────────────────
exports.getPendingKRAs = async (req, res) => {
    try {
        const kras = await prisma.appraisalGoal.findMany({
            where: { kraCategory: 'TEAM_KRA', hrApproved: false },
            include: {
                cycle: { select: { id: true, quarter: true, year: true, phase: true } },
                setBy: { select: { id: true, name: true, designation: true, department: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(kras);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 2: Owner/Admin approves a KRA ───────────────────────────────────────
exports.approveKRA = async (req, res) => {
    try {
        const { id } = req.params;
        const kra = await prisma.appraisalGoal.update({
            where: { id },
            data: { hrApproved: true, status: 'ACHIEVED' }
        });
        // Advance cycle phase to GOAL_SETTING
        await prisma.appraisalCycle.update({ where: { id: kra.cycleId }, data: { phase: 'GOAL_SETTING' } });
        res.json(kra);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 3: Set Goals (Manager) ─────────────────────────────────────────────
exports.setGoals = async (req, res) => {
    try {
        const { cycleId, userId, goals } = req.body;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;
        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            if (!teamIds.includes(userId)) {
                return res.status(403).json({ message: 'You can only set goals for your direct reports' });
            }
        }
        // Remove existing non-KRA goals for this user in this cycle, then recreate
        await prisma.appraisalGoal.deleteMany({ where: { cycleId, userId, NOT: { kraCategory: 'TEAM_KRA' } } });

        const totalWeight = goals.reduce((s, g) => s + (parseFloat(g.weight) || 0), 0);
        if (Math.round(totalWeight) !== 100) {
            return res.status(400).json({ message: `Goal weights must total 100%. Current total: ${totalWeight}%` });
        }

        const created = await prisma.appraisalGoal.createMany({
            data: goals.map(g => ({
                cycleId, userId,
                setById: managerId,
                title: g.title,
                description: g.description || null,
                kraCategory: g.kraCategory || null,
                weight: parseFloat(g.weight) || 100 / goals.length,
                status: 'PENDING'
            }))
        });

        res.json({ message: `${created.count} goals set`, count: created.count });
    } catch (error) {
        console.error('setGoals error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── STEP 4: Employee accepts or raises concern on a goal ─────────────────────
exports.acceptGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { accept, concern } = req.body;
        const userId = req.user.id;
        const goal = await prisma.appraisalGoal.findUnique({ where: { id } });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId !== userId) return res.status(403).json({ message: 'Access denied' });

        const updated = await prisma.appraisalGoal.update({
            where: { id },
            data: {
                acceptedByEmployee: accept !== false,
                employeeConcern: concern || null,
                acceptedAt: new Date()
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 5: Employee self-reviews a specific goal ────────────────────────────
exports.submitGoalSelfReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { selfRating, selfComment } = req.body;
        const userId = req.user.id;
        const goal = await prisma.appraisalGoal.findUnique({ where: { id } });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId !== userId) return res.status(403).json({ message: 'Access denied' });

        const updated = await prisma.appraisalGoal.update({
            where: { id },
            data: { selfRating, selfComment, selfSubmittedAt: new Date(), status: 'PARTIAL' }
        });

        // Also ensure the AppraisalReview row exists (for tracking)
        const employee = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
        await prisma.appraisalReview.upsert({
            where: { cycleId_userId: { cycleId: goal.cycleId, userId } },
            create: { cycleId: goal.cycleId, userId, managerId: employee?.managerId || null, status: 'SELF_DONE', selfSubmittedAt: new Date() },
            update: { status: 'SELF_DONE', selfSubmittedAt: new Date() }
        });

        res.json(updated);
    } catch (error) {
        console.error('submitGoalSelfReview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── (Legacy) Full self assessment ───────────────────────────────────────────
exports.submitSelfAssessment = async (req, res) => {
    try {
        const { cycleId, selfRating, selfComment, isAnnual } = req.body;
        const userId = req.user.id;
        const employee = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });

        const data = isAnnual
            ? { annualSelfRating: selfRating, selfComment, selfSubmittedAt: new Date(), status: 'SELF_DONE' }
            : { selfRating, selfComment, selfSubmittedAt: new Date(), status: 'SELF_DONE' };

        const review = await prisma.appraisalReview.upsert({
            where: { cycleId_userId: { cycleId, userId } },
            create: { cycleId, userId, managerId: employee?.managerId || null, ...data },
            update: data
        });

        res.json(review);
    } catch (error) {
        console.error('submitSelfAssessment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 6: Manager rates a specific goal ────────────────────────────────────
exports.reviewGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { managerRating, managerComment } = req.body;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        const goal = await prisma.appraisalGoal.findUnique({ where: { id }, include: { user: { select: { managerId: true } } } });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (!isPrivileged && goal.user.managerId !== managerId) {
            return res.status(403).json({ message: 'You can only review goals for your direct reports' });
        }

        const updated = await prisma.appraisalGoal.update({
            where: { id },
            data: { managerRating, managerComment, managerReviewedAt: new Date() }
        });

        // Check if all goals for this user in this cycle are reviewed → auto-advance review status
        const allGoals = await prisma.appraisalGoal.findMany({
            where: { cycleId: goal.cycleId, userId: goal.userId, NOT: { kraCategory: 'TEAM_KRA' } }
        });
        const allReviewed = allGoals.every(g => g.managerRating !== null || g.id === id);
        if (allReviewed) {
            const avgManagerRating = allGoals.reduce((s, g) => s + (g.id === id ? managerRating : (g.managerRating || 0)), 0) / allGoals.length;
            await prisma.appraisalReview.upsert({
                where: { cycleId_userId: { cycleId: goal.cycleId, userId: goal.userId } },
                create: { cycleId: goal.cycleId, userId: goal.userId, managerId, managerRating: avgManagerRating, managerReviewedAt: new Date(), status: 'MANAGER_DONE' },
                update: { managerRating: avgManagerRating, managerReviewedAt: new Date(), status: 'MANAGER_DONE', managerId }
            });
        }

        res.json(updated);
    } catch (error) {
        console.error('reviewGoal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── (Legacy) Manager Review ──────────────────────────────────────────────────
exports.submitManagerReview = async (req, res) => {
    try {
        const { reviewId, managerRating, managerComment, managerApproved } = req.body;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        const existing = await prisma.appraisalReview.findUnique({ where: { id: reviewId } });
        if (!existing) return res.status(404).json({ message: 'Review not found' });
        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            if (!teamIds.includes(existing.userId)) {
                return res.status(403).json({ message: 'You can only review your direct reports' });
            }
        }
        const review = await prisma.appraisalReview.update({
            where: { id: reviewId },
            data: { managerRating, managerComment, managerApproved: managerApproved || false, managerReviewedAt: new Date(), managerId, status: managerApproved ? 'MANAGER_DONE' : 'SELF_DONE' }
        });
        res.json(review);
    } catch (error) {
        console.error('submitManagerReview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 8/9: Manager gets Q4 annual console & submits final rating ──────────
exports.getAnnualConsole = async (req, res) => {
    try {
        const { year } = req.query;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;
        const targetYear = parseInt(year) || new Date().getFullYear();

        let teamIds = isPrivileged ? [] : await getTeamMemberIds(managerId);

        const cycles = await prisma.appraisalCycle.findMany({
            where: { year: targetYear },
            orderBy: { quarter: 'asc' },
            include: {
                goals: {
                    where: isPrivileged ? { NOT: { kraCategory: 'TEAM_KRA' } } : { userId: { in: teamIds }, NOT: { kraCategory: 'TEAM_KRA' } }
                },
                reviews: {
                    where: isPrivileged ? {} : { userId: { in: teamIds } },
                    include: { user: { select: { id: true, name: true, designation: true, profilePictureUrl: true, department: { select: { name: true } } } } }
                }
            }
        });

        // Build per-member annual summary
        const memberMap = {};
        for (const cycle of cycles) {
            for (const review of cycle.reviews) {
                if (!memberMap[review.userId]) {
                    memberMap[review.userId] = { user: review.user, quarters: {} };
                }
                memberMap[review.userId].quarters[cycle.quarter] = {
                    reviewId: review.id,
                    managerRating: review.managerRating,
                    selfRating: review.selfRating,
                    status: review.status,
                    managerFinalRating: review.managerFinalRating,
                    finalApprovedAt: review.finalApprovedAt
                };
            }
        }

        res.json({ year: targetYear, members: Object.values(memberMap) });
    } catch (error) {
        console.error('getAnnualConsole error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 9: Manager submits final annual rating ───────────────────────────────
exports.submitFinalRating = async (req, res) => {
    try {
        const { cycleId, userId, managerFinalRating, finalComment } = req.body;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        if (!isPrivileged) {
            const teamIds = await getTeamMemberIds(managerId);
            if (!teamIds.includes(userId)) return res.status(403).json({ message: 'Access denied' });
        }

        const review = await prisma.appraisalReview.upsert({
            where: { cycleId_userId: { cycleId, userId } },
            create: { cycleId, userId, managerId, managerFinalRating, managerComment: finalComment, status: 'MANAGER_DONE' },
            update: { managerFinalRating, managerComment: finalComment, managerId, status: 'MANAGER_DONE' }
        });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 10: Owner/Admin/HR approves or revises final rating ─────────────────
exports.approveFinalRating = async (req, res) => {
    try {
        const { reviewId, revisedRating, approved } = req.body;
        const approverId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        if (!isPrivilegedRole(role) && !req.user.isOwner) {
            return res.status(403).json({ message: 'Only Owner/Admin/HR can approve final ratings' });
        }

        const updateData = {
            finalApprovedBy: approverId,
            finalApprovedAt: new Date(),
            hrApproved: !!approved,
            status: approved ? 'HR_APPROVED' : 'MANAGER_DONE'
        };
        if (revisedRating !== undefined) {
            updateData.managerFinalRating = parseFloat(revisedRating);
        }

        const review = await prisma.appraisalReview.update({ where: { id: reviewId }, data: updateData });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── HR: Set Salary Hike & Approve ────────────────────────────────────────────
exports.hrApproveAndSetHike = async (req, res) => {
    try {
        const { reviewId, salaryHike, hikeAmount, hrApproved } = req.body;
        const review = await prisma.appraisalReview.update({
            where: { id: reviewId },
            data: { salaryHike, hikeAmount, hrApproved: hrApproved || false, status: hrApproved ? 'HR_APPROVED' : 'MANAGER_DONE' }
        });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 11: Owner/Admin allocates budget per team ──────────────────────────
exports.allocateBudget = async (req, res) => {
    try {
        const { cycleId, managerId, departmentId, totalBudget } = req.body;
        const budget = await prisma.teamBudget.upsert({
            where: { cycleId_managerId: { cycleId, managerId } },
            create: { cycleId, managerId, departmentId: departmentId || null, totalBudget: parseFloat(totalBudget), usedBudget: 0 },
            update: { totalBudget: parseFloat(totalBudget), departmentId: departmentId || null }
        });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 11: Owner/Admin lists all team budgets for a cycle ─────────────────
exports.listBudgets = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const budgets = await prisma.teamBudget.findMany({
            where: { cycleId },
            include: { cycle: { select: { quarter: true, year: true } } }
        });

        // Enrich with manager info
        const managerIds = [...new Set(budgets.map(b => b.managerId))];
        const managers = await prisma.user.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, name: true, designation: true, department: { select: { name: true } } }
        });
        const managerMap = Object.fromEntries(managers.map(m => [m.id, m]));
        const enriched = budgets.map(b => ({ ...b, manager: managerMap[b.managerId] || null }));
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 12: Manager views their team budget ────────────────────────────────
exports.getMyTeamBudget = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const managerId = req.user.id;
        const budget = await prisma.teamBudget.findUnique({
            where: { cycleId_managerId: { cycleId, managerId } }
        });

        const allocations = await prisma.hikeAllocation.findMany({
            where: { cycleId, managerId },
            include: {}
        });

        // Enrich allocations with user info
        const userIds = allocations.map(a => a.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, designation: true }
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));
        const enrichedAllocations = allocations.map(a => ({ ...a, user: userMap[a.userId] || null }));

        res.json({ budget, allocations: enrichedAllocations });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── STEP 12: Manager distributes budget to team members ───────────────────────
exports.distributeBudget = async (req, res) => {
    try {
        const { cycleId, distributions } = req.body; // distributions: [{userId, hikePercent, currentCTC}]
        const managerId = req.user.id;

        const budget = await prisma.teamBudget.findUnique({ where: { cycleId_managerId: { cycleId, managerId } } });
        if (!budget) return res.status(400).json({ message: 'No budget allocated for your team yet.' });

        let totalUsed = 0;
        const results = [];
        for (const dist of distributions) {
            const hikeAmount = (dist.currentCTC * dist.hikePercent) / 100;
            const newCTC = dist.currentCTC + hikeAmount;
            totalUsed += hikeAmount;

            const alloc = await prisma.hikeAllocation.upsert({
                where: { cycleId_userId: { cycleId, userId: dist.userId } },
                create: { cycleId, userId: dist.userId, managerId, hikePercent: dist.hikePercent, hikeAmount, newCTC, effectiveDate: dist.effectiveDate ? new Date(dist.effectiveDate) : null },
                update: { hikePercent: dist.hikePercent, hikeAmount, newCTC, effectiveDate: dist.effectiveDate ? new Date(dist.effectiveDate) : null }
            });
            results.push(alloc);
        }

        if (totalUsed > budget.totalBudget) {
            return res.status(400).json({ message: `Total distribution ₹${totalUsed.toFixed(0)} exceeds budget ₹${budget.totalBudget.toFixed(0)}` });
        }

        // Update used budget
        await prisma.teamBudget.update({ where: { cycleId_managerId: { cycleId, managerId } }, data: { usedBudget: totalUsed } });

        res.json({ message: `Budget distributed to ${results.length} members`, allocations: results });
    } catch (error) {
        console.error('distributeBudget error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── STEP 13: Generate/apply appraisal letters (Owner/Admin) ─────────────────
exports.generateLetters = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Get all hike allocations for this cycle
        const allocations = await prisma.hikeAllocation.findMany({ where: { cycleId } });

        for (const alloc of allocations) {
            // Update the user's salary structure with new CTC
            const existing = await prisma.salaryStructure.findUnique({ where: { userId: alloc.userId } });
            if (existing) {
                await prisma.salaryStructure.update({
                    where: { userId: alloc.userId },
                    data: { ctcAnnual: alloc.newCTC }
                });
            }

            // Mark the review as letter sent
            await prisma.appraisalReview.updateMany({
                where: { cycleId, userId: alloc.userId },
                data: { newCTC: alloc.newCTC, letterSentAt: new Date(), pdfUrl: `/appraisal/letters/${cycleId}/${alloc.userId}.pdf` }
            });

            // Mark hike allocation as approved
            await prisma.hikeAllocation.update({ where: { id: alloc.id }, data: { approvedAt: new Date() } });
        }

        // Mark cycle completed
        await prisma.appraisalCycle.update({ where: { id: cycleId }, data: { status: 'PUBLISHED', phase: 'COMPLETED' } });

        res.json({ message: `Appraisal letters generated for ${allocations.length} employees`, count: allocations.length });
    } catch (error) {
        console.error('generateLetters error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── HR: Publish Cycle Results ────────────────────────────────────────────────
exports.publishCycle = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
        const allCyclesThisYear = await prisma.appraisalCycle.findMany({ where: { year: cycle.year }, include: { reviews: true } });
        const allUserIds = [...new Set(allCyclesThisYear.flatMap(c => c.reviews.map(r => r.userId)))];

        for (const userId of allUserIds) {
            const userReviews = allCyclesThisYear.flatMap(c => c.reviews.filter(r => r.userId === userId && r.managerRating !== null));
            if (userReviews.length > 0) {
                const avgRating = userReviews.reduce((sum, r) => sum + (r.managerRating || 0), 0) / userReviews.length;
                await prisma.appraisalReview.updateMany({ where: { cycleId, userId }, data: { finalRating: Math.round(avgRating * 10) / 10 } });
            }
        }

        await prisma.appraisalReview.updateMany({ where: { cycleId, hrApproved: true }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
        await prisma.appraisalCycle.update({ where: { id: cycleId }, data: { status: 'PUBLISHED' } });

        res.json({ message: 'Cycle published successfully' });
    } catch (error) {
        console.error('publishCycle error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Get Annual Summary ───────────────────────────────────────────────────────
exports.getAnnualSummary = async (req, res) => {
    try {
        const { year, userId } = req.query;
        const targetUserId = userId || req.user.id;
        const targetYear = parseInt(year) || new Date().getFullYear();
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;
        const isManager = isManagerRole(role, req.user.role?.type);

        if (!isPrivileged && targetUserId !== req.user.id) {
            if (isManager) {
                const teamIds = await getTeamMemberIds(req.user.id);
                if (!teamIds.includes(targetUserId)) return res.status(403).json({ message: 'Access denied' });
            } else {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const cycles = await prisma.appraisalCycle.findMany({
            where: { year: targetYear },
            orderBy: { quarter: 'asc' },
            include: {
                reviews: { where: { userId: targetUserId }, include: { manager: { select: { name: true } } } },
                goals: { where: { userId: targetUserId, NOT: { kraCategory: 'TEAM_KRA' } } }
            }
        });

        const quarters = cycles.map(c => ({ quarter: c.quarter, year: c.year, cycleStatus: c.status, phase: c.phase, goals: c.goals, review: c.reviews[0] || null }));
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

// ─── Update Goal Status (Manager) ─────────────────────────────────────────────
exports.updateGoalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const goal = await prisma.appraisalGoal.update({ where: { id }, data: { status } });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Get Team Reviews (Manager-scoped) ────────────────────────────────────────
exports.getTeamReviews = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const managerId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;
        const isPrivileged = isPrivilegedRole(role) || req.user.isOwner;

        // Get actual direct reports for this user
        const directTeamIds = await getTeamMemberIds(managerId);
        const hasTeam = directTeamIds.length > 0;

        // Privileged users see all; users with a team see their team; others see nothing
        let userFilter = {};
        if (!isPrivileged) {
            if (!hasTeam) return res.json([]);
            userFilter = { userId: { in: directTeamIds } };
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
