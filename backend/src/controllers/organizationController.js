const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Logo Upload
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadPath = 'uploads/logos';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Images only!');
        }
    },
}).single('logo');

const loginBgUpload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            const uploadPath = 'uploads/backgrounds';
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename(req, file, cb) {
            cb(null, `bg-${Date.now()}${path.extname(file.originalname)}`);
        },
    }),
}).single('loginBackground');


exports.getOrganization = async (req, res) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            include: { leavePolicy: true }
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPublicOrganization = async (req, res) => {
    try {
        const org = await prisma.organization.findFirst({
            select: {
                name: true, logoUrl: true,
                primaryColor: true, accentColor: true,
                themeMode: true, loginBgUrl: true, loginBgType: true
            }
        });
        res.json(org || {});
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateOrganization = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err });
        }

        try {
            const { name, address, latitude, longitude, casualLeaves, earnedLeaves, configHrAccess, configDirectorAccess } = req.body;
            let updateData = {
                name,
                address,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined
            };

            if (req.file) {
                updateData.logoUrl = `/uploads/logos/${req.file.filename}`;
            }

            // Branding fields
            const { primaryColor, accentColor, themeMode, loginBgType } = req.body;
            if (primaryColor) updateData.primaryColor = primaryColor;
            if (accentColor) updateData.accentColor = accentColor;
            if (themeMode && ['light', 'dark', 'system'].includes(themeMode)) updateData.themeMode = themeMode;
            if (loginBgType && ['gradient', 'image', 'video'].includes(loginBgType)) updateData.loginBgType = loginBgType;

            const organizationId = req.user.organizationId;
            if (!organizationId) {
                return res.status(400).json({ message: "User is not linked to an organization" });
            }

            const currentOrg = await prisma.organization.findUnique({ where: { id: organizationId } });

            // Access Control Logic
            const isOwner = currentOrg.ownerId === req.user.id;
            const isHR = req.user.LegacyRole === 'HR' || req.user.role?.name === 'HR';
            const isDirector = req.user.role?.name === 'Director'; // Adjust based on exact role name

            let isAuthorized = false;

            if (isOwner) {
                isAuthorized = true;
                // Owner can update config flags
                // Form-data sends booleans as strings "true" or "false"
                if (configHrAccess !== undefined) {
                    updateData.configHrAccess = String(configHrAccess) === 'true';
                }
                if (configDirectorAccess !== undefined) {
                    updateData.configDirectorAccess = String(configDirectorAccess) === 'true';
                }
            } else if (isHR && currentOrg.configHrAccess) {
                isAuthorized = true;
            } else if (isDirector && currentOrg.configDirectorAccess) {
                isAuthorized = true;
            }

            if (!isAuthorized) {
                return res.status(403).json({ message: "You are not authorized to update organization settings" });
            }

            const org = await prisma.organization.update({
                where: { id: organizationId },
                data: updateData
            });

            // Update Policy if provided
            if (casualLeaves || earnedLeaves) {
                await prisma.leavePolicy.upsert({
                    where: { organizationId: org.id },
                    update: {
                        casualLeaves: parseInt(casualLeaves),
                        earnedLeaves: parseInt(earnedLeaves)
                    },
                    create: {
                        organizationId: org.id,
                        casualLeaves: parseInt(casualLeaves),
                        earnedLeaves: parseInt(earnedLeaves)
                    }
                });
            }

            res.json(org);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    });
};

// Upload login background (separate endpoint)
exports.uploadLoginBackground = async (req, res) => {
    loginBgUpload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err });
        try {
            const organizationId = req.user.organizationId;
            if (!organizationId) return res.status(400).json({ message: 'No organization' });

            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const org = await prisma.organization.update({
                where: { id: organizationId },
                data: { loginBgUrl: `/uploads/backgrounds/${req.file.filename}` }
            });
            res.json(org);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    });
};

exports.loginBgUpload = loginBgUpload;
