import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Search, Plus, X, BookOpen } from "lucide-react";

export default function KEDB() {
    const { api } = useAuth();
    const [entries, setEntries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        title: "", symptoms: "", rootCause: "", workaround: "", resolution: "", articleUrl: "",
    });

    async function fetchEntries() {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : "";
            const r = await api.get(`/servicedesk/kedb${params}`);
            setEntries(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { fetchEntries(); }, [search]);

    async function openEntry(entry) {
        const r = await api.get(`/servicedesk/kedb/${entry.id}`);
        setSelected(r.data.data);
    }

    async function createEntry(e) {
        e.preventDefault();
        try {
            await api.post("/servicedesk/kedb", form);
            setShowForm(false);
            setForm({ title: "", symptoms: "", rootCause: "", workaround: "", resolution: "", articleUrl: "" });
            fetchEntries();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="text-purple-400" size={32} /> Known Error Database
                </h2>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold transition">
                    <Plus size={18} /> New Article
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search symptoms, root cause, workaround…"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    [...Array(6)].map((_, i) => <div key={i} className="h-36 animate-pulse bg-white/5 rounded-2xl" />)
                ) : entries.length === 0 ? (
                    <div className="col-span-3 text-center text-white/30 py-16">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No known error articles yet</p>
                    </div>
                ) : entries.map(e => (
                    <motion.div key={e.id} whileHover={{ scale: 1.02 }} onClick={() => openEntry(e)}
                        className="bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer transition-all space-y-3">
                        <div>
                            <p className="text-purple-300 text-xs mb-1">Symptoms</p>
                            <p className="text-white font-semibold text-sm leading-snug">{e.title}</p>
                        </div>
                        <p className="text-white/50 text-xs line-clamp-2">{e.symptoms}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/30">{new Date(e.createdAt).toLocaleDateString("en-IN")}</span>
                            {e.problem && <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">{e.problem.problemNumber}</span>}
                            {e.resolution && <span className="text-xs text-green-400">✔ Has Resolution</span>}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* DETAIL MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-5 my-10">
                        <div className="flex items-start justify-between">
                            <h3 className="text-white font-bold text-xl">{selected.title}</h3>
                            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>

                        {selected.problem && (
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2 text-sm text-orange-300">
                                🔗 Linked to Problem: {selected.problem.problemNumber} — {selected.problem.title}
                            </div>
                        )}

                        {[
                            { label: "🔴 Symptoms", content: selected.symptoms },
                            { label: "🔍 Root Cause", content: selected.rootCause },
                            { label: "⚡ Workaround", content: selected.workaround },
                            ...(selected.resolution ? [{ label: "✅ Resolution", content: selected.resolution }] : []),
                        ].map(s => (
                            <div key={s.label} className="bg-white/5 rounded-xl p-4">
                                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{s.label}</p>
                                <p className="text-white/80 text-sm whitespace-pre-wrap">{s.content}</p>
                            </div>
                        ))}

                        {selected.articleUrl && (
                            <a href={selected.articleUrl} target="_blank" rel="noopener noreferrer"
                                className="block text-center py-2 border border-purple-500/40 rounded-xl text-purple-300 text-sm hover:bg-purple-500/10 transition">
                                📎 View External Article
                            </a>
                        )}

                        {selected.problem?.linkedIncidents?.length > 0 && (
                            <div>
                                <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Related Incidents</p>
                                {selected.problem.linkedIncidents.map(t => (
                                    <div key={t.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 mb-1">{t.ticketNumber} – {t.title}</div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* CREATE MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-4 my-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">New KEDB Article</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={createEntry} className="space-y-3">
                            {[
                                { key: "title", label: "Title *", type: "input", req: true },
                                { key: "symptoms", label: "Symptoms *", type: "textarea", req: true },
                                { key: "rootCause", label: "Root Cause *", type: "textarea", req: true },
                                { key: "workaround", label: "Workaround *", type: "textarea", req: true },
                                { key: "resolution", label: "Resolution", type: "textarea", req: false },
                                { key: "articleUrl", label: "External Article URL", type: "input", req: false },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-white/40 text-xs mb-1 block">{f.label}</label>
                                    {f.type === "input" ? (
                                        <input required={f.req} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    ) : (
                                        <textarea required={f.req} rows={2} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition">Create Article</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
