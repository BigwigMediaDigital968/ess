import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
    Ticket, AlertCircle, Package, Clock, CheckCircle,
    ChevronRight, Plus, Search, X
} from "lucide-react";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES = ["INCIDENT", "SERVICE_REQUEST"];

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

export default function ServiceDeskPortal() {
    const { api, user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        title: "", description: "", type: "INCIDENT", priority: "MEDIUM", categoryId: "",
    });
    const [attachments, setAttachments] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMyTickets();
        api.get("/servicedesk/admin/categories").then(r => setCategories(r.data.data || [])).catch(() => { });
    }, []);

    async function fetchMyTickets() {
        try {
            const r = await api.get("/servicedesk/tickets/mine");
            setTickets(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }

    async function submitTicket(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("type", form.type);
            formData.append("priority", form.priority);
            if (form.categoryId) formData.append("categoryId", form.categoryId);

            attachments.forEach((file) => {
                formData.append("attachments", file);
            });

            await api.post("/servicedesk/tickets", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setForm({ title: "", description: "", type: "INCIDENT", priority: "MEDIUM", categoryId: "" });
            setAttachments([]);
            setShowForm(false);
            fetchMyTickets();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit ticket");
        } finally { setSubmitting(false); }
    }

    async function addReply(ticketId, body) {
        if (!body.trim()) return;
        await api.post(`/servicedesk/tickets/${ticketId}/comments`, { body, isInternal: false });
        // Refresh selected ticket
        const r = await api.get(`/servicedesk/tickets/${ticketId}`);
        setSelected(r.data.data);
    }

    const filtered = tickets.filter(t =>
        !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Ticket className="text-purple-400" size={32} />
                        Service Desk
                    </h2>
                    <p className="text-white/40 mt-1">Raise and track your tickets</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all"
                >
                    <Plus size={18} /> Raise Ticket
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search tickets by number or title…"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Open", count: tickets.filter(t => t.status === "OPEN").length, color: "blue" },
                    { label: "In Progress", count: tickets.filter(t => t.status === "IN_PROGRESS").length, color: "purple" },
                    { label: "Resolved", count: tickets.filter(t => t.status === "RESOLVED").length, color: "green" },
                    { label: "Total", count: tickets.length, color: "white" },
                ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className={`text-2xl font-bold text-${s.color}-400`}>{s.count}</p>
                        <p className="text-white/40 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Ticket list */}
            <div className="space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse bg-white/5 rounded-2xl" />)
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                        <Ticket size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No tickets yet. Raise your first ticket!</p>
                    </div>
                ) : filtered.map(t => (
                    <motion.div
                        key={t.id}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => {
                            api.get(`/servicedesk/tickets/${t.id}`).then(r => setSelected(r.data.data));
                        }}
                        className="bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs text-white/40 font-mono">{t.ticketNumber}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[t.priority]}`}>{t.priority}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status.replace(/_/g, " ")}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                        {t.type === "INCIDENT" ? "🔴 INC" : "🔵 SR"}
                                    </span>
                                </div>
                                <p className="text-white font-semibold truncate">{t.title}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-white/30 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                                {t.assignee && <p className="text-white/40 text-xs mt-1">👤 {t.assignee.name}</p>}
                                <ChevronRight size={16} className="text-white/20 ml-auto mt-1" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Raise Ticket Modal ── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Raise a Ticket</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={submitTicket} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-white/50 text-xs mb-1 block">Type</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                        value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                        {TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs mb-1 block">Priority</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                        value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-white/50 text-xs mb-1 block">Category</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                    value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                    <option value="">-- Select Category (optional)</option>
                                    {categories.filter(c => c.ticketType === form.type).map(c =>
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-white/50 text-xs mb-1 block">Title *</label>
                                <input required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Brief summary of the issue…"
                                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>

                            <div>
                                <label className="text-white/50 text-xs mb-1 block">Description *</label>
                                <textarea required rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Describe the issue in detail…"
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>

                            <div>
                                <label className="text-white/50 text-xs mb-1 block">Attachments</label>
                                <input type="file" multiple
                                    onChange={(e) => setAttachments(Array.from(e.target.files))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30" />
                                {attachments.length > 0 && (
                                    <p className="text-white/40 text-xs mt-2">{attachments.length} file(s) selected.</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-sm transition">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition disabled:opacity-50">
                                    {submitting ? "Submitting…" : "Submit Ticket"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* ── Ticket Detail Modal ── */}
            {selected && (
                <TicketDetailModal ticket={selected} onClose={() => setSelected(null)} onReply={addReply} />
            )}
        </motion.div>
    );
}

function TicketDetailModal({ ticket, onClose, onReply }) {
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    async function handleReply() {
        if (!replyText.trim()) return;
        setSending(true);
        try { await onReply(ticket.id, replyText); setReplyText(""); }
        finally { setSending(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-end p-4">
            <motion.div
                initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl h-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div>
                        <span className="text-xs font-mono text-white/40">{ticket.ticketNumber}</span>
                        <h3 className="text-white font-bold text-lg leading-tight">{ticket.title}</h3>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ticket.status]}`}>{ticket.status.replace(/_/g, " ")}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">{ticket.type}</span>
                        {ticket.category && <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/50">{ticket.category.name}</span>}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-white/40 text-xs mb-1">Requester</p>
                            <p className="text-white">{ticket.requester?.name}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-white/40 text-xs mb-1">Assigned To</p>
                            <p className="text-white">{ticket.assignee?.name || "—"}</p>
                        </div>
                        {ticket.slaResolutionDue && (
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/40 text-xs mb-1">Resolution Due</p>
                                <p className={ticket.slaBreached ? "text-red-400" : "text-white"}>
                                    {new Date(ticket.slaResolutionDue).toLocaleString("en-IN")}
                                    {ticket.slaBreached && " ⚠ BREACHED"}
                                </p>
                            </div>
                        )}
                        {ticket.ci && (
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/40 text-xs mb-1">Affected CI</p>
                                <p className="text-white">{ticket.ci.name} ({ticket.ci.ciNumber})</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/40 text-xs mb-2">Description</p>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                        <div>
                            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Attachments</p>
                            <div className="flex flex-wrap gap-3">
                                {ticket.attachmentUrls.map((url, i) => (
                                    <a key={i} href={`${import.meta.env.VITE_API_BASE_URL || "http://ess.bigwigmediadigital.com:3434"}${url}`} target="_blank" rel="noreferrer"
                                        className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 rounded-xl flex items-center gap-2 transition"
                                    >
                                        <Package size={16} className="text-purple-400" />
                                        <span className="text-sm font-medium text-white/80">Attachment {i + 1}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resolution */}
                    {ticket.resolution && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <p className="text-green-400 text-xs mb-2 font-semibold">✔ Resolution</p>
                            <p className="text-white/80 text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                        </div>
                    )}

                    {/* Comments */}
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Activity ({ticket.comments?.length || 0})</p>
                        <div className="space-y-3">
                            {ticket.comments?.map(c => (
                                <div key={c.id} className={`p-3 rounded-xl text-sm ${c.isInternal ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-white/70">{c.authorId}</span>
                                        {c.isInternal && <span className="text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">Internal</span>}
                                        <span className="text-white/30 text-xs ml-auto">{new Date(c.createdAt).toLocaleString("en-IN")}</span>
                                    </div>
                                    <p className="text-white/70">{c.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reply box */}
                {!["CLOSED", "RESOLVED"].includes(ticket.status) && (
                    <div className="p-4 border-t border-white/10 flex gap-3">
                        <textarea
                            rows={2}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Add a reply…"
                            value={replyText} onChange={e => setReplyText(e.target.value)}
                        />
                        <button
                            onClick={handleReply} disabled={sending || !replyText.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
