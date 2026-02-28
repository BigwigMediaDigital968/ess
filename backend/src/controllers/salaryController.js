const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');


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

const PROFESSIONAL_TAX_MONTHLY = (basic, month) => {
    // Maharashtra slab — most common for Indian IT companies
    // PT is NOT deducted for months with 0 salary (e.g. LOP-full months)
    if (basic <= 0) return 0;
    if (basic <= 7500) return 0;
    if (basic <= 10000) return 175;
    // Feb = ₹300, all other months = ₹200
    return (month === 2) ? 300 : 200;
};

const computePF = (basic, pfConfig, pfFixedAmount) => {
    if (pfConfig === 'NONE') return 0;
    if (pfConfig === 'FIXED_AMOUNT') return pfFixedAmount || 0;
    // STANDARD_12: 12% of basic, capped at wage ceiling ₹15,000
    const pfBase = Math.min(basic, 15000);
    return Math.round(pfBase * 0.12);
};

// FY 2025-26 New Regime — Budget 2025
// Standard deduction: ₹75,000
// Section 87A Rebate: Tax = ₹0 if taxable income ≤ ₹12,00,000
const computeMonthlyTDS = (annualCTC, month = new Date().getMonth() + 1) => {
    // Use CTC as the tax base (industry standard for TDS computation)
    const taxableIncome = Math.max(0, annualCTC - 75000); // standard deduction

    let tax = 0;
    if (taxableIncome <= 400000) tax = 0;
    else if (taxableIncome <= 800000) tax = (taxableIncome - 400000) * 0.05;
    else if (taxableIncome <= 1200000) tax = 20000 + (taxableIncome - 800000) * 0.10;
    else if (taxableIncome <= 1600000) tax = 60000 + (taxableIncome - 1200000) * 0.15;
    else if (taxableIncome <= 2000000) tax = 120000 + (taxableIncome - 1600000) * 0.20;
    else if (taxableIncome <= 2400000) tax = 200000 + (taxableIncome - 2000000) * 0.25;
    else tax = 300000 + (taxableIncome - 2400000) * 0.30;

    // Section 87A: Full rebate if taxable income ≤ ₹12,00,000
    if (taxableIncome <= 1200000) tax = 0;

    // 4% Health & Education Cess
    tax = Math.round(tax * 1.04);

    // Spread evenly across 12 months; remaining months get slightly more if rounding
    return Math.round(tax / 12);
};

// ─── STRUCTURE FROM CTC ────────────────────────────────────────────────────────
// Auto-compute all Indian IT standard salary components from Annual CTC
const computeStructureFromCTC = (ctcAnnual) => {
    const monthly = Math.round(ctcAnnual / 12);
    // Standard IT company breakdown (industry norms)
    const basic = Math.round(monthly * 0.40);  // 40% of monthly CTC
    const hra = Math.round(basic * 0.50);  // 50% of Basic (Metro HRA)
    const da = 0;                            // 0% DA for private sector
    const travelAllowance = 1600;                         // ₹1,600 standard (tax-exempt)
    const medicalAllowance = 1250;                         // ₹1,250 standard (tax-exempt)
    // Special allowance = balancing figure
    const declared = basic + hra + da + travelAllowance + medicalAllowance;
    const pfEmployer = Math.round(Math.min(basic, 15000) * 0.12); // employer PF adds to CTC
    const specialAllowance = Math.max(0, Math.round(monthly - declared - pfEmployer / 12));
    return { basic, hra, da, travelAllowance, medicalAllowance, specialAllowance, bonus: 0, ctcAnnual };
};

exports.structureFromCTC = async (req, res) => {
    try {
        const { userId, ctcAnnual } = req.body;
        if (!userId || !ctcAnnual) return res.status(400).json({ message: 'userId and ctcAnnual are required' });
        const components = computeStructureFromCTC(parseFloat(ctcAnnual));
        const salary = await prisma.salaryStructure.upsert({
            where: { userId },
            update: { ...components, pfConfig: 'STANDARD_12', ptConfig: 'STANDARD_STATE' },
            create: { userId, ...components, pfConfig: 'STANDARD_12', ptConfig: 'STANDARD_STATE' }
        });
        res.json({ structure: salary, components });
    } catch (error) {
        console.error('structureFromCTC error:', error);
        res.status(500).json({ message: error.message });
    }
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

function computeSalaryBreakdown(structure, workingDays, paidDays, lopDays, otherDeductions, month) {
    const basic = structure.basic;
    const hra = structure.hra;
    const da = structure.da;
    const travel = structure.travelAllowance;
    const medical = structure.medicalAllowance;
    const special = structure.specialAllowance;
    const bonus = structure.bonus;
    const m = month || new Date().getMonth() + 1;

    const fullGross = basic + hra + da + travel + medical + special + bonus;

    // LOP deduction: proportional to working days
    const perDayRate = workingDays > 0 ? fullGross / workingDays : 0;
    const lopDeduction = Math.round(perDayRate * lopDays);
    const grossEarnings = Math.round(fullGross - lopDeduction);

    // Deductions
    const pfEmployee = computePF(basic, structure.pfConfig, structure.pfFixedAmount);
    const pfEmployer = computePF(basic, structure.pfConfig, structure.pfFixedAmount);
    const professionalTax = structure.ptConfig === 'NONE' ? 0 : PROFESSIONAL_TAX_MONTHLY(basic, m);

    // TDS on Annual CTC (gross + employer PF)
    const annualCTC = structure.ctcAnnual || ((fullGross + pfEmployer) * 12);
    const tds = computeMonthlyTDS(annualCTC, m);

    const totalDeductions = pfEmployee + professionalTax + tds + lopDeduction + otherDeductions;
    const netPay = Math.round(grossEarnings - pfEmployee - professionalTax - tds - otherDeductions);

    return {
        basic, hra, da,
        travelAllowance: travel,
        medicalAllowance: medical,
        specialAllowance: special,
        bonus,
        allowances: travel + medical + special,
        fullGross,
        grossEarnings,
        pfEmployee,
        pfEmployer,
        professionalTax,
        tds,
        lopDeduction,
        otherDeductions,
        totalDeductions,
        netPay,
        annualCTC,
        monthlyCTC: Math.round(annualCTC / 12)
    };
}

// ─── EXCEL SALARY EXPORT ──────────────────────────────────────────────────────

exports.exportSalaryExcel = async (req, res) => {
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const orgId = req.user.organizationId;

    try {
        const org = orgId ? await prisma.organization.findUnique({ where: { id: orgId } }) : { name: 'Organization' };

        // Fetch all payroll records for this period
        const records = await prisma.payrollRecord.findMany({
            where: { month: m, year: y, user: orgId ? { organizationId: orgId } : undefined },
            include: { user: { select: { name: true, email: true, designation: true, department: { select: { name: true } } } } },
            orderBy: [{ user: { name: 'asc' } }]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = org?.name || 'ESS Portal';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Salary Sheet', { pageSetup: { orientation: 'landscape' } });

        const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' });
        const period = `${monthName} ${y}`;

        // === Header rows ===
        sheet.mergeCells('A1:P1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `${org?.name || 'Organization'} — Salary Sheet — ${period}`;
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA855F7' } };
        titleCell.alignment = { horizontal: 'center' };
        sheet.getRow(1).height = 28;

        sheet.mergeCells('A2:P2');
        const genCell = sheet.getCell('A2');
        genCell.value = `Generated: ${new Date().toLocaleString()}   |   Total Employees: ${records.length}`;
        genCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
        genCell.alignment = { horizontal: 'center' };
        sheet.getRow(2).height = 16;

        // === Column headers ===
        const headers = [
            { header: '#', key: 'sno', width: 5 },
            { header: 'Employee Name', key: 'name', width: 22 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Designation', key: 'designation', width: 20 },
            { header: 'Department', key: 'dept', width: 18 },
            { header: 'Working Days', key: 'workingDays', width: 13 },
            { header: 'Present Days', key: 'presentDays', width: 13 },
            { header: 'LOP Days', key: 'lopDays', width: 10 },
            { header: 'Basic (₹)', key: 'basic', width: 12 },
            { header: 'HRA (₹)', key: 'hra', width: 12 },
            { header: 'Allowances (₹)', key: 'allowances', width: 14 },
            { header: 'Gross (₹)', key: 'gross', width: 13 },
            { header: 'PF (₹)', key: 'pf', width: 11 },
            { header: 'PT (₹)', key: 'pt', width: 11 },
            { header: 'TDS (₹)', key: 'tds', width: 11 },
            { header: 'Net Pay (₹)', key: 'netPay', width: 14 },
        ];
        sheet.columns = headers;

        // Render header row (row 3)
        const headerRow = sheet.getRow(3);
        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h.header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } };
        });
        headerRow.height = 20;

        // === Data rows (starting row 4) ===
        let totals = { basic: 0, hra: 0, allowances: 0, gross: 0, pf: 0, pt: 0, tds: 0, netPay: 0 };


        records.forEach((rec, idx) => {
            const rowIdx = 4 + idx;
            const isAlt = idx % 2 === 1;
            const bgArgb = isAlt ? 'FFF5F0FF' : 'FFFFFFFF';
            const row = sheet.getRow(rowIdx);
            const vals = [
                idx + 1,
                rec.user?.name || '-',
                rec.user?.email || '-',
                rec.user?.designation || '-',
                rec.user?.department?.name || '-',
                rec.workingDays,
                rec.presentDays,
                rec.lopDays,
                rec.basic,
                rec.hra,
                rec.allowances || 0,
                rec.grossEarnings,
                rec.pfEmployee,
                rec.professionalTax,
                rec.tds,
                rec.netPay,
            ];
            vals.forEach((v, ci) => {
                const cell = row.getCell(ci + 1);
                cell.value = v;
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
                cell.font = { size: 9 };
                cell.alignment = { vertical: 'middle', horizontal: ci > 7 ? 'right' : 'left' };
            });
            row.height = 18;

            totals.basic += rec.basic || 0;
            totals.hra += rec.hra || 0;
            totals.allowances += (rec.allowances || 0);
            totals.gross += rec.grossEarnings || 0;
            totals.pf += rec.pfEmployee || 0;
            totals.pt += rec.professionalTax || 0;
            totals.tds += rec.tds || 0;
            totals.netPay += rec.netPay || 0;
        });

        // Totals row
        const totalRowIdx = 4 + records.length;
        const totalRow = sheet.getRow(totalRowIdx);
        const totalVals = ['', 'TOTALS', '', '', '', '', '', '', totals.basic, totals.hra, totals.allowances, totals.gross, totals.pf, totals.pt, totals.tds, totals.netPay];
        totalVals.forEach((v, ci) => {
            const cell = totalRow.getCell(ci + 1);
            cell.value = v;
            cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA855F7' } };
            cell.alignment = { vertical: 'middle', horizontal: ci > 7 ? 'right' : 'left' };
        });
        totalRow.height = 20;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SalarySheet-${period.replace(/ /g, '-')}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel export error:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
};

// ─── ATTENDANCE-BASED PAYROLL AUTO-GENERATION ────────────────────────────────
// Reads actual attendance clock-in/out records + approved leaves and auto-generates
// PayrollRecords for all employees in the org for the given month.

exports.generatePayrollFromAttendance = async (req, res) => {
    const { month, year } = req.body;
    const orgId = req.user.organizationId;

    const m = parseInt(month);
    const y = parseInt(year);
    if (!m || !y || m < 1 || m > 12) return res.status(400).json({ message: 'Invalid month or year' });

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    // Calculate working days in the month (Mon-Fri)
    let workingDays = 0;
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) workingDays++;
    }

    try {
        // Fetch all employees in org with salary structures
        const employees = await prisma.user.findMany({
            where: { organizationId: orgId },
            include: { salaryStructure: true }
        });

        const results = { processed: [], skipped: [], errors: [] };

        for (const emp of employees) {
            if (!emp.salaryStructure) {
                results.skipped.push({ name: emp.name, reason: 'No salary structure configured' });
                continue;
            }

            // Check if payroll already generated
            const existing = await prisma.payrollRecord.findUnique({
                where: { userId_month_year: { userId: emp.id, month: m, year: y } }
            });
            if (existing) {
                results.skipped.push({ name: emp.name, reason: 'Payroll already generated for this period' });
                continue;
            }

            // Count attendance records for the period
            const attendance = await prisma.attendance.findMany({
                where: { userId: emp.id, date: { gte: startDate, lt: endDate } }
            });

            let presentDays = 0;
            for (const a of attendance) {
                if (a.status === 'PRESENT') presentDays += 1;
                else if (a.status === 'HALF_DAY') presentDays += 0.5;
                // ABSENT = 0, WFH counts as present
            }

            // Count approved paid leaves
            const paidLeaves = await prisma.leaveRequest.count({
                where: {
                    userId: emp.id,
                    status: 'APPROVED',
                    startDate: { gte: startDate },
                    endDate: { lt: endDate }
                }
            });

            const lopDays = Math.max(0, workingDays - presentDays - paidLeaves);

            const breakdown = computeSalaryBreakdown(
                emp.salaryStructure,
                workingDays,
                presentDays + paidLeaves,
                lopDays,
                0
            );

            try {
                const record = await prisma.payrollRecord.create({
                    data: {
                        userId: emp.id,
                        month: m,
                        year: y,
                        totalDays: new Date(y, m, 0).getDate(), // days in month
                        workingDays,
                        presentDays,
                        paidLeaves,
                        lopDays,
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
                        isLopWaived: false,
                        status: 'PROCESSED'
                    }
                });
                results.processed.push({ name: emp.name, netPay: breakdown.netPay, presentDays, lopDays });
            } catch (err) {
                results.errors.push({ name: emp.name, error: err.message });
            }
        }

        res.json({
            message: `Payroll generated for ${results.processed.length} employees.`,
            period: `${new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' })} ${y}`,
            workingDays,
            ...results
        });
    } catch (error) {
        console.error('Payroll generation error:', error);
        res.status(500).json({ message: error.message });
    }
};
