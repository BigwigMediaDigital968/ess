import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../ui/Card";
import { Plus, Trash, Edit } from "lucide-react";

const RoleManagement = () => {
    const { api } = useAuth();
    const [roles, setRoles] = useState([]);
    const [bands, setBands] = useState([]);
    const [newRole, setNewRole] = useState({ name: "", type: "INDIVIDUAL_CONTRIBUTOR" });
    const [newBand, setNewBand] = useState({ name: "", level: 1 });

    const fetchRolesAndBands = async () => {
        try {
            const [rolesRes, bandsRes] = await Promise.all([
                api.get("/roles"),
                api.get("/roles/bands")
            ]);
            setRoles(rolesRes.data);
            setBands(bandsRes.data);
        } catch (err) {
            console.error("Failed to fetch roles/bands");
        }
    };

    useEffect(() => {
        fetchRolesAndBands();
    }, []);

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            await api.post("/roles", newRole);
            setNewRole({ name: "", type: "INDIVIDUAL_CONTRIBUTOR" });
            fetchRolesAndBands();
        } catch (err) {
            alert("Failed to create role");
        }
    };

    const handleCreateBand = async (e) => {
        e.preventDefault();
        try {
            await api.post("/roles/bands", newBand);
            setNewBand({ name: "", level: newBand.level + 1 });
            fetchRolesAndBands();
        } catch (err) {
            alert("Failed to create band");
        }
    };

    const handleDeleteRole = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRolesAndBands();
        } catch (err) {
            alert("Failed to delete role");
        }
    };

    const handleDeleteBand = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/roles/bands/${id}`);
            fetchRolesAndBands();
        } catch (err) {
            alert("Failed to delete band");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Roles</h3>
                <form onSubmit={handleCreateRole} className="flex gap-2 mb-4">
                    <input
                        placeholder="Role Name"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        className="flex-1 p-2 rounded bg-black/20 border border-white/10 text-white"
                        required
                    />
                    <select
                        value={newRole.type}
                        onChange={(e) => setNewRole({ ...newRole, type: e.target.value })}
                        className="p-2 rounded bg-black/20 border border-white/10 text-white"
                    >
                        <option value="INDIVIDUAL_CONTRIBUTOR">IC</option>
                        <option value="LEADERSHIP">Leadership</option>
                        <option value="EXECUTIVE">Executive</option>
                        <option value="ADMINISTRATOR">Admin</option>
                    </select>
                    <button type="submit" className="p-2 bg-purple-600 rounded text-white"><Plus /></button>
                </form>
                <div className="space-y-2">
                    {roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <div>
                                <div className="text-white font-medium">{role.name}</div>
                                <div className="text-xs text-white/50">{role.type}</div>
                            </div>
                            <button onClick={() => handleDeleteRole(role.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Bands / Levels</h3>
                <form onSubmit={handleCreateBand} className="flex gap-2 mb-4">
                    <input
                        placeholder="Band Name (e.g. L1)"
                        value={newBand.name}
                        onChange={(e) => setNewBand({ ...newBand, name: e.target.value })}
                        className="flex-1 p-2 rounded bg-black/20 border border-white/10 text-white"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Level"
                        value={newBand.level}
                        onChange={(e) => setNewBand({ ...newBand, level: e.target.value })}
                        className="w-20 p-2 rounded bg-black/20 border border-white/10 text-white"
                        required
                    />
                    <button type="submit" className="p-2 bg-purple-600 rounded text-white"><Plus /></button>
                </form>
                <div className="space-y-2">
                    {bands.map(band => (
                        <div key={band.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <div>
                                <div className="text-white font-medium">{band.name}</div>
                                <div className="text-xs text-white/50">Level {band.level}</div>
                            </div>
                            <button onClick={() => handleDeleteBand(band.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default RoleManagement;
