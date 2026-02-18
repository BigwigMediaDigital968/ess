import { useState, useEffect } from "react";
import api from "../utils/api";
import { Upload, MapPin, Plus, Trash2, Save, ArrowRight, ArrowLeft } from "lucide-react";
import { designationSkills } from "../utils/skillUtils";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", dob: "", bloodGroup: "", personalEmail: "",
        presentAddress: "", permanentAddress: "", latitude: "", longitude: "",
        designation: "", roleId: "", departmentId: "", managerId: "",
        email: "", password: "", // Portal Login
        skills: [],
        certifications: [],
        workExperience: []
    });

    const [files, setFiles] = useState({
        profilePic: null,
        certBadges: [],
        expDocs: []
    });

    // Reference Data
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        const fetchRefData = async () => {
            try {
                // Fetch Departments/Roles - Assuming endpoints exist or use mock for now
                // We'll try fetching from org API or separate endpoints
                // For MVP, we might need to hardcode or use existing if API supports
                const orgRes = await api.get("/organization/departments");
                setDepartments(orgRes.data || []);

                // Fetch Roles if endpoint exists, else hardcode
                // Assuming simple roles for now or "LegacyRole"
                setRoles([
                    { id: "HR", name: "HR" },
                    { id: "MANAGER", name: "Manager" },
                    { id: "EMPLOYEE", name: "Employee" },
                    { id: "ADMIN", name: "Admin" }
                ]);
            } catch (err) {
                console.error("Failed to fetch ref data", err);
            }
        };
        fetchRefData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "designation") {
            const defaultSkills = designationSkills[value] || [];
            setFormData(prev => ({ ...prev, [name]: value, skills: defaultSkills }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGeoLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
            }, (error) => {
                alert("Error getting location: " + error.message);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleFileChange = (e, type, index = null) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === "profilePic") {
            setFiles(prev => ({ ...prev, profilePic: file }));
        } else if (type === "certBadges") {
            setFiles(prev => {
                const newBadges = [...prev.certBadges];
                newBadges[index] = file;
                return { ...prev, certBadges: newBadges };
            });
        } else if (type === "expDocs") {
            setFiles(prev => {
                const newDocs = [...prev.expDocs];
                newDocs[index] = file;
                return { ...prev, expDocs: newDocs };
            });
        }
    };

    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, { name: "", issuingOrg: "", credentialUrl: "", issueDate: "", expiryDate: "" }]
        }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            workExperience: [...prev.workExperience, { companyName: "", designation: "", startDate: "", endDate: "", description: "" }]
        }));
    };

    const handleArrayChange = (index, field, value, arrayName) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const removeArrayItem = (index, arrayName) => {
        setFormData(prev => {
            const newArray = prev[arrayName].filter((_, i) => i !== index);
            return { ...prev, [arrayName]: newArray };
        });
        // Also remove file if exists (files logic needs sync, for now simpler to just ignore old file index)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const data = new FormData();
            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (Array.isArray(formData[key])) {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });

            // Append Files
            if (files.profilePic) data.append("profilePic", files.profilePic);
            files.certBadges.forEach(file => data.append("certBadges", file));
            files.expDocs.forEach(file => data.append("expDocs", file));

            const res = await api.post("/onboarding", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setMessage("Employee Onboarded Successfully!");
            setTimeout(() => navigate('/directory'), 2000);
        } catch (err) {
            console.error(err);
            setMessage("Onboarding Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white" required />
                <input type="text" placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white" required />
                <input type="date" placeholder="DOB" name="dob" value={formData.dob} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white" required />
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white">
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
            </div>
            <input type="email" placeholder="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" required />
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Address & Location</h3>
            <textarea placeholder="Present Address" name="presentAddress" value={formData.presentAddress} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-24" />
            <textarea placeholder="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-24" />

            <div className="flex items-center gap-4">
                <button type="button" onClick={handleGeoLocation} className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-300 rounded hover:bg-pink-500/30">
                    <MapPin size={18} /> Get Current Location
                </button>
                {formData.latitude && <span className="text-green-400 text-sm">Location Captured: {formData.latitude}, {formData.longitude}</span>}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Role & Skills</h3>
            <div className="grid grid-cols-2 gap-4">
                <select name="designation" value={formData.designation} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white">
                    <option value="">Select Designation</option>
                    {Object.keys(designationSkills).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            {/* Skills List */}
            {formData.skills.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-white font-medium">Skills</h4>
                    {formData.skills.map((skill, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded">
                            <span className="text-white flex-1">{skill.name}</span>
                            <input type="number" placeholder="Exp (Yrs)" value={skill.experienceYears} onChange={(e) => handleArrayChange(idx, 'experienceYears', e.target.value, 'skills')} className="w-20 bg-black/20 text-white p-1 rounded" />
                            <input type="number" placeholder="Rating (1-5)" value={skill.rating} onChange={(e) => handleArrayChange(idx, 'rating', e.target.value, 'skills')} className="w-20 bg-black/20 text-white p-1 rounded" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Experience & Certifications</h3>

            {/* Certifications */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h4 className="text-white font-medium">Certifications</h4>
                    <button type="button" onClick={addCertification} className="text-pink-400 text-sm flex items-center gap-1"><Plus size={16} /> Add</button>
                </div>
                {formData.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded space-y-2 relative">
                        <button type="button" onClick={() => removeArrayItem(idx, 'certifications')} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Name" value={cert.name} onChange={(e) => handleArrayChange(idx, 'name', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="text" placeholder="Issuing Org" value={cert.issuingOrg} onChange={(e) => handleArrayChange(idx, 'issuingOrg', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="text" placeholder="Credential URL" value={cert.credentialUrl} onChange={(e) => handleArrayChange(idx, 'credentialUrl', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="file" onChange={(e) => handleFileChange(e, 'certBadges', idx)} className="text-white text-sm" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Experience */}
            <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-white font-medium">Previous Experience</h4>
                    <button type="button" onClick={addExperience} className="text-pink-400 text-sm flex items-center gap-1"><Plus size={16} /> Add</button>
                </div>
                {formData.workExperience.map((exp, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded space-y-2 relative">
                        <button type="button" onClick={() => removeArrayItem(idx, 'workExperience')} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Company Name" value={exp.companyName} onChange={(e) => handleArrayChange(idx, 'companyName', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="text" placeholder="Designation" value={exp.designation} onChange={(e) => handleArrayChange(idx, 'designation', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="date" placeholder="Start Date" value={exp.startDate} onChange={(e) => handleArrayChange(idx, 'startDate', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded" />
                            <input type="date" placeholder="End Date" value={exp.endDate} onChange={(e) => handleArrayChange(idx, 'endDate', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded" />
                            <div className="col-span-2">
                                <label className="text-white/60 text-sm block mb-1">Upload Documents (Experience/Relieving Letter)</label>
                                <input type="file" onChange={(e) => handleFileChange(e, 'expDocs', idx)} className="text-white text-sm" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Account Setup</h3>
            <div className="space-y-4">
                <input type="email" placeholder="Portal Login Email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" required />
                <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" required />

                <div className="border border-white/10 p-4 rounded text-center">
                    <label className="block text-white mb-2">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} className="text-white text-sm mx-auto" />
                </div>
            </div>
        </div>
    );


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8">Employee Onboarding</h1>

            <div className="flex gap-2 mb-8 justify-center">
                {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} className={`w-10 h-2 rounded-full ${step <= activeStep ? 'bg-pink-500' : 'bg-white/10'}`} />
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
                {activeStep === 1 && renderStep1()}
                {activeStep === 2 && renderStep2()}
                {activeStep === 3 && renderStep3()}
                {activeStep === 4 && renderStep4()}
                {activeStep === 5 && renderStep5()}

                <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setActiveStep(prev => Math.max(1, prev - 1))} disabled={activeStep === 1} className="flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:bg-white/5 disabled:opacity-50">
                        <ArrowLeft size={18} /> Back
                    </button>

                    {activeStep < 5 ? (
                        <button type="button" onClick={() => setActiveStep(prev => Math.min(5, prev + 1))} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                            {loading ? "Submitting..." : <><Save size={18} /> Submit Onboarding</>}
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`mt-4 p-4 rounded text-center ${message.includes("Success") ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default Onboarding;
