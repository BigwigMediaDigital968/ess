import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Plus, X, ChevronRight, MessageSquare, Link2, Download } from "lucide-react";

const STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "IMPLEMENTING", "IMPLEMENTED", "PIR_PENDING", "CLOSED"];
const RISKS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES = ["STANDARD", "NORMAL", "EMERGENCY"];
const LEVELS = ["LOW", "MEDIUM", "HIGH"];

const statusColors = {
    DRAFT: "bg-white/10 text-white/40",
    SUBMITTED: "bg-blue-500/20 text-blue-300",
    UNDER_REVIEW: "bg-purple-500/20 text-purple-300",
    APPROVED: "bg-green-500/20 text-green-300",
    REJECTED: "bg-red-500/20 text-red-300",
    IMPLEMENTING: "bg-yellow-500/20 text-yellow-300",
    IMPLEMENTED: "bg-teal-500/20 text-teal-300",
    PIR_PENDING: "bg-orange-500/20 text-orange-300",
    CLOSED: "bg-white/10 text-white/30",
};
const riskColors = {
    LOW: "text-green-400", MEDIUM: "text-yellow-400", HIGH: "text-orange-400", CRITICAL: "text-red-400",
};

const WORKFLOW = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "IMPLEMENTING", "IMPLEMENTED", "PIR_PENDING", "CLOSED"];

export default function ChangeManagement() {
    const { api, user } = useAuth();
    const [changes, setChanges] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    const [form, setForm] = useState({
        title: "", description: "", risk: "LOW",
        type: "NORMAL", impact: "LOW", urgency: "LOW",
        justification: "", implementationPlan: "", testPlan: "",
        plannedStart: "", plannedEnd: "", rollbackPlan: "", cabMeetingDate: "",
        assignmentGroupId: "", implementerId: "",
        cabApproverIds: [], linkedCIIds: []
    });
    const [attachments, setAttachments] = useState([]);

    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [cis, setCis] = useState([]);

    const fetchConfigMap = useCallback(async () => {
        try {
            const [depRes, usrRes, ciRes] = await Promise.all([
                api.get('/servicedesk/admin/teams'),
                api.get('/employees?limit=200'),
                api.get('/servicedesk/cmdb')
            ]);
            setDepartments(depRes.data.data || []);
            setUsers(usrRes.data.users || usrRes.data || []);
            setCis(ciRes.data.data || []);
        } catch (e) { console.error("Could not fetch CMDB/Users list.", e); }
    }, [api]);

    const fetchChanges = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterStatus ? `?status=${filterStatus}` : "";
            const r = await api.get(`/servicedesk/changes${params}`);
            setChanges(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }, [api, filterStatus]);

    useEffect(() => {
        fetchChanges();
        fetchConfigMap();
    }, [fetchChanges, fetchConfigMap]);

    async function openChange(c) {
        const r = await api.get(`/servicedesk/changes/${c.id}`);
        setSelected(r.data.data);
    }

    async function createChange(e) {
        e.preventDefault();
        try {
            const fd = new FormData();
            Object.keys(form).forEach(k => {
                if (Array.isArray(form[k])) {
                    if (form[k].length > 0) fd.append(k, JSON.stringify(form[k]));
                } else if (form[k]) {
                    fd.append(k, form[k]);
                }
            });
            attachments.forEach(f => fd.append("attachments", f));

            await api.post("/servicedesk/changes", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setShowForm(false);
            setForm({
                title: "", description: "", risk: "LOW", type: "NORMAL", impact: "LOW", urgency: "LOW",
                justification: "", implementationPlan: "", testPlan: "",
                plannedStart: "", plannedEnd: "", rollbackPlan: "", cabMeetingDate: "",
                assignmentGroupId: "", implementerId: "", cabApproverIds: [], linkedCIIds: []
            });
            setAttachments([]);
            fetchChanges();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function advanceStatus(id, status) {
        await api.put(`/servicedesk/changes/${id}`, { status });
        fetchChanges();
        if (selected?.id === id) { const r = await api.get(`/servicedesk/changes/${id}`); setSelected(r.data.data); }
    }

    const downloadChangePDF = async (id, number) => {
        setDownloadingPDF(true);
        try {
            const response = await api.get(`/servicedesk/changes/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RFC-${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert("Failed to download PDF metadata.");
        } finally {
            setDownloadingPDF(false);
        }
    };

    const nextStatus = (cur) => {
        const idx = WORKFLOW.indexOf(cur);
        return idx < WORKFLOW.length - 1 ? WORKFLOW[idx + 1] : null;
    };

    return (
        <motion.div className="flex h-[calc(100vh-5rem)] gap-4 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* LEFT */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-white">🔄 Change Management</h2>
                    <div className="flex gap-2">
                        <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                            <Plus size={15} /> New RFC
                        </button>
                    </div>
                </div>

                {/* Workflow pipeline legend */}
                <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 shrink-0">
                    {WORKFLOW.map((s, i) => (
                        <div key={s} className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
                                className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                                {s.replace(/_/g, " ")}
                            </button>
                            {i < WORKFLOW.length - 1 && <ChevronRight size={10} className="text-white/20" />}
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-white/5 rounded-xl" />)
                    ) : changes.length === 0 ? (
                        <div className="text-center text-white/30 py-16">No change requests found</div>
                    ) : changes.map(c => (
                        <motion.div key={c.id} whileHover={{ scale: 1.002 }}
                            onClick={() => openChange(c)}
                            className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${selected?.id === c.id ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-blue-500/30"
                                }`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-xs font-mono text-white/30">{c.changeNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status.replace(/_/g, " ")}</span>
                                        <span className={`text-xs font-semibold ${riskColors[c.risk]}`}>⚡ {c.risk}</span>
                                    </div>
                                    <p className="text-white text-sm font-semibold">{c.title}</p>
                                    {c.plannedStart && <p className="text-white/30 text-xs mt-1">📅 {new Date(c.plannedStart).toLocaleDateString("en-IN")} → {c.plannedEnd ? new Date(c.plannedEnd).toLocaleDateString("en-IN") : "?"}</p>}
                                </div>
                                <div className="text-right text-xs text-white/30 shrink-0">
                                    <p>{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                                    {c._count?.linkedTickets > 0 && <p className="text-blue-300 mt-1">🎫 {c._count.linkedTickets} tickets</p>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* RIGHT DETAIL */}
            <AnimatePresence mode="wait">
                {selected && (
                    <motion.div key={selected.id}
                        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
                        className="w-[500px] shrink-0 bg-[#13132a] border border-white/10 rounded-2xl flex flex-col overflow-hidden">

                        <div className="p-4 border-b border-white/10 flex items-start justify-between">
                            <div>
                                <span className="text-xs font-mono text-white/30">{selected.changeNumber}</span>
                                <h3 className="text-white font-bold">{selected.title}</h3>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selected.status]}`}>{selected.status.replace(/_/g, " ")}</span>
                                    <span className={`text-xs font-semibold ${riskColors[selected.risk]}`}>Risk: {selected.risk}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
                                {selected.status === 'IMPLEMENTED' && (
                                    <button onClick={() => downloadChangePDF(selected.id, selected.changeNumber)} disabled={downloadingPDF}
                                        className="flex items-center gap-1 text-[10px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-2 py-1 rounded transition disabled:opacity-50">
                                        <Download size={12} className={downloadingPDF ? "animate-bounce" : ""} /> {downloadingPDF ? "Generating..." : "Export PDF"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Actions container */}
                            <div className="space-y-3">
                                {/* CAB Member Voting */}
                                {selected.approvers?.some(a => a.approverId === user?.id && a.status === 'PENDING') && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col gap-3">
                                        <p className="text-sm font-semibold text-yellow-300">Your CAB Approval is required</p>
                                        <div className="flex gap-2">
                                            <button onClick={async () => {
                                                await api.post(`/servicedesk/changes/${selected.id}/approve`, { status: 'APPROVED', comments: 'Approved via Quick Action' });
                                                const r = await api.get(`/servicedesk/changes/${selected.id}`); setSelected(r.data.data);
                                            }} className="flex-1 py-2 bg-green-600/30 hover:bg-green-600/50 text-green-300 text-sm rounded-lg transition font-medium">✅ Approve</button>

                                            <button onClick={async () => {
                                                const reason = window.prompt("Rejection reason:");
                                                if (reason) {
                                                    await api.post(`/servicedesk/changes/${selected.id}/approve`, { status: 'REJECTED', comments: reason });
                                                    const r = await api.get(`/servicedesk/changes/${selected.id}`); setSelected(r.data.data);
                                                }
                                            }} className="flex-1 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-sm rounded-lg transition font-medium">❌ Reject</button>
                                        </div>
                                    </div>
                                )}

                                {/* Advance status */}
                                {nextStatus(selected.status) && (
                                    <button
                                        onClick={() => advanceStatus(selected.id, nextStatus(selected.status))}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-semibold transition">
                                        Advance → {nextStatus(selected.status).replace(/_/g, " ")}
                                    </button>
                                )}
                                {selected.status !== "REJECTED" && (
                                    <button
                                        onClick={() => advanceStatus(selected.id, "REJECTED")}
                                        className="w-full py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-sm rounded-xl transition">
                                        Reject Change
                                    </button>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { label: "Team / Implementer", val: (selected.assignmentGroup?.name || "Unassigned Group") + " | " + (selected.implementer?.name || "Unassigned Tech") },
                                    { label: "Planned Window", val: (selected.plannedStart ? new Date(selected.plannedStart).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—") + " → " + (selected.plannedEnd ? new Date(selected.plannedEnd).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—") },
                                    { label: "CAB Meeting", val: selected.cabMeetingDate ? new Date(selected.cabMeetingDate).toLocaleString("en-IN") : "—" },
                                    { label: "Created By", val: selected.requestedBy?.name || "—" },
                                ].map(d => (
                                    <div key={d.label} className="bg-white/5 rounded-xl p-3">
                                        <p className="text-white/30 mb-0.5">{d.label}</p>
                                        <p className="text-white">{d.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 whitespace-pre-wrap"><strong>Description:</strong><br />{selected.description}</div>
                            {selected.justification && (
                                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 whitespace-pre-wrap"><strong>Justification:</strong><br />{selected.justification}</div>
                            )}
                            {selected.implementationPlan && (
                                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 whitespace-pre-wrap"><strong>Implementation Plan:</strong><br />{selected.implementationPlan}</div>
                            )}
                            {selected.testPlan && (
                                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 whitespace-pre-wrap"><strong>Test Plan:</strong><br />{selected.testPlan}</div>
                            )}
                            {selected.rollbackPlan && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-sm">
                                    <p className="text-orange-300 text-xs mb-1">⬅ Rollback Plan</p>
                                    <p className="text-white/70">{selected.rollbackPlan}</p>
                                </div>
                            )}
                            {selected.pirNotes && (
                                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-sm">
                                    <p className="text-teal-300 text-xs mb-1">📋 PIR Notes</p>
                                    <p className="text-white/70">{selected.pirNotes}</p>
                                </div>
                            )}

                            {/* CAB Approvals Widget */}
                            {selected.approvers?.length > 0 && (
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
                                    <p className="text-blue-300 text-xs uppercase tracking-wider font-semibold">CAB Approvals</p>
                                    <div className="space-y-2">
                                        {selected.approvers.map(a => (
                                            <div key={a.id} className="flex justify-between items-center text-xs bg-white/5 px-3 py-2 rounded-lg">
                                                <div className="text-white/70">{a.approver.name} <span className="text-white/30 truncate block text-[10px]">{a.approver.email}</span></div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold ${a.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' : a.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/40'}`}>
                                                        {a.status}
                                                    </span>
                                                    {a.status !== 'PENDING' && <span className="text-[10px] text-white/30">{new Date(a.updatedAt).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attachments */}
                            {selected.attachmentUrls?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Attachments</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.attachmentUrls.map((url, i) => (
                                            <a key={i} href={import.meta.env.VITE_API_BASE_URL.replace('/api', '') + url} target="_blank" rel="noreferrer"
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-blue-300 hover:bg-white/10 transition flex items-center gap-2">
                                                <Link2 size={12} /> Attachment {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Linked CIs */}
                            {selected.linkedCIs?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Linked CIs</p>
                                    {selected.linkedCIs.map(l => (
                                        <div key={l.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 flex items-center gap-2">
                                            <Link2 size={10} /> {l.ci.name} ({l.ci.ciNumber})
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Linked Tickets */}
                            {selected.linkedTickets?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Linked Incidents</p>
                                    {selected.linkedTickets.map(t => (
                                        <div key={t.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50">{t.ticketNumber} – {t.title}</div>
                                    ))}
                                </div>
                            )}

                            {/* Activity Timeline */}
                            {selected.activities?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Timeline History</p>
                                    <div className="border-l border-white/10 ml-3 space-y-4 py-2">
                                        {selected.activities.map(act => (
                                            <div key={act.id} className="relative pl-5 text-xs">
                                                <div className="absolute w-2 h-2 bg-blue-500 rounded-full left-[-4.5px] top-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                <p className="text-white/80 font-medium">{act.action.replace(/_/g, " ")}</p>
                                                <p className="text-white/40 mt-0.5">{act.actor?.name || 'System'} • {new Date(act.createdAt || act.timestamp).toLocaleString("en-IN")}</p>
                                                {act.newValue && <p className="text-blue-300/80 mt-1 italic w-full">"{act.newValue}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <ChangeCommentThread changeId={selected.id} comments={selected.comments || []} api={api} onRefresh={async () => {
                                const r = await api.get(`/servicedesk/changes/${selected.id}`); setSelected(r.data.data);
                            }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-4xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div>
                                <h3 className="text-white font-bold text-lg">New Change Request (RFC)</h3>
                                <p className="text-white/40 text-xs">Fill out standard ITIL metadata for approval and CAB processing.</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={createChange} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Basics */}
                            <div className="space-y-2">
                                <label className="text-xs text-white/50 uppercase font-semibold">Basics</label>
                                <input required placeholder="RFC Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="" disabled>Change Type</option>
                                        {TYPES.map(t => <option key={t} value={t}>{t} Change</option>)}
                                    </select>
                                    <select value={form.risk} onChange={e => setForm(f => ({ ...f, risk: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="" disabled>Risk Level</option>
                                        {RISKS.map(r => <option key={r} value={r}>{r} Risk</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="" disabled>Impact</option>
                                        {LEVELS.map(l => <option key={l} value={l}>{l} Impact</option>)}
                                    </select>
                                    <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="" disabled>Urgency</option>
                                        {LEVELS.map(l => <option key={l} value={l}>{l} Urgency</option>)}
                                    </select>
                                </div>
                                <textarea required rows={2} placeholder="Brief Description *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            {/* Planning */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <label className="text-xs text-white/50 uppercase font-semibold">Implementation Planning</label>
                                <textarea required rows={2} placeholder="Business Justification / Reason *" value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={form.assignmentGroupId} onChange={e => setForm(f => ({ ...f, assignmentGroupId: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="">Select Technical Team (Optional)</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <select value={form.implementerId} onChange={e => setForm(f => ({ ...f, implementerId: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="">Select Implementer (Optional)</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/30 block">Linked Configuration Items</label>
                                    <select multiple value={form.linkedCIIds} onChange={e => setForm(f => ({ ...f, linkedCIIds: Array.from(e.target.selectedOptions, o => o.value) }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm h-24">
                                        {cis.map(c => <option key={c.id} value={c.id}>{c.name} ({c.ciNumber})</option>)}
                                    </select>
                                </div>
                                <textarea required rows={2} placeholder="Implementation Plan *" value={form.implementationPlan} onChange={e => setForm(f => ({ ...f, implementationPlan: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
                                <textarea rows={2} placeholder="Test Plan" value={form.testPlan} onChange={e => setForm(f => ({ ...f, testPlan: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
                                <textarea required rows={2} placeholder="Rollback Plan *" value={form.rollbackPlan} onChange={e => setForm(f => ({ ...f, rollbackPlan: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
                            </div>

                            {/* Scheduling */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <label className="text-xs text-white/50 uppercase font-semibold">Scheduling & CAB</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/30 block mb-1">Planned Start</label>
                                        <input type="datetime-local" value={form.plannedStart} onChange={e => setForm(f => ({ ...f, plannedStart: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/30 block mb-1">Planned End</label>
                                        <input type="datetime-local" value={form.plannedEnd} onChange={e => setForm(f => ({ ...f, plannedEnd: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                                    </div>
                                </div>
                                {(form.type === "NORMAL" || form.type === "EMERGENCY") && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-3">
                                        <div>
                                            <label className="text-[10px] text-blue-300 block mb-1">CAB Meeting Selection *</label>
                                            <input type="datetime-local" required value={form.cabMeetingDate} onChange={e => setForm(f => ({ ...f, cabMeetingDate: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50" />
                                            <p className="text-[10px] text-blue-200 mt-1">Normal/Emergency operations require a declared CAB meeting schedule.</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-blue-300 block mb-1">Select CAB Approvers *</label>
                                            <select multiple required value={form.cabApproverIds} onChange={e => setForm(f => ({ ...f, cabApproverIds: Array.from(e.target.selectedOptions, o => o.value) }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm h-24 focus:border-blue-500/50">
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} - {u.role?.name || 'User'}</option>)}
                                            </select>
                                            <p className="text-[10px] text-blue-200 mt-1">
                                                {form.type === "NORMAL" ? "Must select at least 2 Approvers (Managers)." : "Must select at least 3 Approvers (Managers & Admin)."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Attachments */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <label className="text-xs text-white/50 uppercase font-semibold">Attachments</label>
                                <input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files))}
                                    className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30" />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-white/10 sticky bottom-0 bg-[#1a1a2e] pb-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition">Submit RFC</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

function ChangeCommentThread({ changeId, comments, api, onRefresh }) {
    const [body, setBody] = useState("");
    async function post() {
        if (!body.trim()) return;
        await api.post(`/servicedesk/changes/${changeId}/comments`, { body });
        setBody(""); onRefresh();
    }
    return (
        <div>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Comments ({comments.length})</p>
            <div className="space-y-2 mb-2">
                {comments.map(c => (
                    <div key={c.id} className="bg-white/5 rounded-xl p-3 text-xs">
                        <p className="text-white/70">{c.body}</p>
                        <p className="text-white/20 mt-1">{new Date(c.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input value={body} onChange={e => setBody(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    placeholder="Add comment…" />
                <button onClick={post} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition">Post</button>
            </div>
        </div>
    );
}
