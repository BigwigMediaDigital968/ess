const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

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

        const hashedPassword = await bcrypt.hash(password, 12);

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
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Block off-boarded users
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact HR.' });
        }

        if (await bcrypt.compare(password, user.password)) {
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

            if (user.mustChangePassword) {
                return res.json({
                    requiresPasswordChange: true,
                    message: "You must change your default password before continuing.",
                    token: generateToken(user.id)
                });
            }

            // Check 60-day password expiry rule
            const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
            const timeSinceLastChange = Date.now() - new Date(user.passwordLastChangedAt || user.createdAt).getTime();

            if (timeSinceLastChange > sixtyDaysMs) {
                // Return an instruction that they must change their password, but grant them enough token scope to do it
                return res.json({
                    requiresPasswordChange: true,
                    isExpired: true,
                    message: "Your password has expired (60 days). Please choose a new password.",
                    token: generateToken(user.id)
                });
            }

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                LegacyRole: user.LegacyRole,
                isOwner,
                profilePictureUrl: user.profilePictureUrl,
                bloodGroup: user.bloodGroup,
                address: user.address,
                token: generateToken(user.id),
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
                organization: true,
                certifications: true
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
                certifications: user.certifications,
                bloodGroup: user.bloodGroup,
                address: user.address
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
                passwordLastChangedAt: new Date(),
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Password updated successfully. You can now access the system.' });
    } catch (error) {
        console.error("Password change error: ", error);
        res.status(500).json({ message: 'Failed to update password' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Do not confirm if the email exists to prevent enumeration
            return res.status(200).json({ message: 'If that email exists, a password reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: expires
            }
        });

        const emailSent = await sendPasswordResetEmail(user.email, resetToken);
        if (!emailSent) {
            // Revert token if email failed
            await prisma.user.update({
                where: { id: user.id },
                data: { resetPasswordToken: null, resetPasswordExpires: null }
            });
            return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
        }

        res.status(200).json({ message: 'If that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error("Forgot password error: ", error);
        res.status(500).json({ message: 'An error occurred during password reset request.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
                passwordLastChangedAt: new Date(),
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });
    } catch (error) {
        console.error("Reset password error: ", error);
        res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
};
