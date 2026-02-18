const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.register = async (req, res) => {
    const { name, email, password, role, departmentId } = req.body;

    try {
        const userExists = await prisma.user.findUnique({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, salt);

        // Fetch Default Organization (Bigwig)
        const org = await prisma.organization.findFirst({ where: { name: { contains: 'Bigwig' } } });

        let leaveBalanceData = {};
        if (org) {
            const policy = await prisma.leavePolicy.findUnique({ where: { organizationId: org.id } });
            if (policy) {
                leaveBalanceData = {
                    create: {
                        casualLeaves: policy.casualLeaves,
                        earnedLeaves: policy.earnedLeaves,
                        sickLeaves: 10,
                        year: new Date().getFullYear()
                    }
                };
            }
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                LegacyRole: role || 'EMPLOYEE', // Mapped to LegacyRole
                departmentId,
                organizationId: org ? org.id : undefined,
                leaveBalance: leaveBalanceData
            },
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Include role and organization to check ownership
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: true,
                organization: true
            }
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            const requestedRole = req.body.role;
            let isAuthorized = false;
            const isOwner = user.organization && user.organization.ownerId === user.id;

            // Check Owner
            if (requestedRole === 'OWNER') {
                if (isOwner) isAuthorized = true;
            }
            // Check Legacy Role
            else if (user.LegacyRole === requestedRole) {
                isAuthorized = true;
            }
            // Check Dynamic Role
            else {
                if (user.role && user.role.name.toUpperCase().replace(' ', '_') === requestedRole) {
                    isAuthorized = true;
                }
                if (requestedRole === 'ADMIN' && user.role?.type === 'ADMINISTRATOR') {
                    isAuthorized = true;
                }
                if (requestedRole === 'MANAGER' && user.role?.type === 'LEADERSHIP') {
                    isAuthorized = true;
                }
                // Fallback for initial admin seeded user who has LegacyRole='ADMIN' but might try to login as 'ADMIN' via dropdown which handles it, but just in case
            }

            if (!isAuthorized) {
                return res.status(403).json({ message: `You are not authorized to login as ${requestedRole}` });
            }

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                LegacyRole: user.LegacyRole,
                isOwner,
                profilePictureUrl: user.profilePictureUrl,
                token: generateToken(user.id),
                statusMessage: user.statusMessage,
                workLocation: user.workLocation,
                shiftStart: user.shiftStart,
                shiftEnd: user.shiftEnd,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                department: true,
                role: true,
                organization: true
            }
        });

        if (user) {
            const isOwner = user.organization && user.organization.ownerId === user.id;
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                LegacyRole: user.LegacyRole,
                isOwner,
                designation: user.designation,
                department: user.department?.name,
                profilePictureUrl: user.profilePictureUrl,
                statusMessage: user.statusMessage,
                workLocation: user.workLocation,
                shiftStart: user.shiftStart,
                shiftEnd: user.shiftEnd
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
