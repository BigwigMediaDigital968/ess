import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Building2, Plus, Pencil, Trash2, Users, X, Check } from "lucide-react";

const DepartmentManagement = () => {
    const { api } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDept, setNewDept] = useState({ name: "", description: "" });
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchDepts(); }, []);

    const fetchDepts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/employees/departments");
            setDepartments(res.data || []);
        } catch (e) {
            console.error("Failed to fetch departments", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newDept.name.trim()) return;
        setSaving(true);
        try {
            await api.post("/employees/departments", newDept);
            setNewDept({ name: "", description: "" });
            fetchDepts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create department");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id) => {
        setSaving(true);
        try {
            await api.put(`/employees/departments/${id}`, editData);
            setEditingId(null);
            fetchDepts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update department");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete department "${name}"? Employees in this department will be unassigned.`)) return;
        try {
            await api.delete(`/employees/departments/${id}`);
            fetchDepts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete department");
        }
    };

    if (loading) return <div className="text-gray-400 text-center py-10">Loading departments...</div>;

    return (
        <div className="space-y-8">
            {/* Create New Department */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Building2 className="text-purple-400" /> Department Management
                </h3>
                <form onSubmit={handleCreate} className="flex gap-4 flex-wrap">
                    <input
                        placeholder="Department Name *"
                        value={newDept.name}
                        onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                        className="flex-1 min-w-[200px] bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                    />
                    <input
                        placeholder="Description (optional)"
                        value={newDept.description}
                        onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                        className="flex-1 min-w-[200px] bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        <Plus size={18} /> {saving ? "Creating..." : "Create Department"}
                    </button>
                </form>
            </div>

            {/* Department List */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">All Departments
                        <span className="ml-3 text-sm text-gray-400 font-normal">{departments.length} total</span>
                    </h3>
                </div>

                {departments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No departments yet. Create one above.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {departments.map(dept => (
                            <div key={dept.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition group">
                                <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/20 flex items-center justify-center text-purple-300">
                                    <Building2 size={20} />
                                </div>

                                {editingId === dept.id ? (
                                    <div className="flex-1 flex gap-3 flex-wrap">
                                        <input
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="flex-1 bg-white/5 border border-purple-500/50 rounded-lg p-2 text-white focus:outline-none text-sm"
                                        />
                                        <input
                                            value={editData.description}
                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            placeholder="Description"
                                            className="flex-1 bg-white/5 border border-purple-500/50 rounded-lg p-2 text-white focus:outline-none text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <div className="text-white font-semibold">{dept.name}</div>
                                        {dept.description && <div className="text-gray-400 text-sm">{dept.description}</div>}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Users size={14} />
                                    <span>{dept._count?.users ?? 0} employees</span>
                                </div>

                                {editingId === dept.id ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdate(dept.id)} disabled={saving} className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition" title="Save">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-2 bg-white/5 text-gray-400 hover:bg-white/20 rounded-lg transition" title="Cancel">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => { setEditingId(dept.id); setEditData({ name: dept.name, description: dept.description || "" }); }}
                                            className="p-2 bg-white/5 text-gray-400 hover:bg-purple-600 hover:text-white rounded-lg transition" title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dept.id, dept.name)}
                                            className="p-2 bg-white/5 text-gray-400 hover:bg-red-600 hover:text-white rounded-lg transition" title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentManagement;
