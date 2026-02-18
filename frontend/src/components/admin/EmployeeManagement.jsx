import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../ui/Card";
import { UserPlus, UserCog } from "lucide-react";
import EmployeeActionModal from "./EmployeeActionModal";

const EmployeeManagement = () => {
    const { api } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form Stats
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", roleId: "", bandId: "", designation: "", departmentId: "", managerId: ""
    });

    // Extended Actions Modal
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log("Fetching data...");

            // Fetch individually or use allSettled to prevent one failure from blocking others
            const empRes = await api.get("/employees").catch(e => { console.error("Emp fetch failed", e); return { data: [] }; });
            const rolesRes = await api.get("/roles").catch(e => { console.error("Roles fetch failed", e); return { data: [] }; });
            // This endpoint was 404ing, causing the whole Promise.all to reject
            const deptRes = await api.get("/organization/departments").catch(e => { console.error("Dept fetch failed", e); return { data: [] }; });

            console.log("Employees Data:", empRes.data);

            setEmployees(empRes.data || []);
            setRoles(rolesRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error("Critical failure in fetchData", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/employees", formData);
            alert("Employee created successfully!");
            setFormData({ name: "", email: "", password: "", roleId: "", bandId: "", designation: "", departmentId: "", managerId: "" });
            fetchData(); // Refresh list
        } catch (err) {
            alert("Failed to create employee");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Add Employee Form */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UserPlus className="text-purple-400" /> Add New Employee</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                        <input
                            placeholder="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                        <input
                            placeholder="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                        <input
                            placeholder="Designation"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />

                        <select
                            value={formData.roleId}
                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        >
                            <option value="" className="bg-gray-900 text-gray-400">Select Role</option>
                            {roles.map(r => <option key={r.id} value={r.id} className="bg-gray-900">{r.name}</option>)}
                        </select>

                        <select
                            value={formData.managerId}
                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                            <option value="" className="bg-gray-900 text-gray-400">Select Manager (Optional)</option>
                            {employees.map(e => <option key={e.id} value={e.id} className="bg-gray-900">{e.name} ({e.designation})</option>)}
                        </select>

                        <select
                            value={formData.departmentId}
                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                            className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                            <option value="" className="bg-gray-900 text-gray-400">Select Department (Optional)</option>
                            {departments.map(d => <option key={d.id} value={d.id} className="bg-gray-900">{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105">Create User</button>
                    </div>
                </form>
            </div>

            {/* Extended Actions Modal */}
            {selectedEmployee && (
                <EmployeeActionModal
                    employee={selectedEmployee}
                    roles={roles}
                    departments={departments}
                    potentialManagers={employees}
                    onClose={() => setSelectedEmployee(null)}
                    onUpdate={fetchData}
                />
            )}

            {/* Employee List */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-white">All Employees</h3>
                        <span className="text-sm text-gray-400">{filteredEmployees.length} Total</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>

                {filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No employees found matching your search.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-300 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 font-medium">Employee</th>
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Designation</th>
                                    <th className="p-4 font-medium">Manager</th>
                                    <th className="p-4 text-center font-medium">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="text-gray-300 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 overflow-hidden">
                                                    <img
                                                        src={emp.profilePictureUrl ? `http://localhost:3434${emp.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${emp.name}&background=random`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white group-hover:text-purple-300 transition-colors">{emp.name}</div>
                                                    <div className="text-xs text-gray-500">{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-purple-300">{emp.employeeId || "-"}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                                                {emp.role?.name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">{emp.designation || "-"}</td>
                                        <td className="p-4">
                                            {emp.manager ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-1.5 rounded-lg w-fit">
                                                    <div className="w-5 h-5 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold border border-purple-500/30">
                                                        {emp.manager.name[0]}
                                                    </div>
                                                    {emp.manager.name}
                                                </div>
                                            ) : <span className="text-gray-600 text-xs">-</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedEmployee(emp)}
                                                className="p-2 bg-white/5 text-gray-400 hover:bg-purple-600 hover:text-white rounded-lg transition-all"
                                                title="Manage Profile"
                                            >
                                                <UserCog size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeManagement;
