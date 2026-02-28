import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Shield, Plus, X, TrendingUp, AlertTriangle } from "lucide-react";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES = ["INCIDENT", "SERVICE_REQUEST"];

const priorityColors = {
    LOW: "text-green-400 bg-green-500/10",
    MEDIUM: "text-yellow-400 bg-yellow-500/10",
    HIGH: "text-orange-400 bg-orange-500/10",
    CRITICAL: "text-red-400 bg-red-500/10",
};

export default function SLADashboard() {
    const { api } = useAuth();
    const [policies, setPolicies] = useState([]);
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editPolicy, setEditPolicy] = useState(null);
    const [days, setDays] = useState(30);

    const [form, setForm] = useState({
        name: "", priority: "MEDIUM", ticketType: "INCIDENT",
        responseTimeMinutes: 60, resolutionTimeMinutes: 480,
    });

    async function fetch() {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                api.get("/servicedesk/sla"),
                api.get(`/servicedesk/sla/compliance?days=${days}`),
            ]);
            setPolicies(pRes.data.data || []);
            setCompliance(cRes.data.data);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { fetch(); }, [days]);

    async function save(e) {
        e.preventDefault();
        try {
            if (editPolicy) {
                await api.put(`/servicedesk/sla/${editPolicy.id}`, form);
            } else {
                await api.post("/servicedesk/sla", form);
            }
            setShowForm(false); setEditPolicy(null);
            setForm({ name: "", priority: "MEDIUM", ticketType: "INCIDENT", responseTimeMinutes: 60, resolutionTimeMinutes: 480 });
            fetch();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function deletePolicy(id) {
        if (!confirm("Delete this SLA policy?")) return;
        await api.delete(`/servicedesk/sla/${id}`);
        fetch();
    }

    function startEdit(p) {
        setEditPolicy(p);
        setForm({ name: p.name, priority: p.priority, ticketType: p.ticketType, responseTimeMinutes: p.responseTimeMinutes, resolutionTimeMinutes: p.resolutionTimeMinutes });
        setShowForm(true);
    }

    const fmtTime = (min) => min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min}m`;

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="text-blue-400" size={32} /> SLA Management
                </h2>
                <button onClick={() => { setEditPolicy(null); setShowForm(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition">
                    <Plus size={18} /> New SLA Policy
                </button>
            </div>

            {/* Compliance Cards */}
            {compliance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Tickets", val: compliance.total, color: "text-white" },
                        { label: "SLA Breached", val: compliance.breached, color: "text-red-400" },
                        { label: "Within SLA", val: compliance.total - compliance.breached, color: "text-green-400" },
                        { label: "Compliance Rate", val: `${compliance.complianceRate}%`, color: compliance.complianceRate >= 90 ? "text-green-400" : compliance.complianceRate >= 75 ? "text-yellow-400" : "text-red-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                            <p className="text-white/40 text-xs mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Time range filter */}
            <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">Show last</span>
                {[7, 30, 90].map(d => (
                    <button key={d} onClick={() => setDays(d)}
                        className={`text-sm px-4 py-1.5 rounded-xl transition ${days === d ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                        {d} days
                    </button>
                ))}
            </div>

            {/* SLA Policies Table */}
            <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-400" /> Policies ({policies.length})
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                {["Policy Name", "Ticket Type", "Priority", "Response", "Resolution", "Active", "Actions"].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-center text-white/30">Loading…</td></tr>
                            ) : policies.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-white/30">No SLA policies defined yet</td></tr>
                            ) : policies.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition">
                                    <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.ticketType === 'INCIDENT' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {p.ticketType.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[p.priority]}`}>{p.priority}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white/70 font-mono">{fmtTime(p.responseTimeMinutes)}</td>
                                    <td className="px-4 py-3 text-white/70 font-mono">{fmtTime(p.resolutionTimeMinutes)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`w-2 h-2 rounded-full inline-block ${p.isActive ? 'bg-green-400' : 'bg-white/20'}`}></span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(p)} className="text-xs text-white/40 hover:text-white transition">Edit</button>
                                            <button onClick={() => deletePolicy(p.id)} className="text-xs text-red-400/60 hover:text-red-400 transition">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">{editPolicy ? "Edit" : "New"} SLA Policy</h3>
                            <button onClick={() => { setShowForm(false); setEditPolicy(null); }} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-3">
                            <input required placeholder="Policy Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={form.ticketType} onChange={e => setForm(f => ({ ...f, ticketType: e.target.value }))}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                    {TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                                </select>
                                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-white/40 text-xs mb-1 block">Response Time (minutes)</label>
                                    <input type="number" min={1} required value={form.responseTimeMinutes}
                                        onChange={e => setForm(f => ({ ...f, responseTimeMinutes: Number(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-white/40 text-xs mb-1 block">Resolution Time (minutes)</label>
                                    <input type="number" min={1} required value={form.resolutionTimeMinutes}
                                        onChange={e => setForm(f => ({ ...f, resolutionTimeMinutes: Number(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                                </div>
                            </div>
                            <p className="text-white/30 text-xs">
                                Response: {fmtTime(form.responseTimeMinutes)} | Resolution: {fmtTime(form.resolutionTimeMinutes)}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => { setShowForm(false); setEditPolicy(null); }}
                                    className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition">
                                    {editPolicy ? "Save Changes" : "Create Policy"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
