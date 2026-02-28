#!/usr/bin/env node
/**
 * DB Cleanup Script:
 * 1. Clear all appraisal cycle data (AppraisalCycle, AppraisalGoal, AppraisalReview, etc.)
 * 2. Keep only Rajmohan, Suramya, Digvijay — delete all other users (and their dependent data)
 * 3. Make Suramya the organisation owner
 * 4. Suramya gets OWNER LegacyRole
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== ESS DB Cleanup ===');

    // ── 1. Find the 3 users to keep ─────────────────────────────────────────
    const keepUsers = await prisma.user.findMany({
        where: {
            name: { in: ['Rajmohan', 'Suramya', 'Digvijay'], mode: 'insensitive' }
        },
        select: { id: true, name: true, email: true, organizationId: true }
    });

    console.log('Users to KEEP:', keepUsers.map(u => `${u.name} (${u.id})`));

    if (keepUsers.length === 0) {
        console.error('No matching users found! Check names in DB.');
        process.exit(1);
    }

    const keepIds = keepUsers.map(u => u.id);
    const orgId = keepUsers[0].organizationId;

    // Find Suramya
    const suramya = keepUsers.find(u => u.name.toLowerCase().includes('suramya'));
    if (!suramya) {
        console.error('Suramya not found!');
        process.exit(1);
    }
    console.log('Suramya ID:', suramya.id);

    // ── 2. Clear ALL appraisal data ─────────────────────────────────────────
    console.log('\n--- Clearing appraisal data ---');

    // Delete in dependency order
    try { await prisma.appraisalGoal.deleteMany({}); console.log('Deleted appraisalGoal'); } catch (e) { console.log('appraisalGoal skip:', e.message); }
    try { await prisma.appraisalReview.deleteMany({}); console.log('Deleted appraisalReview'); } catch (e) { console.log('appraisalReview skip:', e.message); }
    try { await prisma.appraisalKRA.deleteMany({}); console.log('Deleted appraisalKRA'); } catch (e) { console.log('appraisalKRA skip:', e.message); }
    try { await prisma.appraisalCycle.deleteMany({}); console.log('Deleted appraisalCycle'); } catch (e) { console.log('appraisalCycle skip:', e.message); }

    // ── 3. Delete all users NOT in keepIds ──────────────────────────────────
    console.log('\n--- Deleting users not in keep list ---');

    const otherUsers = await prisma.user.findMany({
        where: { id: { notIn: keepIds } },
        select: { id: true, name: true }
    });
    console.log('Users to DELETE:', otherUsers.map(u => u.name));

    const otherIds = otherUsers.map(u => u.id);

    if (otherIds.length > 0) {
        // Cascade-delete dependent records for those users
        const cleanupModels = [
            'appraisalGoal', 'appraisalReview', 'appraisalKRA',
            'attendance', 'leave', 'leaveBalance',
            'roster', 'salaryStructure', 'payroll',
            'notification', 'document', 'certification',
            'offboardingRequest', 'onboardingTask', 'onboardingRecord',
            'asset', // just unassign, don't delete assets belonging to user
            'chatMessage', 'chatParticipant',
        ];

        for (const model of cleanupModels) {
            try {
                const res = await prisma[model].deleteMany({ where: { userId: { in: otherIds } } });
                console.log(`Deleted ${res.count} ${model} records`);
            } catch (e) {
                // field may not be userId - skip silently
            }
        }

        // Unassign assets from deleted users
        try {
            await prisma.asset.updateMany({
                where: { assignedToId: { in: otherIds } },
                data: { assignedToId: null, status: 'IN_STOCK' }
            });
        } catch (e) { }

        // Clear manager references so FK doesn't block
        await prisma.user.updateMany({
            where: { managerId: { in: otherIds } },
            data: { managerId: null }
        });

        // Delete the users
        const del = await prisma.user.deleteMany({ where: { id: { in: otherIds } } });
        console.log(`Deleted ${del.count} users`);
    }

    // ── 4. Make Suramya the org owner ───────────────────────────────────────
    console.log('\n--- Setting Suramya as owner ---');
    if (orgId) {
        await prisma.organization.update({
            where: { id: orgId },
            data: { ownerId: suramya.id }
        });
        console.log(`Organization owner set to Suramya (${suramya.id})`);
    }

    // Set Suramya's LegacyRole to OWNER
    await prisma.user.update({
        where: { id: suramya.id },
        data: { LegacyRole: 'OWNER' }
    });
    console.log('Suramya LegacyRole set to OWNER');

    // ── 5. Final state ───────────────────────────────────────────────────────
    const remaining = await prisma.user.findMany({
        select: { name: true, email: true, LegacyRole: true }
    });
    console.log('\n=== Remaining Users ===');
    remaining.forEach(u => console.log(` - ${u.name} | ${u.email} | ${u.LegacyRole}`));

    const cycles = await prisma.appraisalCycle.count();
    console.log(`\nAppraisal cycles remaining: ${cycles}`);

    console.log('\n✅ Cleanup complete!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
