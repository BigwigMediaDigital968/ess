import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Download, RefreshCw, BarChart2, Activity, Clock, RefreshCcw, AlertCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

// ─── Donut chart ──────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];
const DonutChart = ({ data, labelKey, valueKey }) => {
    const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1;
    let offset = 0;
    const R = 60, CX = 70, CY = 70, CIRC = 2 * Math.PI * R;
    const slices = data.map((d, i) => {
        const pct = d[valueKey] / total;
        const dash = pct * CIRC;
        const slice = { ...d, dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
        offset += dash;
        return slice;
    });
    return (
        <div className="flex items-center gap-6 flex-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140">
                {slices.map((s, i) => (
                    <circle key={i} cx={CX} cy={CY} r={R}
                        fill="none" stroke={s.color} strokeWidth="22"
                        strokeDasharray={`${s.dash} ${CIRC - s.dash}`}
                        strokeDashoffset={-s.offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
                    />
                ))}
                <text x={CX} y={CY + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{total}</text>
            </svg>
            <div className="flex flex-col gap-1.5">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-white/70 text-xs">{s[labelKey]}</span>
                        <span className="text-white font-bold text-xs ml-auto pl-4">{s[valueKey]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIODS = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'half-yearly', label: 'Half-Yearly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom Range' }
];

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors`}>
        <div className={`p-3 rounded-xl ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
        <div>
            <p className="text-white/50 text-sm">{label}</p>
            <p className="text-2xl font-bold font-mono">{value || 0}</p>
        </div>
    </div>
);

const Section = ({ title, children, className = '' }) => (
    <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl ${className}`}>
        <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">{title}</h3>
        <div className="min-h-[200px] flex flex-col justify-center">{children}</div>
    </div>
);

const ServiceDeskReports = () => {
    const { api } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [exportingServerPDF, setExportingServerPDF] = useState(false);

    const now = new Date();
    const [period, setPeriod] = useState('monthly');
    const [reportSubType, setReportSubType] = useState('summary');
    const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
    const [attYear, setAttYear] = useState(now.getFullYear());
    const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const reportRef = useRef(null);

    const getPeriodRange = (p, y, m, q) => {
        let months = [];
        if (p === 'monthly') months = [{ month: m, year: y }];
        else if (p === 'quarterly') {
            const startNode = (q - 1) * 3 + 1;
            months = [
                { month: startNode, year: y },
                { month: startNode + 1, year: y },
                { month: startNode + 2, year: y }
            ];
        } else if (p === 'half-yearly') {
            const startNode = m <= 6 ? 1 : 7;
            for (let i = 0; i < 6; i++) months.push({ month: startNode + i, year: y });
        } else if (p === 'yearly') {
            for (let i = 1; i <= 12; i++) months.push({ month: i, year: y });
        }
        return { months };
    };

    const fetchReport = async () => {
        setLoading(true);
        setData(null);
        try {
            let sdFrom, sdTo;
            if (period === 'custom' && customFrom && customTo) {
                sdFrom = new Date(customFrom);
                sdTo = new Date(customTo);
                sdTo.setMonth(sdTo.getMonth() + 1);
            } else {
                const { months } = getPeriodRange(period, attYear, attMonth, quarter);
                if (months.length > 0) {
                    sdFrom = new Date(months[0].year, months[0].month - 1, 1);
                    const last = months[months.length - 1];
                    sdTo = new Date(last.year, last.month, 1);
                }
            }
            const q = sdFrom && sdTo ? `?startDate=${sdFrom.toISOString()}&endDate=${sdTo.toISOString()}` : '';
            const { data: res } = await api.get(`/reports/servicedesk${q}`);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [period, attMonth, attYear, quarter, customFrom, customTo]);

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
            pdf.save(`servicedesk_report_${periodLabel}.pdf`);
        } catch (e) {
            console.error('PDF error', e);
        } finally {
            setDownloading(false);
        }
    };

    const exportServerPDF = async () => {
        setExportingServerPDF(true);
        try {
            let sdFrom, sdTo;
            if (period === 'custom' && customFrom && customTo) {
                sdFrom = new Date(customFrom);
                sdTo = new Date(customTo);
                sdTo.setMonth(sdTo.getMonth() + 1);
            } else {
                const { months } = getPeriodRange(period, attYear, attMonth, quarter);
                if (months.length > 0) {
                    sdFrom = new Date(months[0].year, months[0].month - 1, 1);
                    const last = months[months.length - 1];
                    sdTo = new Date(last.year, last.month, 1);
                }
            }

            const q = sdFrom && sdTo ? `&startDate=${sdFrom.toISOString()}&endDate=${sdTo.toISOString()}` : '';
            const params = `type=servicedesk&subType=${reportSubType}${q}`;

            const res = await api.get(`/reports/export-pdf?${params}`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `servicedesk-${reportSubType}-${period}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Server PDF error', e);
            alert('PDF export failed');
        } finally {
            setExportingServerPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                        Service Desk Analytics
                    </h1>
                    <p className="text-white/40 text-sm mt-1">ITIL Activity metrics and SLA tracking for ITSM.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchReport()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={exportServerPDF} disabled={exportingServerPDF || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                        <Download size={14} className={exportingServerPDF ? 'animate-bounce' : ''} />
                        {exportingServerPDF ? 'Generating...' : 'Export PDF'}
                    </button>
                    <button onClick={downloadPDF} disabled={downloading || loading || !data}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                        <Download size={14} className={downloading ? 'animate-bounce' : ''} />
                        {downloading ? 'Snapshot...' : 'Screenshot PDF'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex gap-2 mr-2">
                    <select value={reportSubType} onChange={(e) => setReportSubType(e.target.value)}
                        className="bg-black/40 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none">
                        <option value="summary">Executive Summary</option>
                        <option value="incident_monthly">Incident Report</option>
                        <option value="sla_monthly">SLA Compliance Report</option>
                        <option value="engineer_wise">Engineer-wise Report</option>
                        <option value="team_category_wise">Team & Category Report</option>
                    </select>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {PERIODS.map(p => (
                        <button key={p.id} onClick={() => setPeriod(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${period === p.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {period === 'custom' ? (
                        <>
                            <input type="month" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none" />
                            <span className="text-white/40 text-sm">to</span>
                            <input type="month" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none" />
                        </>
                    ) : (
                        <>
                            {(period === 'monthly' || period === 'half-yearly') && (
                                <select value={attMonth} onChange={e => setAttMonth(Number(e.target.value))}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none">
                                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                </select>
                            )}
                            {period === 'quarterly' && (
                                <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none">
                                    {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                </select>
                            )}
                            {period !== 'custom' && (
                                <input type="number" value={attYear} onChange={e => setAttYear(Number(e.target.value))}
                                    className="bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none w-24" />
                            )}
                        </>
                    )}
                </div>
            </div>

            <div ref={reportRef} className="bg-[#0f0f1a] p-4 -m-4 rounded-xl space-y-5">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <motion.div
                            className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!loading && data && (
                        <motion.div key="servicedesk" className="space-y-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="Total Incidents" value={data.summary?.totalIncidents} icon={Activity} color="text-purple-400" bg="bg-purple-500/10" />
                                <StatCard label="Open Incidents" value={data.summary?.openIncidents} icon={Clock} color="text-yellow-400" bg="bg-yellow-500/10" />
                                <StatCard label="Change Requests" value={data.summary?.totalChanges} icon={RefreshCcw} color="text-blue-400" bg="bg-blue-500/10" />
                                <StatCard label="Active Problems" value={data.summary?.activeProblems} icon={AlertCircle || XCircle} color="text-orange-400" bg="bg-orange-500/10" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Section title="🚨 Incident Volume by Priority">
                                    {(data.byPriority?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No data</p>
                                        : <DonutChart data={data.byPriority} labelKey="priority" valueKey="count" />}
                                </Section>

                                <Section title="📈 Monthly Ticket Trend">
                                    {(data.ticketTrend?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No data</p>
                                        : <BarChart data={data.ticketTrend} labelKey="month" valueKey="count" color="bg-indigo-500" />}
                                </Section>

                                <Section title="⏱️ SLA Compliance">
                                    {(data.slaMetrics?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No data</p>
                                        : <div className="flex gap-8 justify-around items-center h-full">
                                            <DonutChart data={data.slaMetrics} labelKey="metric" valueKey="count" />
                                        </div>}
                                </Section>

                                <Section title="🏆 Top Resolving Agents">
                                    {(data.agentPerformance?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No closures yet</p>
                                        : <BarChart data={data.agentPerformance} labelKey="name" valueKey="count" color="bg-teal-500" />}
                                </Section>

                                <Section title="🔄 Change Requests by Type">
                                    {(data.changesByType?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No data</p>
                                        : <BarChart data={data.changesByType} labelKey="type" valueKey="count" color="bg-purple-500" />}
                                </Section>

                                <Section title="📊 Incidents by Status">
                                    {(data.byStatus?.length ?? 0) === 0
                                        ? <p className="text-white/30 text-sm">No data</p>
                                        : <BarChart data={data.byStatus} labelKey="status" valueKey="count" color="bg-emerald-500" />}
                                </Section>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && !data && (
                    <div className="text-center py-20 text-white/30">
                        <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Failed to load report. Check your permissions or select a valid period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceDeskReports;
