import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle, Search, Filter, RefreshCw, Clock, Hourglass, User,
    CheckCircle, ChevronDown, X, MessageSquare, Activity,
    Link, Tag, Paperclip
} from "lucide-react";

const STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "WAITING_FOR_USER", "PENDING_VENDOR", "PENDING_OTHER", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const priorityColors = {
    LOW: "bg-green-500/20 text-green-300 border-green-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    CRITICAL: "bg-red-500/20 text-red-300 border-red-500/30",
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

function SLATimer({ due, breached }) {
    const [remaining, setRemaining] = useState("");
    useEffect(() => {
        if (!due) return;
        const update = () => {
            const diff = new Date(due) - new Date();
            if (diff <= 0) { setRemaining("BREACHED"); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setRemaining(`${h}h ${m}m`);
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [due]);

    if (!due) return null;
    const color = breached || remaining === "BREACHED" ? "text-red-400" : remaining.startsWith("0h") ? "text-orange-400" : "text-green-400";
    return <span className={`text-xs font-mono flex items-center gap-1 ${color}`}><Hourglass size={10} />{remaining}</span>;
}

export default function IncidentManagement() {
    const { api, user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [tab, setTab] = useState("OPEN");
    const [search, setSearch] = useState("");
    const [filterPri, setFilterPri] = useState("");

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: "INCIDENT", limit: 50 });
            if (tab !== "ALL") params.set("status", tab);
            if (filterPri) params.set("priority", filterPri);
            if (search) params.set("search", search);
            const r = await api.get(`/servicedesk/tickets?${params}`);
            setTickets(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }, [api, tab, filterPri, search]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    useEffect(() => {
        api.get("/employees?limit=200").then(r => setAgents(r.data.users || r.data || [])).catch(() => { });
        api.get("/servicedesk/admin/categories?ticketType=INCIDENT").then(r => setCategories(r.data.data || [])).catch(() => { });
        api.get("/servicedesk/admin/teams").then(r => setTeams(r.data.data || [])).catch(() => { });
    }, [api]);

    async function openTicket(ticket) {
        const r = await api.get(`/servicedesk/tickets/${ticket.id}`);
        setSelected(r.data.data);
    }

    async function updateTicket(id, payload) {
        await api.put(`/servicedesk/tickets/${id}`, payload);
        fetchTickets();
        if (selected?.id === id) {
            const r = await api.get(`/servicedesk/tickets/${id}`);
            setSelected(r.data.data);
        }
    }

    const TAB_OPTIONS = ["OPEN", "IN_PROGRESS", "ON_HOLD", "PENDING_VENDOR", "PENDING_OTHER", "WAITING_FOR_USER", "RESOLVED", "CLOSED", "ALL"];

    return (
        <motion.div className="flex h-[calc(100vh-5rem)] gap-4 overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* LEFT PANEL */}
            <div className="flex flex-col w-full max-w-none flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertCircle className="text-red-400" size={26} /> Incident Management
                    </h2>
                    <button onClick={fetchTickets} className="p-2 hover:bg-white/10 rounded-xl text-white/40 transition">
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap gap-2 mb-3 shrink-0">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Search tickets…"
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                        value={filterPri} onChange={e => setFilterPri(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* Status tabs */}
                <div className="flex gap-1 mb-3 overflow-x-auto pb-1 shrink-0">
                    {TAB_OPTIONS.map(s => (
                        <button key={s}
                            onClick={() => setTab(s)}
                            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${tab === s ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                                }`}>
                            {s.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>

                {/* Ticket list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        [...Array(5)].map((_, i) => <div key={i} className="h-20 animate-pulse bg-white/5 rounded-xl" />)
                    ) : tickets.length === 0 ? (
                        <div className="text-center text-white/30 py-16">
                            <CheckCircle size={40} className="mx-auto mb-2 opacity-30" />
                            <p>No incidents found</p>
                        </div>
                    ) : tickets.map(t => (
                        <motion.div key={t.id}
                            whileHover={{ scale: 1.002 }}
                            onClick={() => openTicket(t)}
                            className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${selected?.id === t.id ? "border-purple-500/60 bg-purple-500/5" : "border-white/10 hover:border-purple-500/30"
                                }`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-xs font-mono text-white/30">{t.ticketNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[t.priority]}`}>{t.priority}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status.replace(/_/g, " ")}</span>
                                    </div>
                                    <p className="text-white text-sm font-semibold truncate">{t.title}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {t.requester && <span className="text-white/30 text-xs flex items-center gap-1"><User size={10} />{t.requester.name}</span>}
                                        {t.assignee && <span className="text-blue-300 text-xs flex items-center gap-1">→ {t.assignee.name}</span>}
                                        {t.slaBreached && <span className="text-red-400 text-xs font-semibold">⚠ SLA BREACH</span>}
                                    </div>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    <SLATimer due={t.slaResolutionDue} breached={t.slaBreached} />
                                    <p className="text-white/20 text-[10px]">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                                    {t._count?.comments > 0 && (
                                        <span className="text-white/30 text-xs flex items-center gap-1 justify-end"><MessageSquare size={10} />{t._count.comments}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* RIGHT DETAIL PANEL */}
            <AnimatePresence mode="wait">
                {selected && (
                    <TicketDetailPanel
                        key={selected.id}
                        ticket={selected}
                        agents={agents}
                        teams={teams}
                        onClose={() => setSelected(null)}
                        onUpdate={updateTicket}
                        api={api}
                        userId={user?.id}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function TicketDetailPanel({ ticket, agents, teams, onClose, onUpdate, api, userId }) {
    const [comment, setComment] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const [resolution, setResolution] = useState(ticket.resolution || "");

    async function postComment() {
        if (!comment.trim()) return;
        setSending(true);
        try {
            await api.post(`/servicedesk/tickets/${ticket.id}/comments`, { body: comment, isInternal });
            setComment("");
            onUpdate(ticket.id, {});
        } finally { setSending(false); }
    }

    const handleStatusChange = (s) => onUpdate(ticket.id, { status: s });
    const handleAssign = (id) => onUpdate(ticket.id, { assigneeId: id });
    const handlePriority = (p) => onUpdate(ticket.id, { priority: p });
    const handleTeam = (id) => onUpdate(ticket.id, { teamId: id });
    const handleResolve = () => onUpdate(ticket.id, { status: "RESOLVED", resolution });

    return (
        <motion.div
            initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
            className="w-[520px] shrink-0 bg-[#13132a] border border-white/10 rounded-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-start justify-between">
                <div>
                    <span className="text-xs font-mono text-white/30">{ticket.ticketNumber}</span>
                    <h3 className="text-white font-bold leading-tight">{ticket.title}</h3>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white shrink-0"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Control row */}
                <div className="grid grid-cols-2 gap-2">
                    <select value={ticket.status}
                        onChange={e => handleStatusChange(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white col-span-2">
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>

                    <select value={ticket.priority}
                        onChange={e => handlePriority(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select value={ticket.assigneeId || ""}
                        onChange={e => handleAssign(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                        <option value="">Unassigned</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <select value={ticket.teamId || ""}
                        onChange={e => handleTeam(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                        <option value="">No Team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* SLA */}
                {ticket.slaResolutionDue && (
                    <div className={`rounded-xl p-3 text-xs font-mono ${ticket.slaBreached ? "bg-red-500/10 border border-red-500/30 text-red-400" : ["RESOLVED", "CLOSED"].includes(ticket.status) && !ticket.slaBreached ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"}`}>
                        <Hourglass size={12} className="inline mr-1" />
                        Resolution SLA: {new Date(ticket.slaResolutionDue).toLocaleString("en-IN")}
                        {ticket.slaBreached ? " — ⚠ BREACHED" : ["RESOLVED", "CLOSED"].includes(ticket.status) ? " — ✓ ACCOMPLISHED" : ""}
                    </div>
                )}

                {/* Description */}
                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 whitespace-pre-wrap">{ticket.description}</div>

                {/* Attachments */}
                {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-white/30 text-xs uppercase tracking-wider">Attachments</p>
                        <div className="flex flex-wrap gap-2">
                            {ticket.attachmentUrls.map((url, i) => (
                                <a key={i} href={import.meta.env.VITE_API_URL?.replace('/api', '') + url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-blue-300 transition">
                                    <Paperclip size={12} />
                                    Attachment {i + 1}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* CI/Problem/Change links */}
                {(ticket.ci || ticket.problem || ticket.changeRequest) && (
                    <div className="space-y-1 text-xs">
                        {ticket.ci && <div className="bg-white/5 rounded-lg px-3 py-2 text-white/50"><Link size={10} className="inline mr-1" />CI: {ticket.ci.name} ({ticket.ci.ciNumber})</div>}
                        {ticket.problem && <div className="bg-orange-500/10 rounded-lg px-3 py-2 text-orange-300"><Link size={10} className="inline mr-1" />Problem: {ticket.problem.problemNumber} – {ticket.problem.title}</div>}
                        {ticket.changeRequest && <div className="bg-blue-500/10 rounded-lg px-3 py-2 text-blue-300"><Link size={10} className="inline mr-1" />Change: {ticket.changeRequest.changeNumber} – {ticket.changeRequest.title}</div>}
                    </div>
                )}

                {/* Resolution box */}
                {["IN_PROGRESS", "ON_HOLD", "WAITING_FOR_USER", "PENDING_VENDOR", "PENDING_OTHER"].includes(ticket.status) && (
                    <div className="space-y-2">
                        <textarea rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none"
                            placeholder="Resolution notes (optional before resolving)…"
                            value={resolution} onChange={e => setResolution(e.target.value)}
                        />
                        <button onClick={handleResolve}
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-xl font-semibold transition">
                            ✔ Mark as Resolved
                        </button>
                    </div>
                )}

                {/* Timeline */}
                <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Activity</p>
                    <div className="space-y-2">
                        {ticket.activities?.map(a => (
                            <div key={a.id} className="text-xs text-white/40 flex gap-2">
                                <Activity size={10} className="shrink-0 mt-0.5 text-purple-400" />
                                <span>{a.action.replace(/_/g, " ")} {a.oldValue && `(${a.oldValue} → ${a.newValue})`}</span>
                                <span className="ml-auto">{new Date(a.createdAt).toLocaleTimeString("en-IN")}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments */}
                <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Comments ({ticket.comments?.length || 0})</p>
                    <div className="space-y-2">
                        {ticket.comments?.map(c => (
                            <div key={c.id} className={`p-3 rounded-xl text-xs ${c.isInternal ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white/50 font-semibold">{c.authorId.slice(0, 8)}…</span>
                                    {c.isInternal && <span className="text-amber-400 text-[10px] bg-amber-500/20 px-1.5 rounded">Internal</span>}
                                    <span className="text-white/20">{new Date(c.createdAt).toLocaleTimeString("en-IN")}</span>
                                </div>
                                <p className="text-white/70">{c.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comment input */}
            {!["CLOSED"].includes(ticket.status) && (
                <div className="p-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                                className="rounded" />
                            Internal Note
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <textarea rows={2}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder={isInternal ? "Internal note (agents only)…" : "Reply to requester…"}
                            value={comment} onChange={e => setComment(e.target.value)}
                        />
                        <button onClick={postComment} disabled={sending || !comment.trim()}
                            className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40">
                            {sending ? "…" : "Send"}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
