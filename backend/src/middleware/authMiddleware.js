const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    LegacyRole: true,
                    role: { select: { name: true, type: true } },
                    organizationId: true,
                    organization: { select: { ownerId: true } }
                }
            });
            // Compute isOwner once here so all controllers can use req.user.isOwner
            if (req.user) {
                req.user.isOwner = req.user.organization?.ownerId === req.user.id;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Privileged roles (Owner = Admin)
const PRIVILEGED = ['ADMIN', 'OWNER', 'HR', 'DIRECTOR'];

const admin = (req, res, next) => {
    const legacy = req.user?.LegacyRole;
    const roleName = req.user?.role?.name;
    const roleType = req.user?.role?.type;

    if (
        PRIVILEGED.includes(legacy) ||
        roleName === 'Owner' ||
        roleName === 'Admin' ||
        roleName === 'HR' ||
        roleName === 'Director' ||
        roleType === 'ADMINISTRATOR' ||
        roleType === 'EXECUTIVE'
    ) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as admin/HR/Owner' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        const userLegacy = req.user?.LegacyRole;
        const userDynamic = req.user?.role?.name?.toUpperCase();
        const userDynType = req.user?.role?.type;

        // OWNER is always treated as ADMIN
        const effectiveLegacy = userLegacy === 'OWNER' ? 'ADMIN' : userLegacy;

        const wantsAdmin = roles.includes('ADMIN') || roles.includes('OWNER');
        const wantsDirector = roles.includes('DIRECTOR');

        const isAdmin = (userDynType === 'ADMINISTRATOR') && wantsAdmin;
        const isDirector = (['LEADERSHIP', 'EXECUTIVE'].includes(userDynType)) && wantsDirector;
        const isOwner = userLegacy === 'OWNER' && wantsAdmin;
        const isDynMatch = userDynamic && roles.map(r => r.toUpperCase()).includes(userDynamic);

        if (
            roles.includes(userLegacy) ||
            roles.includes(effectiveLegacy) ||
            isDynMatch ||
            isAdmin ||
            isDirector ||
            isOwner
        ) {
            next();
        } else {
            res.status(403).json({ message: `Role ${userLegacy} is not authorized` });
        }
    };
};

module.exports = { protect, admin, authorize };
