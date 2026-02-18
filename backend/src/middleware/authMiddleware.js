const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
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
                    organizationId: true
                }
            });

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

const admin = (req, res, next) => {
    // Also allow HR to access Admin Panel features
    if (req.user && (
        req.user.LegacyRole === 'ADMIN' ||
        req.user.LegacyRole === 'HR' ||
        req.user.role?.name === 'Admin' ||
        req.user.role?.name === 'HR'
    )) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin/HR' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // Check LegacyRole or Dynamic Role Name
        const userLegacy = req.user.LegacyRole;
        const userDynamic = req.user.role?.name?.toUpperCase(); // e.g. "HR" -> "HR"
        const userDynamicType = req.user.role?.type; // e.g. "ADMINISTRATOR", "LEADERSHIP"

        const isAdmin = userDynamicType === 'ADMINISTRATOR' && roles.includes('ADMIN');
        // LEADERSHIP (Director) and EXECUTIVE map to DIRECTOR role in authorize calls
        const isDirector = ['LEADERSHIP', 'EXECUTIVE'].includes(userDynamicType) && roles.includes('DIRECTOR');

        if (roles.includes(userLegacy) ||
            (userDynamic && roles.includes(userDynamic)) ||
            isAdmin ||
            isDirector
        ) {
            next();
        } else {
            res.status(403).json({ message: `User role ${userLegacy} is not authorized` });
        }
    };
};

module.exports = { protect, admin, authorize };
