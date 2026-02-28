const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOffice = async (req, res) => {
    try {
        const { name, address, latitude, longitude, radius } = req.body;
        const organizationId = req.user.organizationId;

        if (!name || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Name, latitude, and longitude are required." });
        }

        const newOffice = await prisma.office.create({
            data: {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: radius ? parseFloat(radius) : 200,
                organizationId
            }
        });

        res.status(201).json({ message: "Office created successfully", office: newOffice });
    } catch (error) {
        console.error("Create Office Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getOffices = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        const offices = await prisma.office.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: { users: true, assets: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(offices);
    } catch (error) {
        console.error("Get Offices Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateOffice = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, latitude, longitude, radius } = req.body;
        const organizationId = req.user.organizationId;

        const office = await prisma.office.findFirst({
            where: { id, organizationId }
        });

        if (!office) {
            return res.status(404).json({ message: "Office not found" });
        }

        const updatedOffice = await prisma.office.update({
            where: { id },
            data: {
                name: name || office.name,
                address: address !== undefined ? address : office.address,
                latitude: latitude !== undefined ? parseFloat(latitude) : office.latitude,
                longitude: longitude !== undefined ? parseFloat(longitude) : office.longitude,
                radius: radius !== undefined ? parseFloat(radius) : office.radius
            }
        });

        res.status(200).json({ message: "Office updated successfully", office: updatedOffice });
    } catch (error) {
        console.error("Update Office Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteOffice = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;

        const office = await prisma.office.findFirst({
            where: { id, organizationId }
        });

        if (!office) {
            return res.status(404).json({ message: "Office not found" });
        }

        // Check if users or assets are strictly tied to it
        const usersCount = await prisma.user.count({ where: { assignedOfficeId: id } });
        const assetsCount = await prisma.asset.count({ where: { officeId: id } });

        if (usersCount > 0 || assetsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete office. It still has ${usersCount} users and ${assetsCount} assets assigned.`
            });
        }

        await prisma.office.delete({ where: { id } });

        res.status(200).json({ message: "Office deleted successfully" });
    } catch (error) {
        console.error("Delete Office Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
