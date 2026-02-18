const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.generatePayroll = async (req, res) => {
    // Admin only - Stub for generation logic based on attendance
    // In real app, calculate based on working days, leaves, etc.
    const { month, year, userId, basicSalary, allowances, deductions } = req.body;

    try {
        const netPay = basicSalary + allowances - deductions;
        const payroll = await prisma.payroll.create({
            data: {
                userId,
                month,
                year,
                basicSalary,
                allowances,
                deductions,
                netPay,
                status: 'PROCESSED'
            },
        });
        res.status(201).json(payroll);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyPayroll = async (req, res) => {
    try {
        const payrolls = await prisma.payroll.findMany({
            where: { userId: req.user.id },
            orderBy: { year: 'desc', month: 'desc' }
        });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
