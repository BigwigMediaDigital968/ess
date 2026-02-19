import { useState, useRef } from "react";
import { API_BASE_URL } from "../utils/config";
import { motion } from "framer-motion";
import { Download, Building2, User, Calendar, IndianRupee, TrendingUp, Shield } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// ─── The printable slip ───────────────────────────────────────────────────────
const SlipContent = ({ data }) => {
    const { employee, org, period, attendance, earnings, deductions, summary } = data;
    const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

    return (
        <div id="salary-slip-print" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#fff', color: '#1a1a2e', width: '780px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '32px 40px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        {org.logoUrl && (
                            <img src={`${API_BASE_URL}${org.logoUrl}`} alt="Logo"
                                style={{ height: '48px', objectFit: 'contain', marginBottom: '12px', filter: 'brightness(0) invert(1)' }} />
                        )}
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '0.5px' }}>{org.name}</h1>
                        {org.address && <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.6 }}>{org.address}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px', backdropFilter: 'blur(10px)' }}>
                            <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Salary Slip</p>
                            <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700 }}>{period.monthName} {period.year}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '24px 0' }} />

                {/* Employee Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    {[
                        { label: 'Employee Name', value: employee.name },
                        { label: 'Employee ID', value: employee.id },
                        { label: 'Designation', value: employee.designation },
                        { label: 'Department', value: employee.department },
                        { label: 'Reporting Manager', value: employee.manager },
                        { label: 'Email', value: employee.email },
                    ].map(item => (
                        <div key={item.label}>
                            <p style={{ margin: 0, fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.label}</p>
                            <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 600 }}>{item.value || '—'}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance Summary */}
            <div style={{ background: '#f8f9ff', padding: '20px 40px', borderBottom: '1px solid #e8eaf6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[
                        { label: 'Total Days', value: attendance.totalDays, color: '#1a1a2e' },
                        { label: 'Days Present', value: attendance.presentDays, color: '#2e7d32' },
                        { label: 'LOP Days', value: attendance.lopDays, color: '#c62828' },
                        { label: 'Working Days', value: attendance.workingDays, color: '#1565c0' },
                    ].map(item => (
                        <div key={item.label} style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: item.color }}>{item.value}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Earnings & Deductions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Earnings */}
                <div style={{ padding: '28px 32px', borderRight: '1px solid #e8eaf6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '20px', background: 'linear-gradient(to bottom, #2e7d32, #66bb6a)', borderRadius: '2px' }} />
                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '1px' }}>Earnings</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {earnings.map((e, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '9px 0', fontSize: '13px', color: '#444' }}>{e.label}</td>
                                    <td style={{ padding: '9px 0', fontSize: '13px', fontWeight: 600, textAlign: 'right', color: '#2e7d32' }}>{fmt(e.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid #e8eaf6' }}>
                                <td style={{ padding: '12px 0 0', fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>Gross Earnings</td>
                                <td style={{ padding: '12px 0 0', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: '#2e7d32' }}>{fmt(totalEarnings)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Deductions */}
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '20px', background: 'linear-gradient(to bottom, #c62828, #ef5350)', borderRadius: '2px' }} />
                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '1px' }}>Deductions</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {deductions.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '9px 0', fontSize: '13px', color: '#444' }}>{d.label}</td>
                                    <td style={{ padding: '9px 0', fontSize: '13px', fontWeight: 600, textAlign: 'right', color: '#c62828' }}>{fmt(d.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid #e8eaf6' }}>
                                <td style={{ padding: '12px 0 0', fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>Total Deductions</td>
                                <td style={{ padding: '12px 0 0', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: '#c62828' }}>{fmt(totalDeductions)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Net Pay Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#fff' }}>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Net Pay (Take Home)</p>
                    <p style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: 800, color: '#a5d6a7' }}>{fmt(summary.netPay)}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.5 }}>Annual CTC: {fmt(summary.annualCTC)}</p>
                </div>
                <div style={{ textAlign: 'right', color: '#fff' }}>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.5 }}>This is a computer-generated document.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.5 }}>No signature required.</p>
                    <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7, fontWeight: 600 }}>
                        {period.monthName} {period.year}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ background: '#f8f9ff', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e8eaf6' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#999' }}>Confidential — For internal use only</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#999' }}>Generated by {org.name} HR Portal</p>
            </div>
        </div>
    );
};

// ─── Salary Slip Widget (used in Chat or standalone) ─────────────────────────
const SalarySlipWidget = ({ api, month, year, userId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const slipRef = useRef(null);

    const fetchSlip = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ month, year });
            if (userId) params.append('userId', userId);
            const { data: d } = await api.get(`/salary/slip-data?${params}`);
            setData(d);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load salary slip');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!slipRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(slipRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (imgHeight <= pageHeight) {
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            } else {
                let y = 0;
                while (y < imgHeight) {
                    if (y > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
                    y += pageHeight;
                }
            }

            const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            pdf.save(`Salary_Slip_${MONTHS[(month || 1) - 1]}_${year}.pdf`);
        } catch (e) {
            alert('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    if (!data && !loading) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex flex-col gap-3 bg-gradient-to-br from-indigo-900/40 to-purple-900/30 border border-purple-500/30 rounded-2xl p-4 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <IndianRupee size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Salary Slip Ready</p>
                        <p className="text-white/40 text-xs">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(month || 1) - 1]} {year}
                        </p>
                    </div>
                </div>
                <button onClick={fetchSlip}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-500 transition">
                    <Download size={14} /> View & Download
                </button>
                {error && <p className="text-red-400 text-xs">{error}</p>}
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <motion.div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                <span className="text-white/50 text-sm">Loading salary slip...</span>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Download button */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                    <IndianRupee size={18} className="text-purple-400" />
                    <div>
                        <p className="text-white text-sm font-semibold">Salary Slip — {data.period.monthName} {data.period.year}</p>
                        <p className="text-white/40 text-xs">Net Pay: {fmt(data.summary.netPay)}</p>
                    </div>
                </div>
                <button onClick={downloadPDF} disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-500 disabled:opacity-50 transition">
                    <Download size={14} /> {downloading ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* The actual slip (hidden for PDF capture, shown as preview) */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl">
                <div ref={slipRef} className="bg-white">
                    <SlipContent data={data} />
                </div>
            </div>
        </motion.div>
    );
};

export { SalarySlipWidget, SlipContent };
export default SalarySlipWidget;
