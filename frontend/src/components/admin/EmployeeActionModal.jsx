import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { X, Upload, FileText, User, Check, IdCard, Briefcase, UserPen } from "lucide-react";
import VirtualIDCard from "../VirtualIDCard";

const EmployeeActionModal = ({ employee, onClose, onUpdate, roles, potentialManagers, departments }) => {
    const { api } = useAuth();
    const [activeTab, setActiveTab] = useState("profile"); // profile, docs, idcard
    const [loading, setLoading] = useState(false);
    const [orgData, setOrgData] = useState(null);

    // Profile State
    const [formData, setFormData] = useState({
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
        roleId: employee.roleId,
        departmentId: employee.departmentId || "",
        managerId: employee.managerId || "",
        skills: employee.skills ? employee.skills.join(", ") : "",
        bloodGroup: employee.bloodGroup || "",
        address: employee.address || ""
    });

    const [files, setFiles] = useState({ profile: null, document: null });

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                // Fetch public org info or authenticated if possible. 
                // Since this is admin modal, we can use authenticated route /organization (if it exists and returns what we need)
                // or /organization/public. public is safer for now as we know it exists.
                // But public might not have address? 
                // schema says Organization has address and website.
                // Let's use /organization/public if it returns everything, or /organization if user is admin.
                // Let's try /organization/public first, but we need address/website.
                // The public endpoint usually just returns name/logo.
                // Let's try to fetch full org details since we are likely admin here.
                const res = await api.get("/organization");
                setOrgData(res.data);
            } catch (e) {
                // Fallback to public if /organization fails (though it shouldn't for admin)
                try {
                    const resPublic = await api.get("/organization/public");
                    setOrgData(resPublic.data);
                } catch (err) {
                    console.log("Failed to fetch org data");
                }
            }
        };
        fetchOrg();
    }, [api]);

    // Update Profile (Details + Skills)
    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            // Update Basic Info
            const payload = {
                name: formData.name,
                email: formData.email,
                designation: formData.designation,
                roleId: formData.roleId,
                departmentId: formData.departmentId || null,
                managerId: formData.managerId || null,
                skills: formData.skills,
                bloodGroup: formData.bloodGroup,
                address: formData.address
            };
            console.log("Sending update payload:", payload);
            await api.put(`/employees/${employee.id}`, payload);
            alert("Profile updated successfully!");
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    // Upload File
    const handleUpload = async (type) => {
        const file = type === 'profilePicture' ? files.profile : files.document;
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (type === 'document') formData.append("docType", "OTHER");

        setLoading(true);
        try {
            await api.post(`/employees/${employee.id}/upload`, formData);
            alert("Upload successful!");
            onUpdate();
        } catch (error) {
            alert("Upload failed");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1 bg-white/5 rounded-full"><X size={20} /></button>

                {/* Header */}
                <div className="p-8 border-b border-white/10 bg-gradient-to-r from-purple-900/40 to-black">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img
                                src={employee.profilePictureUrl ? `http://localhost:3434${employee.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                                className="w-20 h-20 rounded-full border-4 border-purple-500/50 shadow-xl"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-gray-900"></div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{employee.name}</h2>
                            <p className="text-purple-300 font-medium tracking-wide flex items-center gap-2">
                                <Briefcase size={16} /> {employee.designation || "No Designation"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-white/5">
                    <button onClick={() => setActiveTab("profile")} className={`flex-1 py-4 text-center font-bold tracking-wide transition ${activeTab === "profile" ? "bg-purple-600/20 text-purple-300 border-b-2 border-purple-500" : "text-gray-400 hover:text-white"}`}>
                        <span className="flex items-center justify-center gap-2"><UserPen size={18} /> Profile & Skills</span>
                    </button>
                    <button onClick={() => setActiveTab("docs")} className={`flex-1 py-4 text-center font-bold tracking-wide transition ${activeTab === "docs" ? "bg-purple-600/20 text-purple-300 border-b-2 border-purple-500" : "text-gray-400 hover:text-white"}`}>
                        <span className="flex items-center justify-center gap-2"><FileText size={18} /> Documents</span>
                    </button>
                    <button onClick={() => setActiveTab("idcard")} className={`flex-1 py-4 text-center font-bold tracking-wide transition ${activeTab === "idcard" ? "bg-purple-600/20 text-purple-300 border-b-2 border-purple-500" : "text-gray-400 hover:text-white"}`}>
                        <span className="flex items-center justify-center gap-2"><IdCard size={18} /> ID Card</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 bg-black/20">
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Full Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Email Address</label>
                                        <input
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Role</label>
                                        <select
                                            value={formData.roleId}
                                            onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        >
                                            {roles.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Blood Group</label>
                                        <select
                                            value={formData.bloodGroup}
                                            onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        >
                                            <option value="" className="text-black">Select...</option>
                                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                                                <option key={bg} value={bg} className="text-black">{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Professional Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Designation</label>
                                        <input
                                            value={formData.designation}
                                            onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Department</label>
                                        <select
                                            value={formData.departmentId}
                                            onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        >
                                            <option value="" className="text-black">Select Department</option>
                                            {departments && departments.map(d => (
                                                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Reporting Manager</label>
                                        <select
                                            value={formData.managerId}
                                            onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1"
                                        >
                                            <option value="" className="text-black">None</option>
                                            {potentialManagers.filter(m => m.id !== employee.id).map(m => (
                                                <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1 h-[86px]"
                                            placeholder="Employee Address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Skills Full Width */}
                            <div>
                                <label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Skills & Technologies (Comma Separated)</label>
                                <textarea
                                    value={formData.skills}
                                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none mt-1 min-h-[100px]"
                                    placeholder="Java, React, Leadership..."
                                />
                            </div>

                            <button onClick={handleUpdateProfile} disabled={loading} className="w-full py-4 bg-purple-600 rounded-xl text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/50 transition transform hover:scale-[1.01]">
                                {loading ? "Saving Changes..." : "Save Profile Changes"}
                            </button>
                        </div>
                    )}

                    {activeTab === "docs" && (
                        <div className="space-y-6">
                            {/* DP Upload */}
                            <div className="flex items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                <div className="p-4 bg-purple-500/20 rounded-xl text-purple-300"><User size={32} /></div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-lg">Update Profile Picture</h4>
                                    <p className="text-gray-400 text-sm mb-3">Upload a new avatar for this employee.</p>
                                    <input
                                        type="file"
                                        onChange={e => setFiles({ ...files, profile: e.target.files[0] })}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                                    />
                                </div>
                                <button onClick={() => handleUpload("profilePicture")} disabled={!files.profile || loading} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition">
                                    <Upload size={20} />
                                </button>
                            </div>

                            {/* Doc Upload */}
                            <div className="flex items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                <div className="p-4 bg-blue-500/20 rounded-xl text-blue-300"><FileText size={32} /></div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-lg">Upload Documents</h4>
                                    <p className="text-gray-400 text-sm mb-3">Contracts, ID proofs, or resignation letters.</p>
                                    <input
                                        type="file"
                                        onChange={e => setFiles({ ...files, document: e.target.files[0] })}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                    />
                                </div>
                                <button onClick={() => handleUpload("document")} disabled={!files.document || loading} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition">
                                    <Upload size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "idcard" && (
                        <div className="flex flex-col items-center py-8 gap-4">
                            <p className="text-gray-400 mb-4 text-center max-w-sm">This digital ID card is automatically generated based on the employee's current profile.</p>
                            <VirtualIDCard user={{ ...employee, ...formData }} organization={orgData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeActionModal;
