const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@bigwig.local';
    const password = 'password123';

    // 1. Create Default Organization
    let org = await prisma.organization.findFirst({ where: { name: 'Sphere' } });
    if (!org) {
        // Check if Bigwig exists (it likely does in prod, but for fresh seed)
        org = await prisma.organization.findFirst({ where: { name: 'Bigwig Media Digital - Digital Marketing Company' } });

        if (!org) {
            // Fallback or create new if completely fresh
            org = await prisma.organization.create({
                data: {
                    name: 'Bigwig Media Digital - Digital Marketing Company',
                    address: 'Plot # 2, Sanjay Nagar, Gulabi Bagh, New Delhi, Delhi, 110007',
                }
            });
            console.log('Organization Bigwig created');
        }
    } else {
        console.log('Organization Sphere exists (should ideally be Bigwig)');
        // Update name if it's the old default
        if (org.name === 'Sphere') {
            await prisma.organization.update({
                where: { id: org.id },
                data: { name: 'Bigwig Media Digital - Digital Marketing Company' }
            });
        }
    }

    // ... (rest of logic needs to adapt to dynamic organization fetching, but for emails specifically:)

    // 2. Create Basic Roles
    const roleNames = ['Individual Contributor', 'Tech Lead', 'Manager', 'Director', 'Admin', 'HR'];
    for (const name of roleNames) {
        let type = 'INDIVIDUAL_CONTRIBUTOR';
        if (name === 'Admin') type = 'ADMINISTRATOR';
        else if (name === 'Director') type = 'EXECUTIVE';
        else if (name === 'Manager') type = 'LEADERSHIP';
        else if (name === 'HR') type = 'ADMINISTRATOR';

        const exists = await prisma.role.findFirst({
            where: { name, organizationId: org.id }
        });

        if (!exists) {
            await prisma.role.create({
                data: { name, type, organizationId: org.id }
            });
            console.log(`Role ${name} created`);
        }
    }

    // 3. Create/Update Admin User (Aman)
    const existing = await prisma.user.findUnique({ where: { email } });
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin', organizationId: org.id } });

    let adminUser;
    if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        adminUser = await prisma.user.create({
            data: {
                name: 'Aman',
                email,
                password: hashedPassword,
                LegacyRole: 'ADMIN',
                roleId: adminRole.id,
                organizationId: org.id,
                designation: 'CEO',
                profilePictureUrl: '/uploads/aman_profile.jpg'
            },
        });

        // Set Owner
        await prisma.organization.update({
            where: { id: org.id },
            data: { ownerId: adminUser.id }
        });

        console.log('Admin user Aman created');
    } else {
        adminUser = await prisma.user.update({
            where: { email },
            data: { name: 'Aman', designation: 'CEO' }
        });
        console.log('Admin user updated to Aman');
    }

    // 4. Create Default Leave Policy
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
        console.log('Default Leave Policy created');
    }

    // 5. Sample Employees & HR
    // Need to create/find users first, then link managers.
    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('password123', salt);

    const employeesData = [
        { name: 'Mona HR', email: 'mona@bigwig.local', role: 'HR', designation: 'HR Executive' },
        { name: 'Rahul Sharma', email: 'rahul@bigwig.local', role: 'Manager', designation: 'Engineering Manager' },
        { name: 'Priya Singh', email: 'priya@bigwig.local', role: 'Tech Lead', designation: 'Senior Developer' },
        { name: 'Amit Kumar', email: 'amit@bigwig.local', role: 'Individual Contributor', designation: 'Frontend Developer' },
        { name: 'Sneha Gupta', email: 'sneha@bigwig.local', role: 'Individual Contributor', designation: 'Backend Developer' }
    ];

    // First pass: Create Users
    for (const emp of employeesData) {
        const role = await prisma.role.findFirst({ where: { name: emp.role, organizationId: org.id } });
        await prisma.user.upsert({
            where: { email: emp.email },
            update: { designation: emp.designation, roleId: role.id },
            create: {
                name: emp.name,
                email: emp.email,
                password: commonPassword,
                roleId: role.id,
                organizationId: org.id,
                designation: emp.designation
            }
        });
        console.log(`Employee ${emp.name} ensured.`);
    }

    // Second pass: Map Hierarchy (Reporting Lines)
    // Aman (CEO) -> Rahul (Manager) -> [Priya, Amit, Sneha]
    // Mona (HR) -> Aman?

    // Fetch IDs
    const rahul = await prisma.user.findUnique({ where: { email: 'rahul@bigwig.local' } });
    const aman = await prisma.user.findUnique({ where: { email: 'admin@bigwig.local' } });
    const mona = await prisma.user.findUnique({ where: { email: 'mona@bigwig.local' } });

    // 1. Rahul reports to Aman
    await prisma.user.update({
        where: { email: 'rahul@bigwig.local' },
        data: { managerId: aman.id }
    });

    // 2. Mona reports to Aman
    await prisma.user.update({
        where: { email: 'mona@bigwig.local' },
        data: { managerId: aman.id }
    });

    // 3. Amit, Sneha, Priya report to Rahul
    const subordinates = ['amit@bigwig.local', 'sneha@bigwig.local', 'priya@bigwig.local'];
    for (const subEmail of subordinates) {
        await prisma.user.update({
            where: { email: subEmail },
            data: { managerId: rahul.id }
        });
    }

    console.log("Reporting hierarchy updated: Aman -> Rahul -> [Priya, Amit, Sneha]");

    // Add dummy attendance for last 5 days for everyone
    // ... code for attendance same as before ...
    // Re-run attendance loop for all including new ones

    const allUsers = await prisma.user.findMany({ where: { organizationId: org.id } });
    const today = new Date();

    for (const u of allUsers) {
        for (let i = 1; i <= 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(9, 0, 0, 0);
            const clockOut = new Date(date);
            clockOut.setHours(18, 0, 0, 0);

            const existingAtt = await prisma.attendance.findFirst({
                where: { userId: u.id, date: { gte: new Date(date.setHours(0, 0, 0, 0)) } }
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
                        latitude: 12.9716,
                        longitude: 77.5946,
                        address: 'Tech Park, Bangalore'
                    }
                });
            }
        }
    }

    // ── Seed default Shifts ──────────────────────────────────────────────────
    const defaultShifts = [
        { name: 'General', startTime: '09:00', endTime: '18:00' },
        { name: 'Morning', startTime: '06:00', endTime: '14:00' },
        { name: 'Night', startTime: '22:00', endTime: '06:00' },
        { name: 'WO', startTime: '00:00', endTime: '00:00' },
        { name: 'GH', startTime: '00:00', endTime: '00:00' },
        { name: 'SL', startTime: '00:00', endTime: '00:00' },
    ];
    for (const s of defaultShifts) {
        const existing = await prisma.shift.findFirst({ where: { name: s.name } });
        if (!existing) {
            await prisma.shift.create({ data: s });
            console.log(`Shift ${s.name} created.`);
        }
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
