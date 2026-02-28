import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCcw, TrendingUp, Database, BookOpen, Activity } from "lucide-react";

const priorityColors = {
    LOW: "bg-green-500/20 text-green-300",
    MEDIUM: "bg-yellow-500/20 text-yellow-300",
    HIGH: "bg-orange-500/20 text-orange-300",
    CRITICAL: "bg-red-500/20 text-red-300",
};

const statusColors = {
    OPEN: "bg-blue-500/20 text-blue-300",
    IN_PROGRESS: "bg-purple-500/20 text-purple-300",
    ON_HOLD: "bg-yellow-500/20 text-yellow-300",
    WAITING_FOR_USER: "bg-orange-500/20 text-orange-300",
    PENDING_VENDOR: "bg-amber-500/20 text-amber-300",
    PENDING_OTHER: "bg-gray-500/20 text-gray-300",
    RESOLVED: "bg-green-500/20 text-green-300",
    CLOSED: "bg-white/10 text-white/40",
};

export default function ServiceDeskDashboard() {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    async function fetchStats() {
        setLoading(true);
        try {
            const r = await api.get("/servicedesk/tickets/stats");
            setStats(r.data.data);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { fetchStats(); }, []);

    const KPIs = stats ? [
        { label: "Open Incidents", val: stats.openIncidents, color: "text-blue-400", bg: "from-blue-900/30 to-blue-800/10", icon: AlertCircle, path: "/servicedesk/incidents" },
        { label: "SLA Breaches", val: stats.slaBreached, color: "text-red-400", bg: "from-red-900/30 to-red-800/10", icon: Activity, path: "/servicedesk/incidents?status=sla_breached" },
        { label: "Open Changes", val: stats.openChanges, color: "text-yellow-400", bg: "from-yellow-900/20 to-yellow-800/5", icon: RefreshCcw, path: "/servicedesk/changes" },
        { label: "Open Problems", val: stats.openProblems, color: "text-orange-400", bg: "from-orange-900/20 to-orange-800/5", icon: TrendingUp, path: "/servicedesk/problems" },
        { label: "Active CIs", val: stats.totalCIs, color: "text-teal-400", bg: "from-teal-900/20 to-teal-800/5", icon: Database, path: "/servicedesk/cmdb" },
        { label: "KEDB Articles", val: stats.totalKedb, color: "text-purple-400", bg: "from-purple-900/20 to-purple-800/5", icon: BookOpen, path: "/servicedesk/kedb" },
    ] : [];

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">📊 Service Desk Overview</h2>
                    <p className="text-white/40 mt-1">Operations Dashboard</p>
                </div>
                <button onClick={fetchStats} className="p-2.5 hover:bg-white/10 rounded-xl text-white/40 transition">
                    <RefreshCcw size={18} />
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {loading ? (
                    [...Array(6)].map((_, i) => <div key={i} className="h-28 animate-pulse bg-white/5 rounded-2xl" />)
                ) : KPIs.map(({ label, val, color, bg, icon: Icon, path }) => (
                    <motion.div key={label} whileHover={{ scale: 1.04 }}
                        onClick={() => navigate(path)}
                        className={`bg-gradient-to-br ${bg} border border-white/10 rounded-2xl p-4 cursor-pointer text-center transition-all hover:border-white/20`}>
                        <Icon className={`${color} mx-auto mb-2`} size={22} />
                        <p className={`text-3xl font-bold ${color}`}>{val}</p>
                        <p className="text-white/40 text-xs mt-1 leading-tight">{label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* By Status */}
                {stats?.byStatus && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-purple-400" /> Tickets by Status
                        </h3>
                        <div className="space-y-2">
                            {stats.byStatus.map(s => (
                                <div key={s.status} className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s.status] || "bg-white/10 text-white/50"} min-w-[120px] text-center`}>
                                        {s.status?.replace(/_/g, " ")}
                                    </span>
                                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-purple-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (s._count / Math.max(...stats.byStatus.map(x => x._count))) * 100)}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                    <span className="text-white/40 text-xs w-6 text-right">{s._count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* By Priority — Open only */}
                {stats?.byPriority && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-orange-400" /> Open Tickets by Priority
                        </h3>
                        <div className="space-y-2">
                            {stats.byPriority.map(s => (
                                <div key={s.priority} className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[s.priority] || "bg-white/10 text-white/50"} min-w-[80px] text-center`}>
                                        {s.priority}
                                    </span>
                                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${s.priority === 'CRITICAL' ? 'bg-red-500' : s.priority === 'HIGH' ? 'bg-orange-500' : s.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (s._count / Math.max(...stats.byPriority.map(x => x._count))) * 100)}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                    <span className="text-white/40 text-xs w-6 text-right">{s._count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Tickets */}
            {stats?.recentTickets?.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-blue-400" /> Recent Tickets
                    </h3>
                    <div className="space-y-2">
                        {stats.recentTickets.map(t => (
                            <div key={t.id}
                                onClick={() => navigate("/servicedesk/incidents")}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-mono text-white/30">{t.ticketNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[t.priority]}`}>{t.priority}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status?.replace(/_/g, " ")}</span>
                                    </div>
                                    <p className="text-white text-sm truncate">{t.title}</p>
                                </div>
                                <div className="text-right shrink-0 text-xs text-white/30">
                                    {t.requester && <p>{t.requester.name}</p>}
                                    <p>{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
