import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { BarChart2, Users, Calendar, Briefcase, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS = {
    APPLIED: 'bg-blue-500/20 text-blue-300', ASSESSMENT: 'bg-yellow-500/20 text-yellow-300',
    INTERVIEW: 'bg-purple-500/20 text-purple-300', OFFER: 'bg-teal-500/20 text-teal-300',
    HIRED: 'bg-green-500/20 text-green-300', REJECTED: 'bg-red-500/20 text-red-300',
    APPROVED: 'bg-green-500/20 text-green-300', PENDING: 'bg-yellow-500/20 text-yellow-300',
    PRESENT: 'bg-green-500/20 text-green-300', ABSENT: 'bg-red-500/20 text-red-300',
    LATE: 'bg-orange-500/20 text-orange-300', WFH: 'bg-blue-500/20 text-blue-300',
};

// ─── Bar chart ────────────────────────────────────────────────────────────────
const BarChart = ({ data, labelKey, valueKey, color = "bg-purple-500" }) => {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div className="space-y-2">
            {data.map((d, i) => (
                <motion.div key={i} className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <span className="text-white/60 text-xs w-28 truncate shrink-0">{d[labelKey]}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                        <motion.div
                            className={`h-full ${color} rounded-full flex items-center justify-end pr-2`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max((d[valueKey] / max) * 100, 2)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                        >
                            <span className="text-white text-[10px] font-bold">{d[valueKey]}</span>
                        </motion.div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color = "text-purple-400", bg = "bg-purple-500/10" }) => (
    <motion.div
        className={`${bg} border border-white/10 rounded-xl p-4 flex items-center gap-4`}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
    >
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={20} className={color} /></div>
        <div>
            <p className="text-white/50 text-xs uppercase tracking-wider">{label}</p>
            <motion.p className={`text-2xl font-bold ${color}`} key={value}
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{value ?? '—'}</motion.p>
        </div>
    </motion.div>
);

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">{title}</h3>
        {children}
    </div>
);

// ─── Period selector ──────────────────────────────────────────────────────────
const PERIODS = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'half-yearly', label: 'Half-Yearly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom' },
];

const getPeriodRange = (period, year, month, quarter) => {
    const y = parseInt(year);
    const m = parseInt(month);
    const q = parseInt(quarter);
    switch (period) {
        case 'monthly': return { months: [{ month: m, year: y }] };
        case 'quarterly': {
            const start = (q - 1) * 3 + 1;
            return { months: [0, 1, 2].map(i => ({ month: start + i, year: y })) };
        }
        case 'half-yearly': {
            const start = m <= 6 ? 1 : 7;
            return { months: [0, 1, 2, 3, 4, 5].map(i => ({ month: start + i, year: y })) };
        }
        case 'yearly': return { months: MONTHS.map((_, i) => ({ month: i + 1, year: y })) };
        default: return { months: [{ month: m, year: y }] };
    }
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Reports = () => {
    const { api } = useAuth();
    const [activeTab, setActiveTab] = useState('recruitment');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef(null);

    const now = new Date();
    const [period, setPeriod] = useState('monthly');
    const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
    const [attYear, setAttYear] = useState(now.getFullYear());
    const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Multi-month attendance aggregation
    const [multiData, setMultiData] = useState(null);

    const fetchReport = async (tab = activeTab) => {
        setLoading(true);
        setData(null);
        setMultiData(null);
        try {
            if (tab === 'attendance') {
                if (period === 'custom' && customFrom && customTo) {
                    const from = new Date(customFrom);
                    const to = new Date(customTo);
                    const months = [];
                    let cur = new Date(from.getFullYear(), from.getMonth(), 1);
                    while (cur <= to) {
                        months.push({ month: cur.getMonth() + 1, year: cur.getFullYear() });
                        cur.setMonth(cur.getMonth() + 1);
                    }
                    await fetchMultiMonth(months);
                } else {
                    const { months } = getPeriodRange(period, attYear, attMonth, quarter);
                    if (months.length === 1) {
                        const { data: res } = await api.get(`/reports/attendance?month=${months[0].month}&year=${months[0].year}`);
                        setData(res);
                    } else {
                        await fetchMultiMonth(months);
                    }
                }
            } else {
                const { data: res } = await api.get(`/reports/${tab}`);
                setData(res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMultiMonth = async (months) => {
        const results = await Promise.all(
            months.map(({ month, year }) =>
                api.get(`/reports/attendance?month=${month}&year=${year}`)
                    .then(r => ({ ...r.data, label: `${MONTHS[month - 1]} ${year}` }))
                    .catch(() => null)
            )
        );
        const valid = results.filter(Boolean);
        // Aggregate
        const monthlyBreakdown = valid.map(r => ({
            month: r.label,
            present: r.summary?.PRESENT || r.summary?.present || 0,
            absent: r.summary?.absent || r.summary?.ABSENT || 0,
            late: r.summary?.LATE || r.summary?.late || 0,
            wfh: r.summary?.WFH || r.summary?.wfh || 0,
            total: r.summary?.totalRecords || 0,
            rate: r.summary?.totalEmployees > 0
                ? Math.round(((r.summary?.PRESENT || 0) + (r.summary?.WFH || 0)) / r.summary?.totalEmployees * 100)
                : 0
        }));
        const totals = monthlyBreakdown.reduce((acc, m) => ({
            present: acc.present + m.present,
            absent: acc.absent + m.absent,
            late: acc.late + m.late,
            wfh: acc.wfh + m.wfh,
            total: acc.total + m.total,
        }), { present: 0, absent: 0, late: 0, wfh: 0, total: 0 });

        // Dept aggregation
        const deptAgg = {};
        valid.forEach(r => {
            r.deptAttendance?.forEach(d => {
                if (!deptAgg[d.dept]) deptAgg[d.dept] = { rates: [], total: 0 };
                deptAgg[d.dept].rates.push(d.rate);
                deptAgg[d.dept].total += d.total;
            });
        });
        const deptAttendance = Object.entries(deptAgg).map(([dept, v]) => ({
            dept,
            rate: Math.round(v.rates.reduce((a, b) => a + b, 0) / v.rates.length),
            total: v.total
        })).sort((a, b) => b.rate - a.rate);

        setMultiData({ monthlyBreakdown, totals, deptAttendance, months: valid.length });
    };

    useEffect(() => { fetchReport(); }, [activeTab]);

    // ─── PDF Download ─────────────────────────────────────────────────────────
    const downloadPDF = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#0f0f1a',
                scale: 1.5,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            const pageH = pdf.internal.pageSize.getHeight();
            let y = 0;
            while (y < pdfH) {
                if (y > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH);
                y += pageH;
            }
            const periodLabel = period === 'custom' ? `${customFrom}_to_${customTo}` :
                period === 'monthly' ? `${MONTHS[attMonth - 1]}_${attYear}` :
                    period === 'quarterly' ? `Q${quarter}_${attYear}` :
                        period === 'half-yearly' ? `H${attMonth <= 6 ? 1 : 2}_${attYear}` : `${attYear}`;
            pdf.save(`${activeTab}_report_${periodLabel}.pdf`);
        } catch (e) {
            console.error('PDF error', e);
        } finally {
            setDownloading(false);
        }
    };

    const tabs = [
        { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
        { id: 'ess', label: 'Employee', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Reports & Analytics
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Insights across Recruitment, Employees & Attendance</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchReport()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={downloadPDF} disabled={downloading || loading || (!data && !multiData)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                        <Download size={14} className={downloading ? 'animate-bounce' : ''} />
                        {downloading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Attendance period filters */}
            {activeTab === 'attendance' && (
                <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex gap-1 flex-wrap">
                        {PERIODS.map(p => (
                            <button key={p.id} onClick={() => setPeriod(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${period === p.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {period === 'custom' ? (
                            <>
                                <input type="month" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                                <span className="text-white/40 text-sm">to</span>
                                <input type="month" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                            </>
                        ) : (
                            <>
                                {(period === 'monthly' || period === 'half-yearly') && (
                                    <select value={attMonth} onChange={e => setAttMonth(e.target.value)}
                                        className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none">
                                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                    </select>
                                )}
                                {period === 'quarterly' && (
                                    <select value={quarter} onChange={e => setQuarter(e.target.value)}
                                        className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none">
                                        {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                    </select>
                                )}
                                <input type="number" value={attYear} onChange={e => setAttYear(e.target.value)}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none w-24" />
                            </>
                        )}
                        <button onClick={() => fetchReport('attendance')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                </div>
            )}

            {/* Report content — wrapped in ref for PDF */}
            <div ref={reportRef} className="space-y-5">

                {/* ── RECRUITMENT ── */}
                <AnimatePresence mode="wait">
                    {!loading && data && activeTab === 'recruitment' && (
                        <motion.div key="recruitment" className="space-y-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="Total Jobs" value={data.summary.totalJobs} icon={Briefcase} color="text-purple-400" bg="bg-purple-500/10" />
                                <StatCard label="Open Jobs" value={data.summary.openJobs} icon={BarChart2} color="text-green-400" bg="bg-green-500/10" />
                                <StatCard label="Applications" value={data.summary.totalApplications} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
                                <StatCard label="Hired" value={data.summary.hired} icon={CheckCircle} color="text-teal-400" bg="bg-teal-500/10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Section title="📊 Application Pipeline">
                                    {data.pipeline.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                        <BarChart data={data.pipeline} labelKey="status" valueKey="count" color="bg-purple-500" />}
                                </Section>
                                <Section title="🎁 Offer Status">
                                    {data.offers.length === 0 ? <p className="text-white/30 text-sm">No offers yet</p> :
                                        <div className="space-y-3">{data.offers.map(o => (
                                            <div key={o.status} className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-white/10 text-white/60'}`}>{o.status}</span>
                                                <span className="text-white font-bold">{o.count}</span>
                                            </div>
                                        ))}</div>}
                                </Section>
                                <Section title="📈 Monthly Applications Trend">
                                    {data.monthlyTrend.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                        <BarChart data={data.monthlyTrend} labelKey="month" valueKey="count" color="bg-indigo-500" />}
                                </Section>
                                <Section title="🤖 AI Score Distribution">
                                    <BarChart data={data.aiScoreDistribution} labelKey="range" valueKey="count" color="bg-teal-500" />
                                </Section>
                                <Section title="🏆 Top Jobs by Applications">
                                    {data.appsPerJob.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                        <BarChart data={data.appsPerJob} labelKey="job" valueKey="count" color="bg-orange-500" />}
                                </Section>
                                <Section title="🎯 Conversion Summary">
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Hire Rate', value: data.summary.totalApplications > 0 ? `${Math.round(data.summary.hired / data.summary.totalApplications * 100)}%` : '0%', color: 'text-green-400' },
                                            { label: 'Rejection Rate', value: data.summary.totalApplications > 0 ? `${Math.round(data.summary.rejected / data.summary.totalApplications * 100)}%` : '0%', color: 'text-red-400' },
                                            { label: 'In Offer Stage', value: data.summary.inOffer, color: 'text-teal-400' },
                                            { label: 'Open Positions', value: data.summary.openJobs, color: 'text-purple-400' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-white/60 text-sm">{label}</span>
                                                <span className={`font-bold text-lg ${color}`}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        </motion.div>
                    )}

                    {/* ── ESS ── */}
                    {!loading && data && activeTab === 'ess' && (
                        <motion.div key="ess" className="space-y-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatCard label="Total Employees" value={data.summary.totalEmployees} icon={Users} color="text-purple-400" bg="bg-purple-500/10" />
                                <StatCard label="Departments" value={data.summary.totalDepts} icon={Briefcase} color="text-blue-400" bg="bg-blue-500/10" />
                                <StatCard label="Salary Configured" value={data.summary.configuredSalaries} icon={BarChart2} color="text-green-400" bg="bg-green-500/10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Section title="🏢 Headcount by Department">
                                    {data.headcountByDept.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                        <BarChart data={data.headcountByDept} labelKey="department" valueKey="count" color="bg-purple-500" />}
                                </Section>
                                <Section title="💰 Salary Distribution (Basic)">
                                    <BarChart data={data.salaryBands} labelKey="band" valueKey="count" color="bg-green-500" />
                                </Section>
                                <Section title="🌴 Leave Requests by Status">
                                    {data.leaveByStatus.length === 0 ? <p className="text-white/30 text-sm">No leave data</p> :
                                        <div className="space-y-3">{data.leaveByStatus.map(l => (
                                            <div key={l.status} className="flex items-center justify-between py-2 border-b border-white/5">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[l.status] || 'bg-white/10 text-white/60'}`}>{l.status}</span>
                                                <span className="text-white font-bold">{l.count}</span>
                                            </div>
                                        ))}</div>}
                                </Section>
                                <Section title="📈 New Hires (Last 6 Months)">
                                    {data.hiringTrend.length === 0 ? <p className="text-white/30 text-sm">No recent hires</p> :
                                        <BarChart data={data.hiringTrend} labelKey="month" valueKey="count" color="bg-teal-500" />}
                                </Section>
                                <Section title="👔 Top Designations">
                                    {data.byDesignation.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                        <BarChart data={data.byDesignation} labelKey="designation" valueKey="count" color="bg-indigo-500" />}
                                </Section>
                            </div>
                        </motion.div>
                    )}

                    {/* ── ATTENDANCE ── */}
                    {!loading && activeTab === 'attendance' && (data || multiData) && (
                        <motion.div key="attendance" className="space-y-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            {/* Multi-month view */}
                            {multiData && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatCard label="Present" value={multiData.totals.present} icon={CheckCircle} color="text-green-400" bg="bg-green-500/10" />
                                        <StatCard label="Absent" value={multiData.totals.absent} icon={XCircle} color="text-red-400" bg="bg-red-500/10" />
                                        <StatCard label="Late" value={multiData.totals.late} icon={Clock} color="text-orange-400" bg="bg-orange-500/10" />
                                        <StatCard label="WFH" value={multiData.totals.wfh} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
                                    </div>

                                    <Section title={`📅 Month-wise Attendance Breakdown (${multiData.months} months)`}>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                                                        <th className="text-left py-2">Month</th>
                                                        <th className="text-center">Present</th>
                                                        <th className="text-center">Absent</th>
                                                        <th className="text-center">Late</th>
                                                        <th className="text-center">WFH</th>
                                                        <th className="text-right">Att. Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {multiData.monthlyBreakdown.map((m, i) => (
                                                        <motion.tr key={i} className="border-b border-white/5 hover:bg-white/5"
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                                            <td className="py-2 text-white/80 font-medium">{m.month}</td>
                                                            <td className="text-center text-green-400">{m.present}</td>
                                                            <td className="text-center text-red-400">{m.absent}</td>
                                                            <td className="text-center text-orange-400">{m.late}</td>
                                                            <td className="text-center text-blue-400">{m.wfh}</td>
                                                            <td className="text-right">
                                                                <span className={`font-bold ${m.rate >= 80 ? 'text-green-400' : m.rate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                    {m.rate}%
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Section>

                                    <Section title="📈 Attendance Rate Trend">
                                        <BarChart
                                            data={multiData.monthlyBreakdown.map(m => ({ month: m.month, rate: m.rate }))}
                                            labelKey="month" valueKey="rate" color="bg-purple-500"
                                        />
                                    </Section>

                                    <Section title="🏢 Dept-wise Attendance Rate (Avg)">
                                        {multiData.deptAttendance.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                            <BarChart
                                                data={multiData.deptAttendance.map(d => ({ ...d, label: `${d.dept} (${d.rate}%)` }))}
                                                labelKey="label" valueKey="rate" color="bg-teal-500"
                                            />}
                                    </Section>
                                </>
                            )}

                            {/* Single-month view */}
                            {data && !multiData && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatCard label="Total Employees" value={data.summary.totalEmployees} icon={Users} color="text-purple-400" bg="bg-purple-500/10" />
                                        <StatCard label="Records" value={data.summary.totalRecords} icon={Calendar} color="text-blue-400" bg="bg-blue-500/10" />
                                        <StatCard label="Present" value={data.summary.PRESENT || data.summary.present || 0} icon={CheckCircle} color="text-green-400" bg="bg-green-500/10" />
                                        <StatCard label="Absent" value={data.summary.ABSENT || data.summary.absent || 0} icon={XCircle} color="text-red-400" bg="bg-red-500/10" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Section title="📊 Status Breakdown">
                                            {data.statusBreakdown.length === 0 ? <p className="text-white/30 text-sm">No data for this period</p> :
                                                <div className="space-y-3">{data.statusBreakdown.map(s => (
                                                    <div key={s.status} className="flex items-center justify-between py-2 border-b border-white/5">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_COLORS[s.status?.toUpperCase()] || 'bg-white/10 text-white/60'}`}>{s.status}</span>
                                                        <span className="text-white font-bold">{s.count}</span>
                                                    </div>
                                                ))}</div>}
                                        </Section>
                                        <Section title="🏢 Attendance Rate by Department">
                                            {data.deptAttendance.length === 0 ? <p className="text-white/30 text-sm">No data</p> :
                                                <BarChart
                                                    data={data.deptAttendance.map(d => ({ ...d, label: `${d.dept} (${d.rate}%)` }))}
                                                    labelKey="label" valueKey="rate" color="bg-teal-500"
                                                />}
                                        </Section>
                                        <Section title="👤 Employee Attendance Summary">
                                            {data.employeeSummary.length === 0 ? <p className="text-white/30 text-sm">No data</p> : (
                                                <div className="overflow-y-auto max-h-72">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                                                                <th className="text-left py-2">Employee</th>
                                                                <th className="text-center">P</th><th className="text-center">A</th>
                                                                <th className="text-center">L</th><th className="text-center">WFH</th>
                                                                <th className="text-right">Rate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.employeeSummary.map((e, i) => (
                                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                                    <td className="py-2 text-white/80 truncate max-w-[120px]">{e.name}</td>
                                                                    <td className="text-center text-green-400">{e.present}</td>
                                                                    <td className="text-center text-red-400">{e.absent}</td>
                                                                    <td className="text-center text-orange-400">{e.late}</td>
                                                                    <td className="text-center text-blue-400">{e.wfh}</td>
                                                                    <td className="text-right">
                                                                        <span className={`font-bold ${e.attendancePct >= 80 ? 'text-green-400' : e.attendancePct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                            {e.attendancePct}%
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </Section>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && !data && !multiData && (
                    <div className="text-center py-20 text-white/30">
                        <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Failed to load report. Check your permissions or select a valid period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
