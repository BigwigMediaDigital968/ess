import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { X, ChevronRight, Check, Upload, User, Briefcase, FileText, LayoutId } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VirtualIDCard from "../VirtualIDCard";

const CreateEmployeeWizard = ({ onClose, onSuccess }) => {
    const { api } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [createdUserId, setCreatedUserId] = useState(null);
    const [createdUser, setCreatedUser] = useState(null); // Full object for ID card

    // Data States
    const [basicInfo, setBasicInfo] = useState({
        name: "", email: "", password: "", roleId: "", designation: "", departmentId: "", managerId: ""
    });
    const [skills, setSkills] = useState("");
    const [files, setFiles] = useState({ profile: null, document: null });

    // Aux Data
    const [roles, setRoles] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const fetchAux = async () => {
            try {
                const [r, e] = await Promise.all([api.get("/roles"), api.get("/employees")]);
                setRoles(r.data);
                setEmployees(e.data);
            } catch (error) {
                console.error("Failed to fetch roles/employees");
            }
        };
        fetchAux();
    }, []);

    const handleNext = async () => {
        if (step === 1) {
            // Validate Basic Info
            if (!basicInfo.name || !basicInfo.email || !basicInfo.password || !basicInfo.roleId) {
                alert("Please fill all required fields");
                return;
            }
            setLoading(true);
            try {
                // Create User
                const res = await api.post("/employees", basicInfo);
                setCreatedUserId(res.data.id);
                setCreatedUser(res.data);
                setStep(2);
            } catch (error) {
                alert("Failed to create user: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        } else if (step === 2) {
            // Submit Skills
            setLoading(true);
            try {
                if (skills) {
                    await api.put(`/employees/${createdUserId}`, { id: createdUserId, skills: skills });
                    // Also update local user object for ID card?
                }
                setStep(3);
            } catch (error) {
                console.error("Skills update failed", error);
                // Move on anyway? or alert?
                setStep(3);
            } finally {
                setLoading(false);
            }
        } else if (step === 3) {
            // Upload Files
            setLoading(true);
            try {
                if (files.profile) {
                    const formData = new FormData();
                    formData.append("file", files.profile);
                    formData.append("type", "profilePicture");
                    const res = await api.post(`/employees/${createdUserId}/upload`, formData);
                    setCreatedUser(prev => ({ ...prev, profilePictureUrl: res.data.profilePictureUrl })); // Update preview
                }
                if (files.document) {
                    const formData = new FormData();
                    formData.append("file", files.document);
                    formData.append("type", "document");
                    formData.append("docType", "ONBOARDING");
                    await api.post(`/employees/${createdUserId}/upload`, formData);
                }
                setStep(4);
            } catch (error) {
                alert("File upload failed");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-4xl h-[600px] flex overflow-hidden shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X /></button>

                {/* Sidebar / Stepper */}
                <div className="w-1/3 bg-white/5 border-r border-white/10 p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-8">Onboard Employee</h2>
                        <div className="space-y-6">
                            <StepItem num={1} title="Basic Details" icon={<User size={18} />} current={step} />
                            <StepItem num={2} title="Skills & Info" icon={<Briefcase size={18} />} current={step} />
                            <StepItem num={3} title="Documents & DP" icon={<Upload size={18} />} current={step} />
                            <StepItem num={4} title=" ID Card" icon={<LayoutId size={18} />} current={step} />
                        </div>
                    </div>
                    {/* Progress Bar? */}
                </div>

                {/* Content Area */}
                <div className="w-2/3 p-8 relative">
                    {loading && <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center text-white">Processing...</div>}

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold text-white mb-4">Core Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Full Name *" value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} className="input-field" />
                                <input placeholder="Email *" type="email" value={basicInfo.email} onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })} className="input-field" />
                                <input placeholder="Password *" type="password" value={basicInfo.password} onChange={e => setBasicInfo({ ...basicInfo, password: e.target.value })} className="input-field" />
                                <input placeholder="Designation" value={basicInfo.designation} onChange={e => setBasicInfo({ ...basicInfo, designation: e.target.value })} className="input-field" />

                                <select value={basicInfo.roleId} onChange={e => setBasicInfo({ ...basicInfo, roleId: e.target.value })} className="input-field col-span-2" required>
                                    <option value="">Select Role *</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>

                                <select value={basicInfo.managerId} onChange={e => setBasicInfo({ ...basicInfo, managerId: e.target.value })} className="input-field col-span-2">
                                    <option value="">Select Reporting Manager</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.designation}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold text-white mb-4">Professional Details</h3>
                            <label className="text-gray-400 text-sm">Skills (Comma separated)</label>
                            <textarea
                                placeholder="e.g. React, Node.js, Leadership"
                                value={skills}
                                onChange={e => setSkills(e.target.value)}
                                className="input-field w-full h-32 resize-none"
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold text-white mb-4">Upload Assets</h3>

                            <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/10 transition">
                                <label className="cursor-pointer block">
                                    <div className="text-purple-400 mb-2 mx-auto"><User size={32} className="mx-auto" /></div>
                                    <span className="text-white font-medium">Upload Profile Picture</span>
                                    <p className="text-xs text-gray-500 mt-1">Recommended: Square JPG/PNG</p>
                                    <input type="file" className="hidden" onChange={e => setFiles({ ...files, profile: e.target.files[0] })} accept="image/*" />
                                </label>
                                {files.profile && <div className="mt-2 text-green-400 text-sm flex items-center justify-center gap-1"><Check size={12} /> {files.profile.name}</div>}
                            </div>

                            <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/10 transition">
                                <label className="cursor-pointer block">
                                    <div className="text-blue-400 mb-2 mx-auto"><FileText size={32} className="mx-auto" /></div>
                                    <span className="text-white font-medium">Upload Resume / Documents</span>
                                    <input type="file" className="hidden" onChange={e => setFiles({ ...files, document: e.target.files[0] })} />
                                </label>
                                {files.document && <div className="mt-2 text-green-400 text-sm flex items-center justify-center gap-1"><Check size={12} /> {files.document.name}</div>}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500">
                            <h3 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h3>
                            <p className="text-gray-400 mb-6">Employee account created successfully.</p>

                            <VirtualIDCard user={createdUser} />

                            <div className="mt-8">
                                <button onClick={() => { onSuccess(); onClose(); }} className="px-6 py-2 bg-purple-600 rounded-full text-white font-bold hover:bg-purple-500 transition">
                                    Done & Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 4 && (
                        <div className="absolute bottom-8 right-8 flex gap-4">
                            {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-gray-400 hover:text-white">Back</button>}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-bold hover:opacity-90 transition shadow-lg shadow-purple-900/50"
                            >
                                {step === 3 ? "Finish & Generate ID" : "Next Step"} <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const StepItem = ({ num, title, icon, current }) => (
    <div className={`flex items-center gap-3 ${current === num ? 'text-white' : current > num ? 'text-green-400' : 'text-gray-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${current === num ? 'border-purple-500 bg-purple-500/20 text-purple-400' : current > num ? 'border-green-500 bg-green-500/20' : 'border-gray-700 bg-gray-800'}`}>
            {current > num ? <Check size={14} /> : num}
        </div>
        <div className="flex flex-col">
            <span className={`text-sm font-medium ${current === num ? 'text-white' : ''}`}>{title}</span>
        </div>
    </div>
);

export default CreateEmployeeWizard;
