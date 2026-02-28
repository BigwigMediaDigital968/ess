import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { DollarSign, Download, FileText, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

const MySalarySlips = () => {
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOlderDropdown, setShowOlderDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => { fetchPayrolls(); }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowOlderDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await api.get('/salary/payroll/my');
            // Sort newest first
            const sorted = (res.data || []).sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            });
            setPayrolls(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const monthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const statusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'PROCESSED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'DRAFT': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const downloadSlip = (p) => {
        const token = localStorage.getItem('token');
        const url = `/api/salary/slip-pdf?month=${p.month}&year=${p.year}&userId=${user.id}`;
        // Open with auth via window.open since PDF is streamed
        window.open(url, '_blank');
    };

    const recentSlips = payrolls.slice(0, 6);
    const olderSlips = payrolls.slice(6);

    if (loading) return (
        <div className="min-h-screen p-6 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading salary records...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-xl">
                            <DollarSign className="w-6 h-6 text-pink-400" />
                        </div>
                        My Salary Slips
                    </h1>
                    <p className="text-gray-400 mt-1">Download your payslips · Tax Year 2025-26 · New Regime</p>
                </div>
                {payrolls.length > 0 && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Annual CTC</p>
                        <p className="text-xl font-bold text-emerald-400">{formatCurrency((payrolls[0]?.grossEarnings || 0) * 12)}</p>
                    </div>
                )}
            </div>

            {payrolls.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                    <FileText className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No salary slips available yet.</p>
                    <p className="text-gray-500 text-sm mt-1">Your payslips will appear here once payroll is processed.</p>
                </div>
            ) : (
                <>
                    {/* Recent 6 Tiles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentSlips.map(p => (
                            <div key={p.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/8 transition-all hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/5 group">
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{monthName(p.month)} {p.year}</h3>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${statusColor(p.status)}`}>
                                            {p.status || 'Processed'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Net Pay</div>
                                        <div className="text-xl font-bold text-emerald-400">{formatCurrency(p.netPay)}</div>
                                    </div>
                                </div>

                                {/* Mini Breakdown */}
                                <div className="space-y-1.5 text-sm mb-4">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Gross Earnings</span>
                                        <span className="text-emerald-400">{formatCurrency(p.grossEarnings)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Deductions</span>
                                        <span className="text-red-400">-{formatCurrency(p.totalDeductions)}</span>
                                    </div>
                                    {p.workingDays && (
                                        <div className="flex justify-between text-gray-500 text-xs pt-1 border-t border-white/5">
                                            <span>Present {p.presentDays}/{p.workingDays} days</span>
                                            {p.lopDays > 0 && <span className="text-red-400">LOP: {p.lopDays}d</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Download Button */}
                                <button
                                    onClick={() => downloadSlip(p)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-purple-500/30 group-hover:shadow-lg"
                                >
                                    <Download size={15} />
                                    Download Payslip
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Older Slips Dropdown */}
                    {olderSlips.length > 0 && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowOlderDropdown(!showOlderDropdown)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                            >
                                <TrendingUp size={16} />
                                Older Salary Slips ({olderSlips.length})
                                {showOlderDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showOlderDropdown && (
                                <div className="absolute top-12 left-0 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-30 overflow-hidden">
                                    <div className="p-3 border-b border-white/10">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Previous Records</p>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {olderSlips.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                <div>
                                                    <p className="text-white text-sm font-medium">{monthName(p.month)} {p.year}</p>
                                                    <p className="text-gray-400 text-xs">{formatCurrency(p.netPay)}</p>
                                                </div>
                                                <button
                                                    onClick={() => { downloadSlip(p); setShowOlderDropdown(false); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    <Download size={12} /> Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MySalarySlips;
