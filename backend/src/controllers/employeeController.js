const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

exports.createEmployee = async (req, res) => {
    const { name, email, password, role, designation, departmentId, managerId } = req.body;

    try {
        console.log("DEBUG_CREATE_PAYLOAD:", JSON.stringify(req.body, null, 2));
        const salt = await bcrypt.genSalt(12);
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
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
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
                    select: { id: true, name: true }
                },
                role: true,
                certifications: true
            }
        });
        const safeEmployees = employees.map(({ password, ...e }) => e);
        res.json(safeEmployees);
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
                role: true,
                certifications: true
            }
        });
        if (user) {
            const { password, ...safeUser } = user;
            res.json(safeUser);
        }
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
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
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
    const { name, email, designation, roleId, bandId, managerId, departmentId, bloodGroup, address, skills } = req.body;

    try {
        console.log("DEBUG_UPDATE_PAYLOAD:", JSON.stringify(req.body, null, 2));

        // Fetch current user to compare role and band
        const currentUser = await prisma.user.findUnique({
            where: { id },
            include: { role: true, band: true }
        });

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

        if (bandId) {
            updateData.band = { connect: { id: bandId } };
        } else if (bandId === "") {
            updateData.band = { disconnect: true };
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
            data: updateData,
            include: { role: true, band: true } // Include these to get names for the announcement
        });

        // --- Promotion Announcement Logic ---
        let promoted = false;
        let promoParts = [];
        if (currentUser.roleId !== user.roleId && user.role) {
            promoted = true;
            promoParts.push(`Role: **${user.role.name}**`);
        }
        if (currentUser.bandId !== user.bandId && user.band) {
            promoted = true;
            promoParts.push(`Band: **${user.band.name}**`);
        }

        if (promoted && user.organizationId) {
            const promoMessage = `🎉 Congratulations to **${user.name}** on their promotion! ${promoParts.join(' | ')}`;
            try {
                // Find or create GENERAL conversation
                let generalChat = await prisma.conversation.findFirst({
                    where: { type: 'GROUP', name: 'General Announcements', organizationId: user.organizationId }
                });

                if (!generalChat) {
                    generalChat = await prisma.conversation.create({
                        data: {
                            type: 'GROUP',
                            organizationId: user.organizationId,
                            name: 'General Announcements'
                        }
                    });
                }

                // Send Message
                const newMessage = await prisma.message.create({
                    data: {
                        conversationId: generalChat.id,
                        senderId: req.user.id, // The admin/HR who made the change
                        content: promoMessage,
                        type: 'TEXT'
                    },
                    include: { sender: true }
                });

                // Emit via Socket.io if available
                const io = req.app.get('io');
                if (io) {
                    io.to(generalChat.id).emit("receive_message", newMessage);
                }
            } catch (chatErr) {
                console.error("Failed to send promotion announcement:", chatErr);
            }
        }
        // --- End Promotion Logic ---

        const { password: _, ...safeUser } = user;
        res.json(safeUser);
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
            const { password: _, ...safeUser } = user;
            return res.json(safeUser);
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

// ── Block / Unblock / Delete ──────────────────────────────────────────────────

exports.blockUser = async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        const { password: _, ...safeUser } = user;
        res.json({ message: 'User blocked successfully', user: safeUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: true }
        });
        const { password: _, ...safeUser } = user;
        res.json({ message: 'User unblocked successfully', user: safeUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        // Cascade-delete related records before deleting the user
        await prisma.attendance.deleteMany({ where: { userId: id } });
        await prisma.leave.deleteMany({ where: { userId: id } });
        await prisma.roster.deleteMany({ where: { userId: id } });
        await prisma.payrollRecord.deleteMany({ where: { userId: id } });
        await prisma.document.deleteMany({ where: { userId: id } });

        // Chat deletions
        await prisma.messageReadStatus.deleteMany({ where: { userId: id } });
        await prisma.message.deleteMany({ where: { senderId: id } });
        await prisma.conversationParticipant.deleteMany({ where: { userId: id } });

        // Onboarding/Profile specific
        await prisma.wFHLocation.deleteMany({ where: { userId: id } }).catch(() => { });
        await prisma.skill.deleteMany({ where: { userId: id } }).catch(() => { });
        await prisma.certification.deleteMany({ where: { userId: id } }).catch(() => { });
        await prisma.workExperience.deleteMany({ where: { userId: id } }).catch(() => { });

        // Appraisals
        await prisma.appraisalGoal.deleteMany({ where: { userId: id } }).catch(() => { });
        await prisma.appraisalReview.deleteMany({ where: { userId: id } }).catch(() => { });

        // Payroll & Leave Balance 1to1 relations
        await prisma.leaveBalance.delete({ where: { userId: id } }).catch(() => { });
        await prisma.salaryStructure.delete({ where: { userId: id } }).catch(() => { });

        // Remove from manager relationships
        await prisma.user.updateMany({ where: { managerId: id }, data: { managerId: null } });

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User permanently deleted' });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Department CRUD ───────────────────────────────────────────────────────────

exports.getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            where: { organizationId: req.user.organizationId ?? undefined },
            include: {
                _count: { select: { users: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.createDepartment = async (req, res) => {
    const { name, description } = req.body;
    try {
        if (!name) return res.status(400).json({ message: 'Department name is required' });
        const dept = await prisma.department.create({
            data: {
                name,
                description: description || null,
                organizationId: req.user.organizationId
            }
        });
        res.status(201).json(dept);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const dept = await prisma.department.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description })
            }
        });
        res.json(dept);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    const { id } = req.params;
    try {
        // Unassign users from this department before deleting
        await prisma.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
        await prisma.department.delete({ where: { id } });
        res.json({ message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

