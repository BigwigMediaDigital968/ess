const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

exports.createEmployee = async (req, res) => {
    const { name, email, password, role, designation, departmentId, managerId } = req.body;

    try {
        console.log("DEBUG_CREATE_PAYLOAD:", JSON.stringify(req.body, null, 2));
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
            roleId: req.body.roleId || null, // Fix: support dynamic role
            designation,
            departmentId: departmentId || null,
            managerId: managerId || null
        };

        // Generate custom Employee ID
        const lastUser = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' }, // Or explicitly standardizing on numeric ID if possible
            select: { employeeId: true }
        });

        let nextId = 1;
        if (lastUser && lastUser.employeeId) {
            const lastIdNum = parseInt(lastUser.employeeId, 10);
            if (!isNaN(lastIdNum)) {
                nextId = lastIdNum + 1;
            }
        }
        userData.employeeId = nextId.toString().padStart(3, '0');

        console.log("Constructed User Data:", userData);

        const user = await prisma.user.create({
            data: userData,
        });
        res.status(201).json(user);
    } catch (error) {
        console.error("Create Employee Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            include: {
                department: true,
                manager: {
                    select: { name: true }
                },
                role: true // Include Role
            }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                department: true,
                manager: true,
                minions: true,
                documents: true,
                role: true
            }
        });
        if (user) res.json(user);
        else res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { skills, address } = req.body;
    try {
        const updateData = {};
        if (skills) updateData.skills = skills.split(',').map(s => s.trim());

        // Handle Profile Picture
        if (req.file) {
            updateData.profilePictureUrl = `/uploads/${req.file.filename}`;
        }
        // Also handle address if needed, though usually admin updates it
        if (address !== undefined) updateData.address = address;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadDocument = async (req, res) => {
    // req.file form-data: 'document'
    // req.body: type (ONBOARDING, RESIGNATION, etc.)
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const doc = await prisma.document.create({
            data: {
                userId: req.user.id,
                type: req.body.type || 'OTHER',
                url: `/uploads/${req.file.filename}`,
                filename: req.file.originalname
            }
        });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    // Admin/HR only - update another user's details
    const { id } = req.params;
    const { name, email, designation, roleId, managerId, departmentId, bloodGroup, address, skills } = req.body;

    try {
        console.log("DEBUG_UPDATE_PAYLOAD:", JSON.stringify(req.body, null, 2));
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (designation !== undefined) updateData.designation = designation;
        // Use connect/disconnect for relations to avoid "Unknown argument" errors with foreign keys
        if (roleId) {
            updateData.role = { connect: { id: roleId } };
        } else if (roleId === "") {
            updateData.role = { disconnect: true };
        }

        if (departmentId) {
            updateData.department = { connect: { id: departmentId } };
        } else if (departmentId === "") {
            updateData.department = { disconnect: true };
        }

        if (managerId) {
            updateData.manager = { connect: { id: managerId } };
        } else if (managerId === "") {
            updateData.manager = { disconnect: true };
        }

        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (address !== undefined) updateData.address = address;

        if (skills !== undefined) {
            updateData.skills = skills ? skills.split(',').map(s => s.trim()) : [];
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        res.json(user);
    } catch (error) {
        console.error("Update Employee Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadEmployeeFile = async (req, res) => {
    // Admin upload for specific user
    const { id } = req.params;
    const { type } = req.body; // 'profilePicture' or 'document'

    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        if (type === 'profilePicture') {
            const user = await prisma.user.update({
                where: { id },
                data: { profilePictureUrl: `/uploads/${req.file.filename}` }
            });
            return res.json(user);
        } else {
            // Document
            const doc = await prisma.document.create({
                data: {
                    userId: id,
                    type: req.body.docType || 'OTHER',
                    url: `/uploads/${req.file.filename}`,
                    filename: req.file.originalname
                }
            });
            return res.json(doc);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
