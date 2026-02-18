import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { IndianRupee, Users, ChevronDown, ChevronUp, Save, RefreshCw, Calculator, Info } from "lucide-react";

// ─── Indian IT Salary Computation (mirrors backend logic) ───────────────────
const computeBreakdown = (s, workingDays = 26, paidDays = 26, lopDays = 0) => {
    if (!s) return null;
    const { basic = 0, hra = 0, da = 0, travelAllowance = 0, medicalAllowance = 0, specialAllowance = 0, bonus = 0, pfConfig = 'STANDARD_12', pfFixedAmount = 0, ptConfig = 'STANDARD_STATE' } = s;

    const fullGross = basic + hra + da + travelAllowance + medicalAllowance + specialAllowance + bonus;
    const perDay = workingDays > 0 ? fullGross / workingDays : 0;
    const lopDeduction = Math.round(perDay * lopDays);
    const grossEarnings = Math.round(fullGross - lopDeduction);

    // PF
    let pfEmployee = 0;
    if (pfConfig === 'FIXED_AMOUNT') pfEmployee = pfFixedAmount;
    else if (pfConfig === 'STANDARD_12') pfEmployee = Math.round(Math.min(basic, 15000) * 0.12);
    const pfEmployer = pfEmployee;

    // Professional Tax (Maharashtra slab)
    let professionalTax = 0;
    if (ptConfig !== 'NONE') {
        if (basic > 10000) professionalTax = 200;
        else if (basic > 7500) professionalTax = 175;
    }

    // TDS (FY2024-25 New Regime)
    const annualGross = grossEarnings * 12;
    const taxable = Math.max(0, annualGross - 75000);
    let tax = 0;
    if (taxable > 1500000) tax = 140000 + (taxable - 1500000) * 0.30;
    else if (taxable > 1200000) tax = 80000 + (taxable - 1200000) * 0.20;
    else if (taxable > 1000000) tax = 50000 + (taxable - 1000000) * 0.15;
    else if (taxable > 700000) tax = 20000 + (taxable - 700000) * 0.10;
    else if (taxable > 300000) tax = (taxable - 300000) * 0.05;
    const tds = Math.round((tax * 1.04) / 12);

    const totalDeductions = pfEmployee + professionalTax + tds + lopDeduction;
    const netPay = Math.round(grossEarnings - pfEmployee - professionalTax - tds);
    const annualCTC = (fullGross + pfEmployer) * 12;

    return { basic, hra, da, travelAllowance, medicalAllowance, specialAllowance, bonus, fullGross, grossEarnings, pfEmployee, pfEmployer, professionalTax, tds, lopDeduction, totalDeductions, netPay, annualCTC };
};

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const TOOLTIP = {
    basic: "Core salary component. Typically 40-50% of CTC. PF is computed on this.",
    hra: "House Rent Allowance. Metro: 50% of Basic, Non-Metro: 40%. Tax-exempt if rent paid.",
    da: "Dearness Allowance. Usually 0 for private IT/Digital companies.",
    travelAllowance: "Transport/Conveyance allowance. Tax-exempt up to ₹1,600/mo.",
    medicalAllowance: "Medical reimbursement. Tax-exempt up to ₹15,000/yr (₹1,250/mo).",
    specialAllowance: "Balancing component to reach target CTC. Fully taxable.",
    bonus: "Performance or statutory bonus. Can be monthly or annual (divided by 12).",
};

const FieldRow = ({ label, name, value, onChange, tooltip, readOnly }) => {
    const [showTip, setShowTip] = useState(false);
    return (
        <div className="flex items-center gap-3 py-3 border-b border-white/5">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white/80 font-medium">{label}</span>
                    {tooltip && (
                        <div className="relative">
                            <Info size={13} className="text-white/30 cursor-pointer hover:text-white/60" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} />
                            {showTip && (
                                <div className="absolute left-5 top-0 z-50 w-64 bg-gray-800 border border-white/10 rounded-lg p-3 text-xs text-white/70 shadow-xl">
                                    {tooltip}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!readOnly && (
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-lg overflow-hidden focus-within:border-purple-500 transition">
                        <span className="px-2 text-white/40 text-sm">₹</span>
                        <input
                            type="number"
                            name={name}
                            value={value}
                            onChange={onChange}
                            className="w-28 bg-transparent text-white text-sm py-2 pr-3 focus:outline-none"
                            min="0"
                        />
                    </div>
                )}
                {readOnly && <span className="text-white/60 text-sm w-28 text-right">{fmt(value)}</span>}
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const SalaryManagement = () => {
    const { user, api } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [structure, setStructure] = useState(null);
    const [form, setForm] = useState({
        basic: 0, hra: 0, da: 0, travelAllowance: 1600, medicalAllowance: 1250,
        specialAllowance: 0, bonus: 0, pfConfig: 'STANDARD_12', pfFixedAmount: 0, ptConfig: 'STANDARD_STATE'
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPayroll, setShowPayroll] = useState(false);
    const [payrollForm, setPayrollForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), presentDays: 26, paidLeaves: 0, lopDays: 0, workingDays: 26, totalDays: 30 });
    const [generatingPayroll, setGeneratingPayroll] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const canEdit = ['HR', 'ADMIN', 'OWNER'].includes(user?.LegacyRole) ||
        user?.isOwner ||
        ['ADMINISTRATOR', 'LEADERSHIP', 'EXECUTIVE'].includes(user?.role?.type);

    const preview = computeBreakdown(form, payrollForm.workingDays, payrollForm.presentDays + payrollForm.paidLeaves, payrollForm.lopDays);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/employees');
            setEmployees(data);
        } catch (e) { console.error(e); }
    };

    const loadStructure = async (emp) => {
        setSelectedEmp(emp);
        setLoading(true);
        try {
            const { data } = await api.get(`/salary/structure/${emp.id}`);
            if (data?.structure) {
                setStructure(data.structure);
                setForm({ ...data.structure });
            } else {
                // Default structure based on designation
                const defaults = getDefaultStructure(emp.designation);
                setForm(defaults);
                setStructure(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultStructure = (designation) => {
        // Typical Indian IT/Digital Marketing salary bands
        const bands = {
            'Junior': { basic: 20000, hra: 10000, da: 0, travelAllowance: 1600, medicalAllowance: 1250, specialAllowance: 5000, bonus: 2000 },
            'Senior': { basic: 40000, hra: 20000, da: 0, travelAllowance: 1600, medicalAllowance: 1250, specialAllowance: 10000, bonus: 5000 },
            'Lead': { basic: 60000, hra: 30000, da: 0, travelAllowance: 1600, medicalAllowance: 1250, specialAllowance: 15000, bonus: 8000 },
            'Manager': { basic: 80000, hra: 40000, da: 0, travelAllowance: 1600, medicalAllowance: 1250, specialAllowance: 20000, bonus: 10000 },
        };
        const key = Object.keys(bands).find(k => designation?.toLowerCase().includes(k.toLowerCase())) || 'Junior';
        return { ...bands[key], pfConfig: 'STANDARD_12', pfFixedAmount: 0, ptConfig: 'STANDARD_STATE' };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name.includes('Config') ? value : parseFloat(value) || 0 }));
    };

    const handleAutoFill = () => {
        // Auto-compute HRA as 50% of basic (metro)
        setForm(prev => ({
            ...prev,
            hra: Math.round(prev.basic * 0.5),
            travelAllowance: 1600,
            medicalAllowance: 1250
        }));
    };

    const handleSave = async () => {
        if (!selectedEmp) return;
        setSaving(true);
        try {
            await api.post('/salary/structure', { userId: selectedEmp.id, ...form });
            setSuccessMsg('Salary structure saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleGeneratePayroll = async () => {
        if (!selectedEmp) return;
        setGeneratingPayroll(true);
        try {
            await api.post('/salary/payroll/generate', {
                userId: selectedEmp.id,
                ...payrollForm,
                month: parseInt(payrollForm.month),
                year: parseInt(payrollForm.year)
            });
            setSuccessMsg('Payroll generated successfully!');
            setShowPayroll(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setGeneratingPayroll(false);
        }
    };

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
                        Salary Structure
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Indian IT / Digital Marketing — CTC Builder</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <IndianRupee size={14} className="text-green-400" />
                    <span className="text-green-400 text-xs font-medium">FY 2024-25 Tax Rules</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee List */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                        <Users size={16} className="text-white/50" />
                        <span className="text-white font-semibold text-sm">Employees</span>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {employees.map(emp => (
                            <button
                                key={emp.id}
                                onClick={() => loadStructure(emp)}
                                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition flex items-center gap-3 ${selectedEmp?.id === emp.id ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}`}
                            >
                                <img
                                    src={emp.profilePictureUrl ? `http://localhost:3434${emp.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${emp.name}&background=random&size=32`}
                                    className="w-8 h-8 rounded-full"
                                    alt={emp.name}
                                />
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{emp.name}</p>
                                    <p className="text-white/40 text-xs truncate">{emp.designation || 'Employee'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Salary Editor */}
                <div className="lg:col-span-2 space-y-4">
                    {!selectedEmp ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/30">
                            <IndianRupee size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Select an employee to configure salary structure</p>
                        </div>
                    ) : loading ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/30">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-1">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedEmp.name}</h2>
                                        <p className="text-white/40 text-sm">{selectedEmp.designation} · {selectedEmp.department?.name}</p>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <button onClick={handleAutoFill} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 text-xs">
                                                <RefreshCw size={12} /> Auto-fill HRA
                                            </button>
                                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm disabled:opacity-50">
                                                {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {successMsg && <p className="text-green-400 text-xs mt-2">{successMsg}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Earnings */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3">💰 Earnings</h3>
                                    <FieldRow label="Basic Salary" name="basic" value={form.basic} onChange={handleChange} tooltip={TOOLTIP.basic} readOnly={!canEdit} />
                                    <FieldRow label="HRA" name="hra" value={form.hra} onChange={handleChange} tooltip={TOOLTIP.hra} readOnly={!canEdit} />
                                    <FieldRow label="Dearness Allowance" name="da" value={form.da} onChange={handleChange} tooltip={TOOLTIP.da} readOnly={!canEdit} />
                                    <FieldRow label="Travel Allowance" name="travelAllowance" value={form.travelAllowance} onChange={handleChange} tooltip={TOOLTIP.travelAllowance} readOnly={!canEdit} />
                                    <FieldRow label="Medical Allowance" name="medicalAllowance" value={form.medicalAllowance} onChange={handleChange} tooltip={TOOLTIP.medicalAllowance} readOnly={!canEdit} />
                                    <FieldRow label="Special Allowance" name="specialAllowance" value={form.specialAllowance} onChange={handleChange} tooltip={TOOLTIP.specialAllowance} readOnly={!canEdit} />
                                    <FieldRow label="Bonus (Monthly)" name="bonus" value={form.bonus} onChange={handleChange} tooltip={TOOLTIP.bonus} readOnly={!canEdit} />

                                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                                        <span className="text-white/60 text-sm">Gross Salary</span>
                                        <span className="text-green-400 font-bold">{fmt(preview?.fullGross)}</span>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">📉 Deductions Config</h3>

                                    {canEdit && (
                                        <>
                                            <div className="mb-3">
                                                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">PF Config</label>
                                                <select name="pfConfig" value={form.pfConfig} onChange={handleChange}
                                                    className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none">
                                                    <option value="STANDARD_12">Standard 12% (capped ₹15,000 base)</option>
                                                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                                                    <option value="NONE">No PF</option>
                                                </select>
                                            </div>
                                            {form.pfConfig === 'FIXED_AMOUNT' && (
                                                <FieldRow label="PF Fixed Amount" name="pfFixedAmount" value={form.pfFixedAmount} onChange={handleChange} readOnly={false} />
                                            )}
                                            <div className="mb-3">
                                                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Professional Tax</label>
                                                <select name="ptConfig" value={form.ptConfig} onChange={handleChange}
                                                    className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none">
                                                    <option value="STANDARD_STATE">Standard (Maharashtra Slab)</option>
                                                    <option value="NONE">No Professional Tax</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* Computed Deductions */}
                                    <div className="space-y-2 mt-2">
                                        {[
                                            { label: 'PF (Employee 12%)', value: preview?.pfEmployee },
                                            { label: 'PF (Employer 12%)', value: preview?.pfEmployer, sub: true },
                                            { label: 'Professional Tax', value: preview?.professionalTax },
                                            { label: 'TDS (Est. Monthly)', value: preview?.tds },
                                        ].map(({ label, value, sub }) => (
                                            <div key={label} className={`flex justify-between text-sm ${sub ? 'opacity-50' : ''}`}>
                                                <span className="text-white/60">{label}{sub ? ' *' : ''}</span>
                                                <span className="text-red-400">{fmt(value)}</span>
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-white/30 mt-1">* Employer PF is part of CTC, not deducted from salary</p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                                        <span className="text-white/60 text-sm">Total Deductions</span>
                                        <span className="text-red-400 font-bold">{fmt(preview?.totalDeductions)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTC Summary */}
                            <div className="bg-gradient-to-r from-purple-900/30 to-teal-900/30 border border-purple-500/20 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Calculator size={16} /> CTC Breakdown
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Gross Monthly', value: preview?.fullGross, color: 'text-white' },
                                        { label: 'Net Take-Home', value: preview?.netPay, color: 'text-green-400' },
                                        { label: 'Monthly CTC', value: (preview?.fullGross || 0) + (preview?.pfEmployer || 0), color: 'text-teal-400' },
                                        { label: 'Annual CTC', value: preview?.annualCTC, color: 'text-purple-400' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="text-center bg-black/20 rounded-xl p-3">
                                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
                                            <p className={`text-xl font-bold ${color}`}>{fmt(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payroll Generation */}
                            {canEdit && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                    <button onClick={() => setShowPayroll(!showPayroll)} className="w-full flex items-center justify-between p-5 hover:bg-white/5">
                                        <span className="text-white font-semibold flex items-center gap-2">
                                            <IndianRupee size={16} className="text-teal-400" /> Generate Monthly Payroll
                                        </span>
                                        {showPayroll ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                                    </button>
                                    {showPayroll && (
                                        <div className="px-5 pb-5 border-t border-white/10">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Month</label>
                                                    <select value={payrollForm.month} onChange={e => setPayrollForm(p => ({ ...p, month: e.target.value }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none">
                                                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Year</label>
                                                    <input type="number" value={payrollForm.year} onChange={e => setPayrollForm(p => ({ ...p, year: e.target.value }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Working Days</label>
                                                    <input type="number" value={payrollForm.workingDays} onChange={e => setPayrollForm(p => ({ ...p, workingDays: parseFloat(e.target.value) }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Present Days</label>
                                                    <input type="number" value={payrollForm.presentDays} onChange={e => setPayrollForm(p => ({ ...p, presentDays: parseFloat(e.target.value) }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Paid Leaves</label>
                                                    <input type="number" value={payrollForm.paidLeaves} onChange={e => setPayrollForm(p => ({ ...p, paidLeaves: parseFloat(e.target.value) }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">LOP Days</label>
                                                    <input type="number" value={payrollForm.lopDays} onChange={e => setPayrollForm(p => ({ ...p, lopDays: parseFloat(e.target.value) }))}
                                                        className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                            </div>

                                            {payrollForm.lopDays > 0 && (
                                                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-300">
                                                    LOP Deduction: {fmt(preview?.lopDeduction)} · Net Pay this month: {fmt(preview?.netPay - (preview?.lopDeduction || 0))}
                                                </div>
                                            )}

                                            <button onClick={handleGeneratePayroll} disabled={generatingPayroll}
                                                className="mt-4 w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-500 flex items-center justify-center gap-2 disabled:opacity-50">
                                                {generatingPayroll ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <IndianRupee size={16} />}
                                                Generate Payroll for {MONTHS[payrollForm.month - 1]} {payrollForm.year}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalaryManagement;
