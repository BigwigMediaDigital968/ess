import { useState, useEffect } from "react";
import api from "../utils/api";
import { Upload, MapPin, Plus, Trash2, Save, ArrowRight, ArrowLeft, FileText, Eye } from "lucide-react";
import { designationSkills } from "../utils/skillUtils";
import { useNavigate } from "react-router-dom";

const INDIAN_BANKS = [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
    "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
    "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Federal Bank", "South Indian Bank",
    "Karur Vysya Bank", "Bandhan Bank", "RBL Bank", "City Union Bank", "Saraswat Bank", "Other"
];

const Onboarding = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const TOTAL_STEPS = 6;

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", dob: "", bloodGroup: "", personalEmail: "",
        presentAddress: "", permanentAddress: "", latitude: "", longitude: "",
        designation: "", roleId: "", departmentId: "", managerId: "", bandId: "", assignedOfficeId: "",
        email: "", password: "",
        skills: [],
        certifications: [],
        workExperience: [],
        // Bank & Tax
        panNumber: "", ufn: "",
        bankName: "", bankAccountNumber: "", ifscCode: "",
        // CTC
        ctcAnnual: "",
    });

    const [files, setFiles] = useState({
        profilePic: null,
        profilePicPreview: null,
        certBadges: [],
        certBadgePreviews: [],
        expDocs: [],
        expDocPreviews: [],
    });

    // Reference Data
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [bands, setBands] = useState([]);
    const [offices, setOffices] = useState([]);

    useEffect(() => {
        const fetchRefData = async () => {
            try {
                const [deptRes, rolesRes, offRes] = await Promise.all([
                    api.get("/employees/departments"),
                    api.get("/roles"),
                    api.get("/offices")
                ]);
                setDepartments(deptRes.data || []);
                setRoles(rolesRes.data || []);
                setOffices(offRes.data || []);

                try {
                    const bandsRes = await api.get("/organization/bands");
                    setBands(bandsRes.data || []);
                } catch (e) { /* bands may not have a route yet */ }
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

    const handleGeoLocation = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
        }

        if (window.isSecureContext === false) {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    setFormData(prev => ({
                        ...prev,
                        latitude: data.latitude,
                        longitude: data.longitude
                    }));
                    alert("Using IP-based location (No HTTPS detected)");
                } else {
                    throw new Error("IP fetch failed");
                }
            } catch (err) {
                setFormData(prev => ({ ...prev, latitude: 28.6139, longitude: 77.2090 }));
                alert("Using mock location (HTTPS required for real GPS)");
            }
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            setFormData(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }));
        }, (error) => {
            alert("Error getting location: " + error.message);
        });
    };

    const handleFileChange = (e, type, index = null) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);

        if (type === "profilePic") {
            setFiles(prev => ({ ...prev, profilePic: file, profilePicPreview: previewUrl }));
        } else if (type === "certBadges") {
            setFiles(prev => {
                const newBadges = [...prev.certBadges];
                const newPreviews = [...prev.certBadgePreviews];
                newBadges[index] = file;
                newPreviews[index] = { url: previewUrl, name: file.name, type: file.type };
                return { ...prev, certBadges: newBadges, certBadgePreviews: newPreviews };
            });
        } else if (type === "expDocs") {
            setFiles(prev => {
                const newDocs = [...prev.expDocs];
                const newPreviews = [...prev.expDocPreviews];
                newDocs[index] = file;
                newPreviews[index] = { url: previewUrl, name: file.name, type: file.type };
                return { ...prev, expDocs: newDocs, expDocPreviews: newPreviews };
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (Array.isArray(formData[key])) {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });

            if (files.profilePic) data.append("profilePic", files.profilePic);
            files.certBadges.forEach(file => { if (file) data.append("certBadges", file); });
            files.expDocs.forEach(file => { if (file) data.append("expDocs", file); });

            const res = await api.post("/onboarding", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Auto-create salary structure from CTC if provided
            if (formData.ctcAnnual && parseFloat(formData.ctcAnnual) > 0) {
                const userId = res.data?.user?.id || res.data?.id;
                if (userId) {
                    try {
                        await api.post("/salary/structure-from-ctc", {
                            userId,
                            ctcAnnual: parseFloat(formData.ctcAnnual)
                        });
                    } catch (salaryErr) {
                        console.warn('Salary structure auto-create failed:', salaryErr.message);
                    }
                }
            }

            setMessage("Employee Onboarded Successfully!");
            setTimeout(() => navigate('/directory'), 2000);
        } catch (err) {
            console.error(err);
            setMessage("Onboarding Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- Document Preview Helper ---
    const FilePreview = ({ preview, onOpen }) => {
        if (!preview) return null;
        const isImage = preview.type?.startsWith('image/');
        return (
            <div className="mt-2 flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg group">
                {isImage ? (
                    <img src={preview.url} alt="preview" className="w-12 h-12 object-cover rounded border border-white/20" />
                ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded border border-blue-500/20">
                        <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate">{preview.name}</p>
                    <p className="text-gray-500 text-xs">{isImage ? 'Image' : 'Document'}</p>
                </div>
                <button
                    type="button"
                    onClick={() => window.open(preview.url, '_blank')}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-white/5 px-2 py-1 rounded"
                >
                    <Eye size={12} /> Preview
                </button>
            </div>
        );
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
                <select name="roleId" value={formData.roleId} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white">
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select name="assignedOfficeId" value={formData.assignedOfficeId} onChange={handleChange} className="bg-white/5 border border-white/10 p-3 rounded text-white">
                    <option value="">Select Assigned Office / Branch</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <div className="col-span-2 md:col-span-1">
                    <select name="bandId" value={formData.bandId} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-3 rounded text-white">
                        <option value="">Select Band / Level</option>
                        {bands.map(b => <option key={b.id} value={b.id}>{b.name} (L{b.level})</option>)}
                    </select>
                    {bands.length === 0 && <p className="text-yellow-400/60 text-xs mt-1">No bands configured — add bands in Admin → Roles & Bands</p>}
                </div>
            </div>

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
                    <div key={idx} className="bg-white/5 p-3 rounded space-y-2 relative border border-white/5">
                        <button type="button" onClick={() => removeArrayItem(idx, 'certifications')} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Cert Name" value={cert.name} onChange={(e) => handleArrayChange(idx, 'name', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <input type="text" placeholder="Issuing Org" value={cert.issuingOrg} onChange={(e) => handleArrayChange(idx, 'issuingOrg', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <input type="text" placeholder="Credential URL" value={cert.credentialUrl} onChange={(e) => handleArrayChange(idx, 'credentialUrl', e.target.value, 'certifications')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <div>
                                <label className="text-white/60 text-xs block mb-1">Badge Image (optional)</label>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'certBadges', idx)} className="text-white text-sm" />
                                <FilePreview preview={files.certBadgePreviews[idx]} />
                            </div>
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
                    <div key={idx} className="bg-white/5 p-3 rounded space-y-2 relative border border-white/5">
                        <button type="button" onClick={() => removeArrayItem(idx, 'workExperience')} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Company Name" value={exp.companyName} onChange={(e) => handleArrayChange(idx, 'companyName', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <input type="text" placeholder="Designation" value={exp.designation} onChange={(e) => handleArrayChange(idx, 'designation', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <input type="date" placeholder="Start Date" value={exp.startDate} onChange={(e) => handleArrayChange(idx, 'startDate', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <input type="date" placeholder="End Date" value={exp.endDate} onChange={(e) => handleArrayChange(idx, 'endDate', e.target.value, 'workExperience')} className="bg-black/20 text-white p-2 rounded border border-white/10" />
                            <div className="col-span-2">
                                <label className="text-white/60 text-sm block mb-1">Upload Experience / Relieving Letter</label>
                                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => handleFileChange(e, 'expDocs', idx)} className="text-white text-sm" />
                                <FilePreview preview={files.expDocPreviews[idx]} />
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
                    {files.profilePicPreview && (
                        <img src={files.profilePicPreview} alt="Profile Preview" className="mt-3 w-24 h-24 rounded-full object-cover border-2 border-purple-400 mx-auto" />
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-5">
            <h3 className="text-xl font-semibold text-white">CTC, Bank &amp; Tax Details</h3>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
                🏦 These details are used for salary disbursement and TDS calculation under the <strong>New Tax Regime (FY 2025-26 / 2026-27)</strong>.
            </div>

            {/* CTC Offered */}
            <div>
                <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">CTC Offered (Annual)</h4>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                        type="number"
                        placeholder="e.g. 1200000"
                        value={formData.ctcAnnual}
                        onChange={e => setFormData(prev => ({ ...prev, ctcAnnual: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 p-3 pl-7 rounded text-white"
                        min="0"
                    />
                </div>
                {formData.ctcAnnual && parseFloat(formData.ctcAnnual) > 0 && (
                    <p className="text-emerald-400 text-xs mt-1">
                        ✅ Salary structure will auto-configure — Basic: ₹{Math.round(parseFloat(formData.ctcAnnual) / 12 * 0.40).toLocaleString('en-IN')}/mo &nbsp;|&nbsp; HRA: ₹{Math.round(parseFloat(formData.ctcAnnual) / 12 * 0.20).toLocaleString('en-IN')}/mo
                    </p>
                )}
            </div>

            {/* PAN & UFN */}
            <div>
                <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">Tax Identifiers</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">PAN Number *</label>
                        <input
                            type="text"
                            name="panNumber"
                            placeholder="e.g. ABCDE1234F"
                            maxLength={10}
                            value={formData.panNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded text-white font-mono tracking-widest uppercase"
                        />
                        {formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) && (
                            <p className="text-red-400 text-xs mt-1">Must be in format: AAAAA9999A</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">UFN (Unique File Number)</label>
                        <input
                            type="text"
                            name="ufn"
                            placeholder="e.g. UFN123456"
                            value={formData.ufn}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Bank Details */}
            <div>
                <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">Bank Account</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-gray-400 mb-1">Bank Name *</label>
                        <select
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded text-white"
                        >
                            <option value="">Select Bank</option>
                            {INDIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Account Number *</label>
                        <input
                            type="text"
                            name="bankAccountNumber"
                            placeholder="e.g. 1234567890123"
                            value={formData.bankAccountNumber}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded text-white font-mono"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs text-gray-400 mb-1">IFSC Code *</label>
                        <input
                            type="text"
                            name="ifscCode"
                            placeholder="e.g. HDFC0001234"
                            maxLength={11}
                            value={formData.ifscCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded text-white font-mono uppercase tracking-widest"
                        />
                        {formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode) && (
                            <p className="text-red-400 text-xs mt-1">Must be in format: AAAA0XXXXXX</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tax Info Summary */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-purple-300 font-semibold mb-2 text-sm">🧾 New Tax Regime Slabs (FY 2025-26)</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                    <span>Up to ₹4,00,000</span><span className="text-green-400">NIL</span>
                    <span>₹4,00,001 – ₹8,00,000</span><span className="text-yellow-400">5%</span>
                    <span>₹8,00,001 – ₹12,00,000</span><span className="text-orange-400">10%</span>
                    <span>₹12,00,001 – ₹16,00,000</span><span className="text-orange-500">15%</span>
                    <span>₹16,00,001 – ₹20,00,000</span><span className="text-red-400">20%</span>
                    <span>₹20,00,001 – ₹24,00,000</span><span className="text-red-500">25%</span>
                    <span>Above ₹24,00,000</span><span className="text-red-600">30%</span>
                </div>
                <p className="text-xs text-green-400 mt-2">✅ Rebate u/s 87A: No tax if annual income ≤ ₹12,00,000</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8">Employee Onboarding</h1>

            {/* Step Indicator */}
            <div className="flex gap-2 mb-2 justify-center">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(step => (
                    <div key={step} className={`flex-1 h-1.5 rounded-full transition-all ${step <= activeStep ? 'bg-pink-500' : 'bg-white/10'}`} />
                ))}
            </div>
            <div className="flex justify-between mb-6 px-1">
                {['Personal', 'Address', 'Role', 'Experience', 'Account', 'Bank & Tax'].map((label, i) => (
                    <span key={i} className={`text-[10px] font-medium ${i + 1 === activeStep ? 'text-pink-400' : 'text-gray-600'}`}>{label}</span>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
                {activeStep === 1 && renderStep1()}
                {activeStep === 2 && renderStep2()}
                {activeStep === 3 && renderStep3()}
                {activeStep === 4 && renderStep4()}
                {activeStep === 5 && renderStep5()}
                {activeStep === 6 && renderStep6()}

                <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setActiveStep(prev => Math.max(1, prev - 1))} disabled={activeStep === 1} className="flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:bg-white/5 disabled:opacity-50">
                        <ArrowLeft size={18} /> Back
                    </button>

                    {activeStep < TOTAL_STEPS ? (
                        <button type="button" onClick={() => setActiveStep(prev => Math.min(TOTAL_STEPS, prev + 1))} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
