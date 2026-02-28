import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Settings, Users, Tag, Plus, X, Trash2 } from "lucide-react";

export default function ServiceDeskAdmin() {
    const { api } = useAuth();
    const [tab, setTab] = useState("teams");

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="text-gray-400" size={32} /> Service Desk Admin
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
                {[
                    { key: "teams", label: "Teams", icon: Users },
                    { key: "categories", label: "Categories", icon: Tag },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${tab === key ? "border-purple-500 text-purple-300" : "border-transparent text-white/40 hover:text-white"
                            }`}>
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            {tab === "teams" && <TeamsTab api={api} />}
            {tab === "categories" && <CategoriesTab api={api} />}
        </motion.div>
    );
}

function TeamsTab({ api }) {
    const [teams, setTeams] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTeam, setEditTeam] = useState(null);
    const [form, setForm] = useState({ name: "", description: "", memberUserIds: [] });

    async function fetchTeams() {
        setLoading(true);
        try {
            const [tr, ar] = await Promise.all([
                api.get("/servicedesk/admin/teams"),
                api.get("/employees?limit=200"),
            ]);
            setTeams(tr.data.data || []);
            setAgents(ar.data.users || ar.data || []);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { fetchTeams(); }, []);

    async function save(e) {
        e.preventDefault();
        try {
            if (editTeam) {
                await api.put(`/servicedesk/admin/teams/${editTeam.id}`, form);
            } else {
                await api.post("/servicedesk/admin/teams", form);
            }
            setShowForm(false); setEditTeam(null);
            setForm({ name: "", description: "", memberUserIds: [] });
            fetchTeams();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function deleteTeam(id) {
        if (!confirm("Delete this team?")) return;
        await api.delete(`/servicedesk/admin/teams/${id}`);
        fetchTeams();
    }

    function startEdit(t) {
        setEditTeam(t);
        setForm({ name: t.name, description: t.description || "", memberUserIds: t.members.map(m => m.userId) });
        setShowForm(true);
    }

    function toggleMember(userId) {
        setForm(f => ({
            ...f,
            memberUserIds: f.memberUserIds.includes(userId)
                ? f.memberUserIds.filter(id => id !== userId)
                : [...f.memberUserIds, userId],
        }));
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => { setEditTeam(null); setForm({ name: "", description: "", memberUserIds: [] }); setShowForm(true); }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    <Plus size={15} /> New Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse bg-white/5 rounded-2xl" />)
                ) : teams.length === 0 ? (
                    <div className="col-span-3 text-center text-white/30 py-12">No teams yet</div>
                ) : teams.map(t => (
                    <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-white font-bold">{t.name}</p>
                                {t.description && <p className="text-white/40 text-xs mt-0.5">{t.description}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(t)} className="text-xs text-white/40 hover:text-white transition">Edit</button>
                                <button onClick={() => deleteTeam(t.id)} className="text-red-400/60 hover:text-red-400"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-white/30">{t.members?.length || 0} members</span>
                            {t._count?.tickets > 0 && <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">{t._count.tickets} tickets</span>}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-6 overflow-y-auto">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xl space-y-4 my-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">{editTeam ? "Edit" : "New"} Team</h3>
                            <button onClick={() => { setShowForm(false); setEditTeam(null); }} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-3">
                            <input required placeholder="Team Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />

                            <div>
                                <label className="text-white/40 text-xs mb-2 block">Select Members</label>
                                <div className="max-h-52 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-3 border border-white/10">
                                    {agents.map(a => (
                                        <label key={a.id} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded-lg px-2">
                                            <input type="checkbox" className="rounded"
                                                checked={form.memberUserIds.includes(a.id)}
                                                onChange={() => toggleMember(a.id)} />
                                            <span className="text-white/70 text-sm">{a.name}</span>
                                            <span className="text-white/30 text-xs">{a.designation || a.email}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => { setShowForm(false); setEditTeam(null); }}
                                    className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit"
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition">
                                    {editTeam ? "Save" : "Create"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function CategoriesTab({ api }) {
    const [cats, setCats] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", ticketType: "INCIDENT", teamId: "" });

    async function fetchCats() {
        setLoading(true);
        try {
            const [cr, tr] = await Promise.all([
                api.get("/servicedesk/admin/categories"),
                api.get("/servicedesk/admin/teams"),
            ]);
            setCats(cr.data.data || []);
            setTeams(tr.data.data || []);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { fetchCats(); }, []);

    async function save(e) {
        e.preventDefault();
        try {
            await api.post("/servicedesk/admin/categories", { ...form, teamId: form.teamId || null });
            setShowForm(false);
            setForm({ name: "", ticketType: "INCIDENT", teamId: "" });
            fetchCats();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    }

    async function deleteCat(id) {
        if (!confirm("Delete category?")) return;
        await api.delete(`/servicedesk/admin/categories/${id}`);
        fetchCats();
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    <Plus size={15} /> New Category
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            {["Category", "Type", "Team", "Tickets", ""].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-white/30">Loading…</td></tr>
                        ) : cats.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-white/30">No categories yet</td></tr>
                        ) : cats.map(c => (
                            <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition">
                                <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-1 rounded-full ${c.ticketType === 'INCIDENT' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {c.ticketType.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white/50">{c.team?.name || "—"}</td>
                                <td className="px-4 py-3 text-white/50">{c._count?.tickets || 0}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => deleteCat(c.id)} className="text-red-400/60 hover:text-red-400"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">New Category</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-3">
                            <input required placeholder="Category Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            <select value={form.ticketType} onChange={e => setForm(f => ({ ...f, ticketType: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                <option value="INCIDENT">Incident</option>
                                <option value="SERVICE_REQUEST">Service Request</option>
                            </select>
                            <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                <option value="">No Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition">Create</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
