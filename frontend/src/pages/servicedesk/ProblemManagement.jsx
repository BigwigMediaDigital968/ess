import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Link, Paperclip, Activity, FileText } from "lucide-react";

const STATUSES = ["OPEN", "UNDER_INVESTIGATION", "ROOT_CAUSE_IDENTIFIED", "KNOWN_ERROR", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statusColors = {
    OPEN: "bg-red-500/20 text-red-300 border-red-500/30",
    UNDER_INVESTIGATION: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    ROOT_CAUSE_IDENTIFIED: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    KNOWN_ERROR: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    CLOSED: "bg-white/10 text-white/40 border-white/20",
};

const priorityColors = {
    LOW: "bg-green-500/20 text-green-300 border-green-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    CRITICAL: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function ProblemManagement() {
    const { api, user } = useAuth();
    const [problems, setProblems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showKEDB, setShowKEDB] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [allTickets, setAllTickets] = useState([]);

    const [categories, setCategories] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);

    const [pForm, setPForm] = useState({
        title: "", description: "", impact: "LOW", urgency: "LOW", priority: "LOW",
        categoryId: "", subcategoryId: "", assignmentGroupId: "", assigneeId: "", attachments: [], linkedIncidentIds: []
    });
    const [kForm, setKForm] = useState({ title: "", symptoms: "", rootCause: "", workaround: "", resolution: "" });

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterStatus ? `?status=${filterStatus}` : "";
            const r = await api.get(`/servicedesk/problems${params}`);
            setProblems(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }, [api, filterStatus]);

    useEffect(() => { fetchProblems(); }, [fetchProblems]);

    useEffect(() => {
        api.get("/servicedesk/tickets?type=INCIDENT&limit=100").then(r => {
            const all = r.data.data || [];
            setAllTickets(all.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'));
        }).catch(() => { });
        api.get("/servicedesk/admin/categories?ticketType=PROBLEM").then(r => setCategories(r.data.data || [])).catch(() => { });
        api.get("/servicedesk/admin/teams").then(r => setTeams(r.data.data || [])).catch(() => { });
        api.get("/employees?limit=200").then(r => setUsers(r.data.users || r.data || [])).catch(() => { });
    }, [api]);

    async function openProblem(p) {
        const r = await api.get(`/servicedesk/problems/${p.id}`);
        setSelected(r.data.data);
    }

    async function createProblem(e) {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.entries(pForm).forEach(([key, val]) => {
                if (key === 'attachments') {
                    for (let i = 0; i < val.length; i++) formData.append('attachments', val[i]);
                } else if (key === 'linkedIncidentIds') {
                    formData.append('linkedIncidentIds', JSON.stringify(val));
                } else if (val) {
                    formData.append(key, val);
                }
            });

            await api.post("/servicedesk/problems", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowForm(false);
            setPForm({ title: "", description: "", impact: "LOW", urgency: "LOW", priority: "LOW", categoryId: "", subcategoryId: "", assignmentGroupId: "", assigneeId: "", attachments: [], linkedIncidentIds: [] });
            fetchProblems();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function updateProblem(field, value) {
        if (field === "attachments") {
            const formData = new FormData();
            for (let i = 0; i < value.length; i++) formData.append('attachments', value[i]);
            await api.put(`/servicedesk/problems/${selected.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
            if (value === selected[field]) return;
            await api.put(`/servicedesk/problems/${selected.id}`, { [field]: value });
        }

        fetchProblems();
        const r = await api.get(`/servicedesk/problems/${selected.id}`);
        setSelected(r.data.data);
    }

    async function linkIncident(ticketId) {
        try {
            await api.post(`/servicedesk/problems/${selected.id}/link-incident`, { ticketId });
            const r = await api.get(`/servicedesk/problems/${selected.id}`);
            setSelected(r.data.data);
            fetchProblems();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function convertToKE(e) {
        e.preventDefault();
        try {
            await api.post(`/servicedesk/problems/${selected.id}/convert-to-known-error`, kForm);
            setShowKEDB(false);
            setKForm({ title: "", symptoms: "", rootCause: "", workaround: "", resolution: "" });
            const r = await api.get(`/servicedesk/problems/${selected.id}`);
            setSelected(r.data.data);
            fetchProblems();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    const availableSubcategories = categories.find(c => c.id === pForm.categoryId)?.subcategories || [];
    const activeSubcategories = categories.find(c => c.id === selected?.categoryId)?.subcategories || [];
    const attachmentBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3434';

    return (
        <motion.div className="flex h-[calc(100vh-5rem)] gap-4 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* LEFT PANEL */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-white">🔍 Problem Management</h2>
                    <div className="flex gap-2">
                        <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-orange-500/20">
                            <Plus size={15} /> New Problem
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse bg-white/5 rounded-xl" />) :
                        problems.length === 0 ? <div className="text-center text-white/30 py-16">No problems found</div> :
                            problems.map(p => (
                                <motion.div key={p.id} whileHover={{ scale: 1.002 }}
                                    onClick={() => openProblem(p)}
                                    className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${selected?.id === p.id ? "border-orange-500/50 bg-orange-500/5" : "border-white/10 hover:border-orange-500/30"
                                        }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-xs font-mono text-white/40">{p.problemNumber}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${priorityColors[p.priority]}`}>{p.priority} PRIORITY</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusColors[p.status]}`}>{p.status.replace(/_/g, " ")}</span>
                                            </div>
                                            <p className="text-white text-sm font-semibold truncate">{p.title}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                {p.category && <span className="text-white/30 text-[10px]">{p.category.name}</span>}
                                                {p.assignee && <span className="text-blue-300 text-[10px]">Assigned: {p.assignee.name}</span>}
                                                {p._count?.linkedIncidents > 0 && <span className="text-white/30 text-[10px]">🔗 {p._count.linkedIncidents} Incidents</span>}
                                            </div>
                                        </div>
                                        {p.kedbEntry && <span className="text-purple-300 text-[10px] bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded">KEDB</span>}
                                    </div>
                                </motion.div>
                            ))}
                </div>
            </div>

            {/* RIGHT DETAIL PANEL */}
            <AnimatePresence mode="wait">
                {selected && (
                    <motion.div key={selected.id}
                        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
                        className="w-[600px] shrink-0 bg-[#13132a] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">

                        <div className="p-4 border-b border-white/10 flex items-start justify-between bg-white/5">
                            <div>
                                <span className="text-xs font-mono text-white/40 mb-1 block">{selected.problemNumber}</span>
                                <h3 className="text-white font-bold leading-tight mb-2 pr-4">{selected.title}</h3>
                                <div className="flex gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${statusColors[selected.status]}`}>{selected.status.replace(/_/g, " ")}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">

                            {/* ITSM Classifications Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Status</label>
                                    <select value={selected.status} onChange={e => updateProblem("status", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Priority</label>
                                    <select value={selected.priority} onChange={e => updateProblem("priority", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                        {PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Category</label>
                                    <select value={selected.categoryId || ""} onChange={e => updateProblem("categoryId", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Subcategory</label>
                                    <select value={selected.subcategoryId || ""} onChange={e => updateProblem("subcategoryId", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" disabled={!selected.categoryId}>
                                        <option value="">Select Subcategory...</option>
                                        {activeSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Assignment Group</label>
                                    <select value={selected.assignmentGroupId || ""} onChange={e => updateProblem("assignmentGroupId", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                        <option value="">Select Group...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">Assignee</label>
                                    <select value={selected.assigneeId || ""} onChange={e => updateProblem("assigneeId", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                                        <option value="">Select User...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Description</h4>
                                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/80 whitespace-pre-wrap">{selected.description}</div>
                            </div>

                            {/* Root Cause & Workaround */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Root Cause Analysis</h4>
                                    <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-orange-500/50"
                                        defaultValue={selected.rootCause || ""}
                                        onBlur={e => { updateProblem("rootCause", e.target.value); }}
                                        placeholder="Document the technical root cause here once identified…" />
                                </div>
                                <div>
                                    <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Temporary Workaround</h4>
                                    <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-orange-500/50"
                                        defaultValue={selected.workaround || ""}
                                        onBlur={e => { updateProblem("workaround", e.target.value); }}
                                        placeholder="Document steps to temporarily restore service…" />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div>
                                <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-white/10 pb-1 flex items-center justify-between">
                                    Attachments
                                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[10px] text-white/70 transition flex items-center gap-1">
                                        <Plus size={10} /> Add Files
                                        <input type="file" multiple className="hidden" onChange={e => {
                                            if (e.target.files.length > 0) updateProblem("attachments", Array.from(e.target.files));
                                        }} />
                                    </label>
                                </h4>
                                {selected.attachmentUrls?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selected.attachmentUrls.map((url, i) => {
                                            const parts = url.split('/');
                                            const name = parts[parts.length - 1];
                                            return (
                                                <a key={i} href={`${attachmentBaseUrl}${url}`} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-blue-300 transition">
                                                    <FileText size={12} /> {name}
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-white/30 text-xs italic">No attached files.</p>}
                            </div>

                            {/* Linked Incidents */}
                            <div>
                                <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Linked Incidents ({selected.linkedIncidents?.length || 0})</h4>
                                <div className="space-y-1 mb-2">
                                    {selected.linkedIncidents?.map(t => (
                                        <div key={t.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/80 border border-white/5 flex items-center gap-2">
                                            <span className="text-blue-300 font-mono">{t.ticketNumber}</span> <span className="text-white/30">•</span> {t.title}
                                        </div>
                                    ))}
                                </div>
                                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                                    onChange={e => { if (e.target.value) { linkIncident(e.target.value); e.target.value = ""; } }}>
                                    <option value="">+ Link another open incident…</option>
                                    {allTickets.filter(t => !selected.linkedIncidents?.find(l => l.id === t.id)).map(t => (
                                        <option key={t.id} value={t.id}>{t.ticketNumber} – {t.title.slice(0, 50)}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Known Error Database Link */}
                            <div className="pt-2">
                                {selected.kedbEntry ? (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center gap-3">
                                        <div className="bg-purple-500/20 p-2 rounded-lg text-purple-300"><FileText size={20} /></div>
                                        <div>
                                            <p className="text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">Known Error Article Linked</p>
                                            <p className="text-white text-sm font-semibold">{selected.kedbEntry.title}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowKEDB(true)}
                                        className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm font-semibold rounded-xl transition border border-purple-500/30">
                                        Convert to Known Error & Store in KEDB
                                    </button>
                                )}
                            </div>

                            {/* Activity Timeline */}
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Activity size={16} className="text-orange-400" /> Activity Timeline</h4>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                    {selected.activities?.map((act, i) => (
                                        <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#13132a] text-orange-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                <Activity size={14} />
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 p-3 rounded-xl">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-white text-xs">{act.actor?.name || 'System'}</span>
                                                    <time className="text-[10px] text-white/40">{new Date(act.createdAt).toLocaleString("en-IN")}</time>
                                                </div>
                                                <div className="text-xs text-white/70">
                                                    <span className="text-orange-300 font-medium">{act.action.replace(/_/g, " ")}</span>
                                                    {act.oldValue && act.newValue && act.oldValue !== 'None' ? (
                                                        <span className="ml-1 text-white/50">changed from "{act.oldValue}" to "{act.newValue}"</span>
                                                    ) : act.newValue && act.newValue !== 'None' ? (
                                                        <span className="ml-1 text-white/50">{act.newValue}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selected.activities || selected.activities.length === 0) && (
                                        <p className="text-white/30 text-xs text-center italic">No activity recorded yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE PROBLEM MODAL (Wider ITIL layout) */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2"><Plus size={18} className="text-orange-500" /> New Problem Record</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white bg-white/5 p-1.5 rounded-lg"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="problem-create-form" onSubmit={createProblem} className="space-y-6">
                                {/* Row 1: Title */}
                                <div>
                                    <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Short Description / Title *</label>
                                    <input required value={pForm.title} onChange={e => setPForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                                </div>

                                {/* Row 2: Grid for properties */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white/5 p-5 rounded-xl border border-white/5">
                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Impact</label>
                                        <select value={pForm.impact} onChange={e => setPForm(f => ({ ...f, impact: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Urgency</label>
                                        <select value={pForm.urgency} onChange={e => setPForm(f => ({ ...f, urgency: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Priority</label>
                                        <select value={pForm.priority} onChange={e => setPForm(f => ({ ...f, priority: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Category</label>
                                        <select value={pForm.categoryId} onChange={e => setPForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: "" }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Subcategory</label>
                                        <select value={pForm.subcategoryId} onChange={e => setPForm(f => ({ ...f, subcategoryId: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" disabled={!pForm.categoryId}>
                                            <option value="">None</option>
                                            {availableSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1"></div>

                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Assignment Group</label>
                                        <select value={pForm.assignmentGroupId} onChange={e => setPForm(f => ({ ...f, assignmentGroupId: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            <option value="">Unassigned Route</option>
                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Assignee</label>
                                        <select value={pForm.assigneeId} onChange={e => setPForm(f => ({ ...f, assigneeId: e.target.value }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            <option value="">Unassigned User</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Description */}
                                <div>
                                    <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Detailed Description *</label>
                                    <textarea required rows={4} value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-orange-500/50" />
                                </div>

                                {/* New Row: Linked Incidents */}
                                <div>
                                    <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Link Incidents</label>
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                                        {allTickets.map(t => (
                                            <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition">
                                                <input type="checkbox"
                                                    checked={pForm.linkedIncidentIds?.includes(t.id) || false}
                                                    onChange={e => {
                                                        const checked = e.target.checked;
                                                        setPForm(prev => ({
                                                            ...prev,
                                                            linkedIncidentIds: checked
                                                                ? [...(prev.linkedIncidentIds || []), t.id]
                                                                : (prev.linkedIncidentIds || []).filter(id => id !== t.id)
                                                        }));
                                                    }}
                                                    className="accent-orange-500 rounded bg-black border-white/10 w-4 h-4"
                                                />
                                                <span className="text-white text-xs select-none"><span className="text-blue-400 font-mono">{t.ticketNumber}</span> – {t.title.slice(0, 60)}</span>
                                            </label>
                                        ))}
                                        {allTickets.length === 0 && <p className="text-white/40 text-xs p-2 text-center italic">No open incidents available to link.</p>}
                                    </div>
                                    {pForm.linkedIncidentIds?.length > 0 && (
                                        <p className="text-orange-400 text-[10px] font-bold mt-1.5 ml-1 uppercase">{pForm.linkedIncidentIds.length} incident(s) selected.</p>
                                    )}
                                </div>

                                {/* Row 4: Attachments */}
                                <div>
                                    <label className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">Attachments</label>
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm text-white/70 transition flex items-center gap-2">
                                            <Paperclip size={16} /> Choose Files
                                            <input type="file" multiple className="hidden" onChange={e => setPForm(f => ({ ...f, attachments: Array.from(e.target.files) }))} />
                                        </label>
                                        {pForm.attachments.length > 0 && (
                                            <span className="text-orange-300 text-sm font-semibold">{pForm.attachments.length} file(s) selected</span>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-white/10 bg-black/20 flex gap-3 justify-end shrink-0">
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-semibold text-sm transition">Cancel</button>
                            <button type="submit" form="problem-create-form" className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition shadow-lg shadow-orange-500/20">Submit Problem</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* CONVERT TO KEDB */}
            {showKEDB && selected && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Create KEDB Article</h3>
                            <button onClick={() => setShowKEDB(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={convertToKE} className="space-y-3">
                            {[
                                { key: "title", label: "Title *", type: "input", req: true },
                                { key: "symptoms", label: "Symptoms *", type: "textarea", req: true },
                                { key: "rootCause", label: "Root Cause *", type: "textarea", req: true },
                                { key: "workaround", label: "Workaround *", type: "textarea", req: true },
                                { key: "resolution", label: "Resolution", type: "textarea", req: false },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-white/30 text-xs mb-1 block">{f.label}</label>
                                    {f.type === "input" ? (
                                        <input required={f.req} value={kForm[f.key]} onChange={e => setKForm(k => ({ ...k, [f.key]: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                                    ) : (
                                        <textarea required={f.req} rows={2} value={kForm[f.key]} onChange={e => setKForm(k => ({ ...k, [f.key]: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none" />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowKEDB(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition">Create & Mark Known Error</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
