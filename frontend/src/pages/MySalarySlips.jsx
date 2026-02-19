import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { DollarSign, Download, ChevronLeft, ChevronRight, FileText } from "lucide-react";

const MySalarySlips = () => {
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPayrolls(); }, []);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await api.get('/salary/payroll/my');
            setPayrolls(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const monthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const statusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'PROCESSED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'DRAFT': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-pink-400" />
                    My Salary Slips
                </h1>
                <p className="text-gray-400 mt-1">View your payroll history and salary breakdowns</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading payroll records...</div>
            ) : payrolls.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    <FileText className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No salary slips available yet.</p>
                    <p className="text-gray-500 text-sm mt-1">Your salary slips will appear here once payroll is processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payrolls.map(p => (
                        <div key={p.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/8 transition-colors">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-semibold">{monthName(p.month)} {p.year}</h3>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${statusColor(p.status)}`}>
                                        {p.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">Net Pay</div>
                                    <div className="text-xl font-bold text-emerald-400">{formatCurrency(p.netPay)}</div>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Basic</span>
                                    <span className="text-white">{formatCurrency(p.basic)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>HRA</span>
                                    <span className="text-white">{formatCurrency(p.hra)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>DA</span>
                                    <span className="text-white">{formatCurrency(p.da)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Allowances</span>
                                    <span className="text-white">{formatCurrency(p.allowances)}</span>
                                </div>
                                <div className="border-t border-white/10 my-2" />
                                <div className="flex justify-between text-gray-400">
                                    <span>Gross Earnings</span>
                                    <span className="text-emerald-400 font-medium">{formatCurrency(p.grossEarnings)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>PF (Employee)</span>
                                    <span className="text-red-400">-{formatCurrency(p.pfEmployee)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Professional Tax</span>
                                    <span className="text-red-400">-{formatCurrency(p.professionalTax)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>TDS</span>
                                    <span className="text-red-400">-{formatCurrency(p.tds)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Total Deductions</span>
                                    <span className="text-red-400 font-medium">-{formatCurrency(p.totalDeductions)}</span>
                                </div>
                            </div>

                            {/* Days Info */}
                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-500">
                                <span>Working: {p.workingDays}d</span>
                                <span>Present: {p.presentDays}d</span>
                                <span>LOP: {p.lopDays}d</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySalarySlips;
