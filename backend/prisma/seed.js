/**
 * seed.js — Idempotent database seeder
 *
 * Production behaviour (NODE_ENV=production):
 *   - Creates organisation, roles, leave policy, shifts and ONE admin user only.
 *   - Admin password is read from SEED_ADMIN_PASSWORD env var (required).
 *   - Sample employees and dummy attendance are NOT created.
 *
 * Development / first-run behaviour:
 *   - Also creates sample employees (no hardcoded passwords — uses SEED_SAMPLE_PASSWORD
 *     or auto-generates and prints to stdout).
 *   - Creates 5 days of dummy attendance for demo purposes.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const isProd = process.env.NODE_ENV === 'production';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireEnv(key) {
    const val = process.env[key];
    if (!val) {
        console.warn(`[seed] WARN: ${key} environment variable is missing.`);
    }
    return val;
}

function generatePassword() {
    return crypto.randomBytes(18).toString('base64url'); // ~24 URL-safe chars
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`[seed] Starting (NODE_ENV=${process.env.NODE_ENV || 'development'}, BCRYPT_ROUNDS=${BCRYPT_ROUNDS})`);

    // 1. Organisation — Binary Semantics Limited
    let org = await prisma.organization.findFirst({
        where: { users: { some: {} } },
        orderBy: { createdAt: 'asc' }
    });

    if (!org) {
        org = await prisma.organization.findFirst({
            where: { name: { contains: 'Binary Semantics' } },
            orderBy: { createdAt: 'asc' }
        });
    }

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Binary Semantics Limited',
                address: 'Plot # 15, Sector 18, Udyog Vihar, Gurugram, Haryana 122015',
                website: 'www.binarysemantics.com',
                logoUrl: '/uploads/logos/bsl-logo.png',
            }
        });
        console.log('[seed] Organisation created: Binary Semantics Limited');
    } else {
        if (!org.website) {
            await prisma.organization.update({
                where: { id: org.id },
                data: {
                    name: 'Binary Semantics Limited',
                    website: 'www.binarysemantics.com',
                    logoUrl: '/uploads/logos/bsl-logo.png',
                }
            });
        }
        console.log('[seed] Organisation ensured: Binary Semantics Limited');
    }

    // 2. Roles
    const roleDefinitions = [
        { name: 'Individual Contributor', type: 'INDIVIDUAL_CONTRIBUTOR' },
        { name: 'Tech Lead', type: 'INDIVIDUAL_CONTRIBUTOR' },
        { name: 'Manager', type: 'LEADERSHIP' },
        { name: 'Director', type: 'EXECUTIVE' },
        { name: 'Admin', type: 'ADMINISTRATOR' },
        { name: 'HR', type: 'ADMINISTRATOR' },
        { name: 'AssetMgr', type: 'ADMINISTRATOR' },
    ];

    for (const r of roleDefinitions) {
        const exists = await prisma.role.findFirst({ where: { name: r.name, organizationId: org.id } });
        if (!exists) {
            await prisma.role.create({ data: { ...r, organizationId: org.id } });
            console.log(`[seed] Role created: ${r.name}`);
        }
    }

    // 3. Default Departments
    const defaultDepartments = [
        'Engineering', 'Human Resources', 'Finance', 'Marketing',
        'Operations', 'Sales', 'Product Management', 'Design'
    ];
    for (const deptName of defaultDepartments) {
        const exists = await prisma.department.findFirst({ where: { name: deptName } });
        if (!exists) {
            await prisma.department.create({ data: { name: deptName, organizationId: org.id } });
            console.log(`[seed] Department created: ${deptName}`);
        }
    }

    // 4. Admin User
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bigwig.local';
    const adminPassword = 'password123'; // Fixed default, mustChangePassword will handle security

    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin', organizationId: org.id } });

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    let adminUser;

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
        adminUser = await prisma.user.create({
            data: {
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                LegacyRole: 'ADMIN',
                roleId: adminRole?.id,
                organizationId: org.id,
                designation: 'Administrator',
                mustChangePassword: true
            },
        });

        await prisma.organization.update({
            where: { id: org.id },
            data: { ownerId: adminUser.id }
        });

        if (isProd) {
            console.log(`[seed] ✓ Admin user created: ${adminEmail} (password: password123, change required on login)`);
        } else {
            console.log(`[seed] ✓ Admin user created: ${adminEmail} (password: password123, change required on login)`);
        }
    } else {
        adminUser = existingAdmin;
        console.log(`[seed] Admin user already exists: ${adminEmail}`);
    }

    // 5. Leave Policy
    const policy = await prisma.leavePolicy.findUnique({ where: { organizationId: org.id } });
    if (!policy) {
        await prisma.leavePolicy.create({
            data: {
                organizationId: org.id,
                casualLeaves: 24,
                earnedLeaves: 20,
                encashable: true
            }
        });
        console.log('[seed] Default leave policy created.');
    }

    // 6. Shifts
    const defaultShifts = [
        { name: 'General', startTime: '09:00', endTime: '18:00' },
        { name: 'Morning', startTime: '06:00', endTime: '14:00' },
        { name: 'Night', startTime: '22:00', endTime: '06:00' },
        { name: 'WO', startTime: '00:00', endTime: '00:00' },
        { name: 'GH', startTime: '00:00', endTime: '00:00' },
        { name: 'SL', startTime: '00:00', endTime: '00:00' },
    ];
    for (const s of defaultShifts) {
        const exists = await prisma.shift.findFirst({ where: { name: s.name } });
        if (!exists) {
            await prisma.shift.create({ data: s });
            console.log(`[seed] Shift created: ${s.name}`);
        }
    }

    // ── Development-only: sample employees + dummy attendance ─────────────────
    if (!isProd) {
        console.log('[seed] DEV MODE — seeding sample employees and dummy attendance...');

        let samplePassword = process.env.SEED_SAMPLE_PASSWORD || generatePassword();
        if (!process.env.SEED_SAMPLE_PASSWORD) {
            console.log(`[seed] Sample employee password: ${samplePassword}`);
        }
        const hashedSamplePwd = await bcrypt.hash(samplePassword, BCRYPT_ROUNDS);

        const employeesData = [
            { name: 'Mona HR', email: 'mona@bigwig.local', role: 'HR', designation: 'HR Executive' },
            { name: 'Rahul Sharma', email: 'rahul@bigwig.local', role: 'Manager', designation: 'Engineering Manager' },
            { name: 'Priya Singh', email: 'priya@bigwig.local', role: 'Tech Lead', designation: 'Senior Developer' },
            { name: 'Amit Kumar', email: 'amit@bigwig.local', role: 'Individual Contributor', designation: 'Frontend Developer' },
            { name: 'Sneha Gupta', email: 'sneha@bigwig.local', role: 'Individual Contributor', designation: 'Backend Developer' },
        ];

        for (const emp of employeesData) {
            const role = await prisma.role.findFirst({ where: { name: emp.role, organizationId: org.id } });
            await prisma.user.upsert({
                where: { email: emp.email },
                update: { designation: emp.designation, roleId: role?.id },
                create: {
                    name: emp.name,
                    email: emp.email,
                    password: hashedSamplePwd,
                    roleId: role?.id,
                    organizationId: org.id,
                    designation: emp.designation,
                    mustChangePassword: true
                }
            });
            console.log(`[seed]   Employee ensured: ${emp.name}`);
        }

        // Reporting hierarchy
        const rahul = await prisma.user.findUnique({ where: { email: 'rahul@bigwig.local' } });
        const mona = await prisma.user.findUnique({ where: { email: 'mona@bigwig.local' } });
        if (rahul) {
            await prisma.user.update({ where: { email: 'rahul@bigwig.local' }, data: { managerId: adminUser.id } });
        }
        if (mona) {
            await prisma.user.update({ where: { email: 'mona@bigwig.local' }, data: { managerId: adminUser.id } });
        }
        for (const sub of ['amit@bigwig.local', 'sneha@bigwig.local', 'priya@bigwig.local']) {
            if (rahul) await prisma.user.update({ where: { email: sub }, data: { managerId: rahul.id } });
        }
        console.log('[seed] Reporting hierarchy: Admin → Rahul → [Priya, Amit, Sneha]');

        // Dummy attendance (last 5 working days) — DEV only
        const allUsers = await prisma.user.findMany({ where: { organizationId: org.id } });
        const today = new Date();

        for (const u of allUsers) {
            for (let i = 1; i <= 5; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                date.setHours(9, 0, 0, 0);
                const clockOut = new Date(date);
                clockOut.setHours(18, 0, 0, 0);

                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const existingAtt = await prisma.attendance.findFirst({
                    where: { userId: u.id, date: { gte: dayStart } }
                });
                if (!existingAtt) {
                    await prisma.attendance.create({
                        data: {
                            userId: u.id,
                            date: date,
                            clockIn: date,
                            clockOut: clockOut,
                            status: 'PRESENT',
                            type: 'OFFICE',
                            latitude: 28.4595,
                            longitude: 77.0266,
                            address: 'Udyog Vihar, Gurugram, Haryana'
                        }
                    });
                }
            }
        }
        console.log('[seed] Dummy attendance seeded (last 5 days).');
    } else {
        console.log('[seed] PRODUCTION MODE — sample employees and dummy attendance skipped.');
    }

    console.log('[seed] ✓ Seeding complete.');
}

main()
    .catch((e) => {
        console.error('[seed] FATAL:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
