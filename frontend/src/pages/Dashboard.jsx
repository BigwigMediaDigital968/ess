import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Calendar, Clock, Briefcase, CheckCircle, XCircle, Users, TrendingUp, Wifi, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Mini bar chart for hourly trend ─────────────────────────────────────────
const HourlyBar = ({ data }) => {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <motion.div
                        className="w-full bg-purple-500/70 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((d.count / max) * 56, d.count > 0 ? 4 : 0)}px` }}
                        transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }}
                    />
                    <span className="text-[8px] text-white/30 hidden group-hover:block absolute -bottom-4 whitespace-nowrap">{d.hour}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const AnimCount = ({ value, color = "text-white" }) => (
    <motion.span
        key={value}
        className={`text-3xl font-bold ${color}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
    >
        {value}
    </motion.span>
);

// ─── Sign-In Widget (HR / Manager / Owner) ────────────────────────────────────
const SignInWidget = ({ api }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/sign-in-stats')
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [api]);

    if (loading) return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse h-48" />
    );
    if (!data) return null;

    const pct = data.attendanceRate;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-5 space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Users size={18} className="text-purple-400" /> Today's Attendance
                </h3>
                <span className="text-xs text-white/40">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>

            {/* Big stat row */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Signed In", value: data.signedIn, color: "text-green-400", bg: "bg-green-500/10" },
                    { label: "Checked Out", value: data.checkedOut, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "WFH", value: data.wfh, color: "text-teal-400", bg: "bg-teal-500/10" },
                    { label: "Absent", value: data.absent, color: "text-red-400", bg: "bg-red-500/10" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                        <AnimCount value={value} color={color} />
                        <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wide">{label}</p>
                    </div>
                ))}
            </div>

            {/* Attendance rate ring */}
            <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle
                            cx="32" cy="32" r="26" fill="none"
                            stroke={pct >= 80 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444"}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 26}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{pct}%</span>
                </div>
                <div className="flex-1">
                    <p className="text-white/60 text-xs mb-1">Hourly Sign-In Trend</p>
                    <HourlyBar data={data.hourlyTrend} />
                    <div className="flex justify-between text-[9px] text-white/20 mt-1">
                        <span>8am</span><span>1pm</span><span>7pm</span>
                    </div>
                </div>
            </div>

            {/* Recent sign-ins */}
            {data.recent?.length > 0 && (
                <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Recent Sign-Ins</p>
                    <div className="space-y-1.5">
                        {data.recent.map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                                        {r.name?.[0]}
                                    </div>
                                    <span className="text-white/80">{r.name}</span>
                                    <span className="text-white/30 text-xs">{r.dept}</span>
                                </div>
                                <span className="text-white/50 text-xs">{r.time}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const Dashboard = () => {
    const { user, api } = useAuth();
    const [stats, setStats] = useState({ attendance: "Not Checked In", leaveBalance: 0, workingDays: 0 });
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [pendingWFH, setPendingWFH] = useState([]);
    const [loading, setLoading] = useState(true);

    const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR', 'MANAGER'].includes(user?.LegacyRole) ||
        user?.isOwner ||
        ['ADMINISTRATOR', 'LEADERSHIP', 'EXECUTIVE'].includes(user?.role?.type);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, leavesRes, wfhRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/leaves/pending'),
                    api.get('/wfh/pending')
                ]);
                setStats(statsRes.data);
                setPendingLeaves(leavesRes.data);
                setPendingWFH(wfhRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user, api]);

    const handleLeaveAction = async (id, status) => {
        try {
            await api.put(`/leaves/${id}`, { status });
            setPendingLeaves(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error("Failed to update leave status", error);
        }
    };

    const handleWFHAction = async (id, status) => {
        try {
            await api.put(`/wfh/${id}`, { status });
            setPendingWFH(prev => prev.filter(w => w.id !== id));
        } catch (error) {
            console.error("Failed to update WFH status", error);
        }
    };

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div>
                <h2 className="text-3xl font-bold text-white">Hello, {user?.name?.split(' ')[0]} 👋</h2>
                <p className="text-gray-400">Here's what's happening today.</p>
            </div>

            {/* Personal stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Attendance", value: stats.attendance, icon: Clock, color: "blue" },
                    { label: "Leave Balance", value: `${stats.leaveBalance} Days`, icon: Calendar, color: "purple" },
                    { label: "Working Days (Month)", value: `${stats.workingDays} Days`, icon: Briefcase, color: "pink" },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className={`flex items-center gap-4 bg-gradient-to-br from-${color}-500/20 to-${color}-600/5`}>
                            <div className={`p-3 bg-${color}-500/20 rounded-xl text-${color}-300`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">{label}</p>
                                <h3 className="text-2xl font-bold text-white">{value}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Sign-In Widget for privileged roles */}
            {isPrivileged && <SignInWidget api={api} />}

            {/* Approvals Section */}
            <AnimatePresence>
                {(pendingLeaves.length > 0 || pendingWFH.length > 0) && (
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingLeaves.length > 0 && (
                                <Card>
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Calendar className="text-yellow-400" size={20} /> Leave Requests
                                    </h4>
                                    <div className="space-y-3">
                                        {pendingLeaves.map(leave => (
                                            <div key={leave.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white">{leave.user.name}</p>
                                                    <p className="text-xs text-gray-400">{leave.type} • {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400 mt-1 italic">"{leave.reason}"</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleLeaveAction(leave.id, 'APPROVED')} className="p-2 hover:bg-green-500/20 text-green-400 rounded-full transition"><CheckCircle size={20} /></button>
                                                    <button onClick={() => handleLeaveAction(leave.id, 'REJECTED')} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition"><XCircle size={20} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                            {pendingWFH.length > 0 && (
                                <Card>
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Briefcase className="text-blue-400" size={20} /> WFH Requests
                                    </h4>
                                    <div className="space-y-3">
                                        {pendingWFH.map(wfh => (
                                            <div key={wfh.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white">{wfh.user.name}</p>
                                                    <p className="text-xs text-gray-400">{wfh.address}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleWFHAction(wfh.id, 'APPROVED')} className="p-2 hover:bg-green-500/20 text-green-400 rounded-full transition"><CheckCircle size={20} /></button>
                                                    <button onClick={() => handleWFHAction(wfh.id, 'REJECTED')} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition"><XCircle size={20} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Dashboard;
