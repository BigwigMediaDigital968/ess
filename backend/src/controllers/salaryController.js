const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── INDIAN IT SALARY COMPUTATION ENGINE ────────────────────────────────────
//
// Standard Indian IT / Digital Marketing salary structure:
//
// EARNINGS:
//   Basic Salary        = Configurable (typically 40-50% of CTC)
//   HRA                 = 50% of Basic (Metro) / 40% (Non-Metro) — configurable
//   DA                  = Dearness Allowance (usually 0 for private sector)
//   Travel Allowance    = ₹1,600/mo standard (tax-exempt up to ₹1,600)
//   Medical Allowance   = ₹1,250/mo standard (tax-exempt up to ₹15,000/yr)
//   Special Allowance   = Balancing figure to reach CTC
//   Bonus               = Performance / Statutory bonus
//
// DEDUCTIONS:
//   PF (Employee)       = 12% of Basic (capped at ₹1,800 if basic > ₹15,000)
//   PF (Employer)       = 12% of Basic (employer contribution, shown for CTC)
//   Professional Tax    = State-wise slab (Maharashtra: ₹200/mo if basic > ₹10,000)
//   TDS                 = Estimated income tax (simplified slab)
//   LOP Deduction       = (Gross / Working Days) × LOP Days
//
// ────────────────────────────────────────────────────────────────────────────

const PROFESSIONAL_TAX_MONTHLY = (basic) => {
    // Maharashtra slab (most common for IT/Digital companies)
    if (basic <= 7500) return 0;
    if (basic <= 10000) return 175;
    return 200; // > ₹10,000
};

const computePF = (basic, pfConfig, pfFixedAmount) => {
    if (pfConfig === 'NONE') return 0;
    if (pfConfig === 'FIXED_AMOUNT') return pfFixedAmount || 0;
    // STANDARD_12: 12% of basic, capped at ₹1,800 (i.e., basic capped at ₹15,000)
    const pfBase = Math.min(basic, 15000);
    return Math.round(pfBase * 0.12);
};

const computeMonthlyTDS = (annualGross) => {
    // FY 2024-25 New Tax Regime (simplified)
    // Standard deduction: ₹75,000
    const taxableIncome = Math.max(0, annualGross - 75000);
    let tax = 0;
    if (taxableIncome <= 300000) tax = 0;
    else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
    else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
    else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
    else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20;
    else tax = 140000 + (taxableIncome - 1500000) * 0.30;

    // Add 4% Health & Education Cess
    tax = tax * 1.04;
    return Math.round(tax / 12);
};

// ─── SALARY STRUCTURE MANAGEMENT ────────────────────────────────────────────

exports.upsertSalaryStructure = async (req, res) => {
    const { userId, basic, hra, da, travelAllowance, medicalAllowance, specialAllowance, bonus, pfConfig, pfFixedAmount, ptConfig } = req.body;

    try {
        const salary = await prisma.salaryStructure.upsert({
            where: { userId },
            update: {
                basic: parseFloat(basic || 0),
                hra: parseFloat(hra || 0),
                da: parseFloat(da || 0),
                travelAllowance: parseFloat(travelAllowance || 0),
                medicalAllowance: parseFloat(medicalAllowance || 0),
                specialAllowance: parseFloat(specialAllowance || 0),
                bonus: parseFloat(bonus || 0),
                pfConfig: pfConfig || 'STANDARD_12',
                pfFixedAmount: parseFloat(pfFixedAmount || 0),
                ptConfig: ptConfig || 'STANDARD_STATE'
            },
            create: {
                userId,
                basic: parseFloat(basic || 0),
                hra: parseFloat(hra || 0),
                da: parseFloat(da || 0),
                travelAllowance: parseFloat(travelAllowance || 0),
                medicalAllowance: parseFloat(medicalAllowance || 0),
                specialAllowance: parseFloat(specialAllowance || 0),
                bonus: parseFloat(bonus || 0),
                pfConfig: pfConfig || 'STANDARD_12',
                pfFixedAmount: parseFloat(pfFixedAmount || 0),
                ptConfig: ptConfig || 'STANDARD_STATE'
            }
        });

        // Compute and return a preview
        const preview = computeSalaryBreakdown(salary, 26, 26, 0, 0);
        res.json({ structure: salary, preview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalaryStructure = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;

        // Check access
        const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) || req.user.isOwner;
        const isSelf = userId === requesterId;

        if (!isPrivileged && !isSelf) {
            // Check if requester is the manager of the target user
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { managerId: true }
            });

            if (!targetUser || targetUser.managerId !== requesterId) {
                return res.status(403).json({ message: "Access denied: You can only view salary structures for your direct reports." });
            }
        }

        const salary = await prisma.salaryStructure.findUnique({
            where: { userId }
        });
        if (!salary) return res.json(null);

        const preview = computeSalaryBreakdown(salary, 26, 26, 0, 0);
        res.json({ structure: salary, preview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PAYROLL GENERATION ──────────────────────────────────────────────────────

exports.generatePayrollForEmployee = async (req, res) => {
    const { userId, month, year, presentDays, paidLeaves, lopDays, totalDays, workingDays, isLopWaived, waiverReason } = req.body;

    try {
        // Check if already generated
        const existing = await prisma.payrollRecord.findUnique({
            where: { userId_month_year: { userId, month: parseInt(month), year: parseInt(year) } }
        });
        if (existing) return res.status(400).json({ message: "Payroll already generated for this period" });

        const structure = await prisma.salaryStructure.findUnique({ where: { userId } });
        if (!structure) return res.status(404).json({ message: "Salary structure not configured for this employee" });

        const wdTotal = parseInt(workingDays) || 26;
        const present = parseFloat(presentDays) || 0;
        const paid = parseFloat(paidLeaves) || 0;
        const lop = isLopWaived ? 0 : (parseFloat(lopDays) || 0);

        const breakdown = computeSalaryBreakdown(structure, wdTotal, present + paid, lop, 0);

        const record = await prisma.payrollRecord.create({
            data: {
                userId,
                month: parseInt(month),
                year: parseInt(year),
                totalDays: parseInt(totalDays) || 30,
                workingDays: wdTotal,
                presentDays: present,
                paidLeaves: paid,
                lopDays: parseFloat(lopDays) || 0,
                grossEarnings: breakdown.grossEarnings,
                totalDeductions: breakdown.totalDeductions,
                netPay: breakdown.netPay,
                basic: breakdown.basic,
                hra: breakdown.hra,
                da: breakdown.da,
                allowances: breakdown.allowances,
                pfEmployee: breakdown.pfEmployee,
                pfEmployer: breakdown.pfEmployer,
                professionalTax: breakdown.professionalTax,
                tds: breakdown.tds,
                otherDeductions: breakdown.lopDeduction,
                isLopWaived: isLopWaived || false,
                waiverReason: waiverReason || null,
                status: 'PROCESSED'
            }
        });

        res.status(201).json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getPayrollRecords = async (req, res) => {
    try {
        const { userId } = req.params;
        const records = await prisma.payrollRecord.findMany({
            where: { userId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyPayrollRecords = async (req, res) => {
    try {
        const records = await prisma.payrollRecord.findMany({
            where: { userId: req.user.id },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllEmployeeSalaries = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const role = req.user.LegacyRole || req.user.role?.name;

        const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) || req.user.isOwner;

        let whereClause = {};
        if (!isPrivileged) {
            // Managers only see their direct reports
            whereClause = {
                user: {
                    managerId: requesterId
                }
            };
        }

        const structures = await prisma.salaryStructure.findMany({
            where: whereClause,
            include: { user: { select: { id: true, name: true, email: true, designation: true, department: { select: { name: true } } } } }
        });
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.computeSalaryPreview = async (req, res) => {
    try {
        const { userId } = req.params;
        const { presentDays = 26, paidLeaves = 0, lopDays = 0, workingDays = 26 } = req.query;

        const structure = await prisma.salaryStructure.findUnique({ where: { userId } });
        if (!structure) return res.status(404).json({ message: "No salary structure found" });

        const preview = computeSalaryBreakdown(
            structure,
            parseInt(workingDays),
            parseFloat(presentDays) + parseFloat(paidLeaves),
            parseFloat(lopDays),
            0
        );
        res.json(preview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── CORE COMPUTATION FUNCTION ───────────────────────────────────────────────

function computeSalaryBreakdown(structure, workingDays, paidDays, lopDays, otherDeductions) {
    const basic = structure.basic;
    const hra = structure.hra;
    const da = structure.da;
    const travel = structure.travelAllowance;
    const medical = structure.medicalAllowance;
    const special = structure.specialAllowance;
    const bonus = structure.bonus;

    // Gross (full month)
    const fullGross = basic + hra + da + travel + medical + special + bonus;

    // LOP deduction: proportional to working days
    const perDayRate = workingDays > 0 ? fullGross / workingDays : 0;
    const lopDeduction = Math.round(perDayRate * lopDays);

    // Gross after LOP
    const grossEarnings = Math.round(fullGross - lopDeduction);

    // Deductions
    const pfEmployee = computePF(basic, structure.pfConfig, structure.pfFixedAmount);
    const pfEmployer = computePF(basic, structure.pfConfig, structure.pfFixedAmount); // shown for CTC
    const professionalTax = structure.ptConfig === 'NONE' ? 0 : PROFESSIONAL_TAX_MONTHLY(basic);

    // TDS on annualized gross
    const annualGross = grossEarnings * 12;
    const tds = computeMonthlyTDS(annualGross);

    const totalDeductions = pfEmployee + professionalTax + tds + lopDeduction + otherDeductions;
    const netPay = Math.round(grossEarnings - pfEmployee - professionalTax - tds - otherDeductions);

    // CTC = gross + employer PF
    const annualCTC = (fullGross + pfEmployer) * 12;

    return {
        // Earnings
        basic,
        hra,
        da,
        travelAllowance: travel,
        medicalAllowance: medical,
        specialAllowance: special,
        bonus,
        allowances: travel + medical + special,
        fullGross,
        grossEarnings,

        // Deductions
        pfEmployee,
        pfEmployer,
        professionalTax,
        tds,
        lopDeduction,
        otherDeductions,
        totalDeductions: pfEmployee + professionalTax + tds + lopDeduction + otherDeductions,

        // Net
        netPay,

        // CTC
        annualCTC,
        monthlyCTC: Math.round(annualCTC / 12)
    };
}
