const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updateStatus = async (req, res) => {
    const { statusMessage, workLocation, shiftStart, shiftEnd } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                statusMessage,
                workLocation,
                shiftStart,
                shiftEnd
            }
        });
        res.json({
            statusMessage: user.statusMessage,
            workLocation: user.workLocation,
            shiftStart: user.shiftStart,
            shiftEnd: user.shiftEnd
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
