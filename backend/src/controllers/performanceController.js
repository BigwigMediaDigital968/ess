const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createPerformanceReview = async (req, res) => {
    const { userId, period, goals, rating, feedback } = req.body;
    // Reviewer is the logged in user (Manager/Admin)
    try {
        const review = await prisma.performance.create({
            data: {
                userId,
                reviewerId: req.user.id,
                period,
                goals, // JSON object
                rating,
                feedback
            },
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await prisma.performance.findMany({
            where: { userId: req.user.id },
            include: { reviewer: { select: { name: true } } }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTeamReviews = async (req, res) => {
    // Get reviews where I am the reviewer
    try {
        const reviews = await prisma.performance.findMany({
            where: { reviewerId: req.user.id },
            include: { user: { select: { name: true } } }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
