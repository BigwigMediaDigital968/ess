import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, Link2 } from "lucide-react";

const CI_TYPES = ["SERVER", "VM", "DATABASE", "APPLICATION", "NETWORK", "ENDPOINT", "SERVICE", "STORAGE", "OTHER"];
const CI_STATUSES = ["ACTIVE", "INACTIVE", "RETIRED"];
const CI_ENVS = ["PROD", "UAT", "DEV", "DR", "STAGING"];
const REL_TYPES = ["DEPENDS_ON", "HOSTS", "RUNS_ON", "CONNECTS_TO", "BACKED_UP_BY", "PART_OF"];

const statusColors = { ACTIVE: "text-green-400", INACTIVE: "text-yellow-400", RETIRED: "text-white/30" };
const envColors = { PROD: "bg-red-500/20 text-red-300", UAT: "bg-yellow-500/20 text-yellow-300", DEV: "bg-blue-500/20 text-blue-300", DR: "bg-orange-500/20 text-orange-300", STAGING: "bg-purple-500/20 text-purple-300" };

const typeIcons = { SERVER: "🖥️", VM: "☁️", DATABASE: "🗄️", APPLICATION: "📦", NETWORK: "🌐", ENDPOINT: "💻", SERVICE: "⚙️", STORAGE: "💾", OTHER: "🔧" };

export default function CMDB() {
    const { api } = useAuth();
    const [cis, setCIs] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterEnv, setFilterEnv] = useState("");
    const [showRel, setShowRel] = useState(false);
    const [relForm, setRelForm] = useState({ targetId: "", relationshipType: "DEPENDS_ON" });

    const [form, setForm] = useState({
        name: "", type: "SERVER", environment: "PROD", status: "ACTIVE",
        ipAddress: "", hostName: "", location: "", description: "",
    });

    const fetchCIs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType) params.set("type", filterType);
            if (filterEnv) params.set("environment", filterEnv);
            if (search) params.set("search", search);
            const r = await api.get(`/servicedesk/cmdb?${params}`);
            setCIs(r.data.data || []);
        } catch { } finally { setLoading(false); }
    }, [api, filterType, filterEnv, search]);

    useEffect(() => { fetchCIs(); }, [fetchCIs]);

    async function openCI(ci) {
        const r = await api.get(`/servicedesk/cmdb/${ci.id}`);
        setSelected(r.data.data);
    }

    async function createCI(e) {
        e.preventDefault();
        try {
            await api.post("/servicedesk/cmdb", form);
            setShowForm(false);
            setForm({ name: "", type: "SERVER", environment: "PROD", status: "ACTIVE", ipAddress: "", hostName: "", location: "", description: "" });
            fetchCIs();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function updateStatus(status) {
        await api.put(`/servicedesk/cmdb/${selected.id}`, { status });
        const r = await api.get(`/servicedesk/cmdb/${selected.id}`);
        setSelected(r.data.data);
        fetchCIs();
    }

    async function addRelationship(e) {
        e.preventDefault();
        try {
            await api.post(`/servicedesk/cmdb/${selected.id}/relationships`, relForm);
            setShowRel(false);
            setRelForm({ targetId: "", relationshipType: "DEPENDS_ON" });
            const r = await api.get(`/servicedesk/cmdb/${selected.id}`);
            setSelected(r.data.data);
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    return (
        <motion.div className="flex h-[calc(100vh-5rem)] gap-4 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* LEFT */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-white">🗄️ CMDB</h2>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                        <Plus size={15} /> Add CI
                    </button>
                </div>

                <div className="flex gap-2 mb-3 shrink-0 flex-wrap">
                    <div className="relative flex-1 min-w-[160px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                            placeholder="Search CIs…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                        value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">All Types</option>
                        {CI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                        value={filterEnv} onChange={e => setFilterEnv(e.target.value)}>
                        <option value="">All Envs</option>
                        {CI_ENVS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-white/5 rounded-xl" />) :
                        cis.length === 0 ? <div className="text-center text-white/30 py-16">No configuration items found</div> :
                            cis.map(ci => (
                                <motion.div key={ci.id} whileHover={{ scale: 1.002 }}
                                    onClick={() => openCI(ci)}
                                    className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${selected?.id === ci.id ? "border-teal-500/50" : "border-white/10 hover:border-teal-500/30"
                                        }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{typeIcons[ci.type] || "🔧"}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-white/30">{ci.ciNumber}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${envColors[ci.environment]}`}>{ci.environment}</span>
                                                    <span className={`text-xs font-semibold ${statusColors[ci.status]}`}>⬤ {ci.status}</span>
                                                </div>
                                                <p className="text-white text-sm font-semibold">{ci.name}</p>
                                                {ci.hostName && <p className="text-white/30 text-xs">{ci.hostName}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-white/30">
                                            <p>{ci.type}</p>
                                            {ci._count?.tickets > 0 && <p className="text-orange-300 mt-1">🎫 {ci._count.tickets}</p>}
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
                        className="w-[480px] shrink-0 bg-[#13132a] border border-white/10 rounded-2xl flex flex-col overflow-hidden">

                        <div className="p-4 border-b border-white/10 flex items-start justify-between">
                            <div>
                                <span className="text-xs font-mono text-white/30">{selected.ciNumber}</span>
                                <h3 className="text-white font-bold text-lg">{typeIcons[selected.type]} {selected.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${envColors[selected.environment]}`}>{selected.environment}</span>
                                    <span className="text-xs text-white/40">{selected.type}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Status control */}
                            <select value={selected.status} onChange={e => updateStatus(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                                {CI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { label: "IP Address", val: selected.ipAddress || "—" },
                                    { label: "Hostname", val: selected.hostName || "—" },
                                    { label: "Location", val: selected.location || "—" },
                                    { label: "Managed By", val: selected.managedById || "—" },
                                ].map(d => (
                                    <div key={d.label} className="bg-white/5 rounded-xl p-3">
                                        <p className="text-white/30 mb-0.5">{d.label}</p>
                                        <p className="text-white">{d.val}</p>
                                    </div>
                                ))}
                            </div>

                            {selected.description && (
                                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70">{selected.description}</div>
                            )}

                            {/* Relationships */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-white/30 text-xs uppercase tracking-wider">Relationships</p>
                                    <button onClick={() => setShowRel(true)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                        <Link2 size={12} /> Add
                                    </button>
                                </div>
                                {[...(selected.relationsAsSource || []), ...(selected.relationsAsTarget || [])].map(r => (
                                    <div key={r.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 mb-1 flex items-center gap-2">
                                        <Link2 size={10} />
                                        <span>{r.source?.name || selected.name}</span>
                                        <span className="text-white/30">—{r.relationshipType.replace(/_/g, " ")}→</span>
                                        <span>{r.target?.name || "?"}</span>
                                    </div>
                                ))}
                                {(selected.relationsAsSource?.length + selected.relationsAsTarget?.length) === 0 && (
                                    <p className="text-white/20 text-xs">No relationships defined</p>
                                )}
                            </div>

                            {/* Linked Tickets */}
                            {selected.tickets?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Active Incidents ({selected.tickets.length})</p>
                                    {selected.tickets.map(t => (
                                        <div key={t.id} className="bg-orange-500/10 rounded-lg px-3 py-2 text-xs text-orange-300 mb-1">{t.ticketNumber} – {t.title}</div>
                                    ))}
                                </div>
                            )}

                            {/* Attributes */}
                            {selected.attributes && Object.keys(selected.attributes).length > 0 && (
                                <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Custom Attributes</p>
                                    {Object.entries(selected.attributes).map(([k, v]) => (
                                        <div key={k} className="flex justify-between text-xs bg-white/5 rounded px-3 py-1.5 mb-1">
                                            <span className="text-white/40">{k}</span>
                                            <span className="text-white/70">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE CI MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Add Configuration Item</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={createCI} className="space-y-3">
                            <input required placeholder="CI Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { key: "type", opts: CI_TYPES }, { key: "environment", opts: CI_ENVS }, { key: "status", opts: CI_STATUSES }
                                ].map(s => (
                                    <select key={s.key} value={form[s.key]} onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        {s.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="IP Address" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                                <input placeholder="Hostname" value={form.hostName} onChange={e => setForm(f => ({ ...f, hostName: e.target.value }))}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                            <input placeholder="Location / Data Center" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                            <textarea rows={2} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition">Add CI</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* ADD RELATIONSHIP MODAL */}
            {showRel && selected && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold">Add CI Relationship</h3>
                            <button onClick={() => setShowRel(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={addRelationship} className="space-y-3">
                            <select required value={relForm.targetId} onChange={e => setRelForm(f => ({ ...f, targetId: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                <option value="">Select target CI…</option>
                                {cis.filter(c => c.id !== selected.id).map(c => <option key={c.id} value={c.id}>{c.ciNumber} – {c.name}</option>)}
                            </select>
                            <select value={relForm.relationshipType} onChange={e => setRelForm(f => ({ ...f, relationshipType: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                {REL_TYPES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                            </select>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowRel(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 text-white font-semibold text-sm transition">Add</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
