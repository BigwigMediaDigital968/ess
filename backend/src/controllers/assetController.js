const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCategoryShortcode = (category) => {
    const codes = {
        LAPTOP: 'LPT', DESKTOP: 'DSK', SERVER: 'SVR',
        WIRED_KEYBOARD: 'WKB', WIRED_MOUSE: 'WMS',
        WIRELESS_KEYBOARD: 'WLK', WIRELESS_MOUSE: 'WLM',
        WEBCAM: 'CAM', DOCKING_STATION: 'DCK',
        MONITOR: 'TFT', NETWORK_SWITCH: 'SWI',
        FIREWALL: 'FWL', ROUTER: 'RTR', OTHER: 'OTH'
    };
    return codes[category] || 'OTH';
};

const formatAssetId = (category, serial) => {
    const cleanSerial = serial.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortcode = getCategoryShortcode(category);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `BSL-${shortcode}-${cleanSerial}-${dd}${mm}${yyyy}`;
};

exports.createAsset = async (req, res) => {
    try {
        const role = req.user.LegacyRole || req.user.role?.name;
        const roleType = req.user.role?.type;
        const canManage = ['HR', 'ADMIN', 'OWNER'].includes(role) ||
            ['ADMINISTRATOR'].includes(roleType) || req.user.isOwner;
        if (!canManage) {
            return res.status(403).json({ message: 'Only Admin, Owner or HR can add assets.' });
        }

        const { serialNumber, name, category, warrantyExpiry, configuration, officeId } = req.body;
        const organizationId = req.user.organizationId;

        if (!serialNumber) {
            return res.status(400).json({ message: "Serial number is required." });
        }

        const existing = await prisma.asset.findUnique({ where: { serialNumber } });
        if (existing) {
            return res.status(400).json({ message: "Asset with this serial number already exists." });
        }

        const cat = category || 'OTHER';
        const generatedAssetId = formatAssetId(cat, serialNumber);

        const newAsset = await prisma.asset.create({
            data: {
                serialNumber,
                assetId: generatedAssetId,
                name: name || `Asset ${serialNumber}`,
                category: cat,
                configuration: configuration || {},
                warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
                status: 'IN_STOCK',
                organizationId,
                ...(officeId && { officeId })
            }
        });

        res.status(201).json({ message: "Asset created successfully", asset: newAsset });
    } catch (error) {
        console.error("Create Asset Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const role = req.user.LegacyRole || req.user.role?.name;
        const roleType = req.user.role?.type;
        const canManage = ['HR', 'ADMIN', 'OWNER'].includes(role) ||
            ['ADMINISTRATOR'].includes(roleType) || req.user.isOwner;
        if (!canManage) {
            return res.status(403).json({ message: 'Only Admin, Owner or HR can delete assets.' });
        }

        const { id } = req.params;
        const organizationId = req.user.organizationId;

        const asset = await prisma.asset.findFirst({ where: { id, organizationId } });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        await prisma.asset.delete({ where: { id } });
        res.json({ message: 'Asset deleted successfully.' });
    } catch (error) {
        console.error('Delete Asset Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getAssets = async (req, res) => {
    try {
        const { organizationId, id: userId, role } = req.user;

        // Ensure role exists in user object. If not, fallback to legacy checks or fetch it.
        const userRoleName = role?.name || req.user.LegacyRole;
        const userRoleType = role?.type || '';

        console.log(`[getAssets] Fetch Started! User: ${userId}, Org: ${organizationId}, RoleName: ${userRoleName}, RoleType: ${userRoleType}`);

        let assets = [];

        const isSuperViewer = ['HR', 'Director', 'Admin', 'Owner', 'AssetMgr', 'Co-Founder'].includes(userRoleName)
            || userRoleName === 'ADMIN'
            || userRoleType === 'ADMINISTRATOR';

        console.log(`[getAssets] isSuperViewer?: ${isSuperViewer}`);

        if (isSuperViewer) {
            // Can see all assets in org
            assets = await prisma.asset.findMany({
                where: { organizationId },
                include: { assignedTo: { select: { id: true, name: true, email: true, designation: true } } },
                orderBy: { createdAt: 'desc' }
            });
        } else if (['Manager', 'Tech Lead', 'LEADERSHIP'].some(r => userRoleName.includes(r) || role?.type === r) || userRoleName === 'MANAGER') {
            // Get subordinates
            const subordinates = await prisma.user.findMany({
                where: { managerId: userId, organizationId }
            });
            const subIds = subordinates.map(s => s.id);

            assets = await prisma.asset.findMany({
                where: {
                    organizationId,
                    assignedToId: { in: subIds }
                },
                include: { assignedTo: { select: { id: true, name: true, email: true, designation: true } } },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Normal user can only see their own assigned assets
            assets = await prisma.asset.findMany({
                where: {
                    organizationId,
                    assignedToId: userId
                },
                include: { assignedTo: { select: { id: true, name: true, email: true, designation: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }

        // We also want to expose users that managers/admins can assign assets to.
        // Instead of making a separate route, we could optionally return them, or they can use the existing employees endpoint.

        console.log(`[getAssets] userRoleName: ${userRoleName}, role: ${JSON.stringify(role)}, legacyRole: ${req.user.LegacyRole}, assets length: ${assets.length}`);

        res.status(200).json(assets);
    } catch (error) {
        console.error("Get Assets Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateAssetStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedToId } = req.body;
        const organizationId = req.user.organizationId;

        const asset = await prisma.asset.findFirst({
            where: { id, organizationId }
        });

        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }

        let updateData = { status };
        if (status === 'ASSIGNED') {
            if (!assignedToId) {
                return res.status(400).json({ message: "assignedToId is required when status is ASSIGNED" });
            }
            updateData.assignedToId = assignedToId;
        } else if (['IN_STOCK', 'POPS', 'RETIRED'].includes(status)) {
            updateData.assignedToId = null; // Unassign if returning to stock or retired
        }

        const updatedAsset = await prisma.asset.update({
            where: { id },
            data: updateData,
            include: { assignedTo: { select: { id: true, name: true, email: true, designation: true } } }
        });

        res.status(200).json({ message: "Asset updated successfully", asset: updatedAsset });
    } catch (error) {
        console.error("Update Asset Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
