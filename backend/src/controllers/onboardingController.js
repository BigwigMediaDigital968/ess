const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.onboardEmployee = async (req, res) => {
    try {
        // req.body contains text fields. Arrays/Objects might be stringified JSOn.
        const {
            firstName, lastName, email, password,
            dob, bloodGroup, personalEmail,
            presentAddress, permanentAddress, latitude, longitude,
            roleId, designation, departmentId, managerId,
            skills, // JSON string
            certifications, // JSON string
            workExperience // JSON string
        } = req.body;

        const name = `${firstName} ${lastName}`;
        const hashedPassword = await bcrypt.hash(password, 12);

        // 1. Create User
        // Check if email exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Handle Profile Pic
        let profilePictureUrl = null;
        if (req.files['profilePic'] && req.files['profilePic'][0]) {
            profilePictureUrl = `/uploads/profiles/${req.files['profilePic'][0].filename}`;
        }

        // Get Organization (assuming single org or passed in headers/token, but for now take first or from admin)
        // Since admin is creating, use admin's org or req.user.organizationId
        const organizationId = req.user.organizationId;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                dob: dob ? new Date(dob) : null,
                bloodGroup,
                personalEmail,
                presentAddress,
                permanentAddress,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                roleId: roleId || null,
                designation,
                departmentId: departmentId || null,
                managerId: managerId || null,
                organizationId,
                profilePictureUrl,
                LegacyRole: 'EMPLOYEE' // Default
            }
        });

        // 2. Add Skills
        if (skills) {
            const parsedSkills = JSON.parse(skills);
            if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
                await prisma.skill.createMany({
                    data: parsedSkills.map(s => ({
                        name: s.name,
                        experienceYears: parseFloat(s.experienceYears) || 0,
                        rating: parseFloat(s.rating) || 0,
                        userId: user.id
                    }))
                });
            }
        }

        // 3. Add Certifications
        if (certifications) {
            const parsedCerts = JSON.parse(certifications);
            // Process files for certs? 
            // The frontend should map file indices to cert entries or we handle uploads separately.
            // Simplified: We assume files are uploaded with specific naming or order?
            // Actually, handling file mapping for array items in multipart is tricky.
            // A common strategy: Client sends `certifications` as JSON array.
            // If they have files, they might upload `certBadges` array.
            // We can match them by order if client ensures order, or use a specific ID.
            // Let's assume the client sends an index map or we just take the file path if provided in the JSON (but file is in req.files).
            // For MVP: simple mapping by index if `certBadges` exists.

            const certFiles = req.files['certBadges'] || [];

            for (let i = 0; i < parsedCerts.length; i++) {
                const c = parsedCerts[i];
                let imageUrl = null;
                // If the frontend says "hasBadge: true" or provides a reference, we pick from files.
                // Or we just map by index of uploading. 
                // Let's rely on simple index mapping for now.
                if (certFiles[i]) {
                    imageUrl = `/uploads/certs/${certFiles[i].filename}`;
                }

                await prisma.certification.create({
                    data: {
                        name: c.name,
                        issuingOrg: c.issuingOrg,
                        credentialUrl: c.credentialUrl,
                        issueDate: c.issueDate ? new Date(c.issueDate) : null,
                        expiryDate: c.expiryDate ? new Date(c.expiryDate) : null,
                        imageUrl,
                        userId: user.id
                    }
                });
            }
        }

        // 4. Work Experience & Docs
        if (workExperience) {
            const parsedExp = JSON.parse(workExperience);
            const expFiles = req.files['expDocs'] || [];
            // Similar mapping issue.
            // We'll create the experience records first.

            // NOTE: Linking multiple docs to one experience is complex with single array of files.
            // We will assume 1 main doc per experience for this MVP or simple sequential mapping.

            let fileIndex = 0;
            for (let i = 0; i < parsedExp.length; i++) {
                const exp = parsedExp[i];
                const newExp = await prisma.workExperience.create({
                    data: {
                        companyName: exp.companyName,
                        designation: exp.designation,
                        startDate: new Date(exp.startDate),
                        endDate: exp.endDate ? new Date(exp.endDate) : null,
                        description: exp.description,
                        userId: user.id
                    }
                });

                // If files provided for this exp
                // Getting complicated to know which file belongs to which exp without rigid structure.
                // We'll assume the client appends files in order of valid experiences.
                if (expFiles[fileIndex]) {
                    const file = expFiles[fileIndex];
                    await prisma.document.create({
                        data: {
                            name: `Experience Doc - ${exp.companyName}`,
                            url: `/uploads/experience/${file.filename}`,
                            type: 'EXPERIENCE_LETTER',
                            userId: user.id,
                            workExperienceId: newExp.id
                        }
                    });
                    fileIndex++;
                }
            }
        }

        const { password: _, ...safeUser } = user;
        res.status(201).json({ message: "Employee onboarded successfully", user: safeUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Onboarding failed", error: error.message });
    }
};
