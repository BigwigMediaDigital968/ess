import { useState, useEffect } from "react";
import api from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, FileText, BrainCircuit, Upload, Plus, Gift, CheckCircle, XCircle, Send } from "lucide-react";

const STATUS_COLORS = {
    APPLIED: 'bg-blue-500/20 text-blue-300',
    SCREENING: 'bg-yellow-500/20 text-yellow-300',
    ASSESSMENT: 'bg-purple-500/20 text-purple-300',
    INTERVIEW: 'bg-orange-500/20 text-orange-300',
    OFFER: 'bg-teal-500/20 text-teal-300',
    HIRED: 'bg-green-500/20 text-green-300',
    REJECTED: 'bg-red-500/20 text-red-300',
};

const OFFER_STATUS_COLORS = {
    GENERATED: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    SENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ACCEPTED: 'bg-green-500/20 text-green-300 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewReport, setViewReport] = useState(null);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerTargetApp, setOfferTargetApp] = useState(null);
    const [offerForm, setOfferForm] = useState({
        basic: 0, hra: 0, travelAllowance: 1600, medicalAllowance: 1250,
        specialAllowance: 0, bonus: 0, joiningDate: ''
    });
    const [offerLoading, setOfferLoading] = useState(false);
    const [candidateForm, setCandidateForm] = useState({
        firstName: "", lastName: "", email: "", phone: "", experienceYears: "", skills: "", resume: null
    });

    const fetchJob = async () => {
        try {
            const res = await api.get(`/talent/jobs/${id}`);
            setJob(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchJob(); }, [id]);

    const handleCreateTest = async (appId) => {
        try {
            await api.post("/talent/assessments/generate", { applicationId: appId });
            fetchJob();
            alert("Assessment Generated and Sent to Candidate!");
        } catch (err) {
            alert("Failed to generate test");
        }
    };

    const handleFileChange = (e) => setCandidateForm({ ...candidateForm, resume: e.target.files[0] });
    const handleInputChange = (e) => setCandidateForm({ ...candidateForm, [e.target.name]: e.target.value });

    const handleSubmitCandidate = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("jobId", id);
        data.append("firstName", candidateForm.firstName);
        data.append("lastName", candidateForm.lastName);
        data.append("email", candidateForm.email);
        data.append("phone", candidateForm.phone);
        data.append("experienceYears", candidateForm.experienceYears);
        data.append("skills", candidateForm.skills);
        if (candidateForm.resume) data.append("resume", candidateForm.resume);

        try {
            await api.post("/talent/apply", data, { headers: { "Content-Type": "multipart/form-data" } });
            setShowModal(false);
            setCandidateForm({ firstName: "", lastName: "", email: "", phone: "", experienceYears: "", skills: "", resume: null });
            fetchJob();
            alert("Candidate Added Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to add candidate");
        }
    };

    const openOfferModal = async (app) => {
        setOfferTargetApp(app);
        const d = new Date();
        d.setDate(d.getDate() + 30);
        // Try to load existing salary structure for this candidate
        let defaults = { basic: 0, hra: 0, travelAllowance: 1600, medicalAllowance: 1250, specialAllowance: 0, bonus: 0 };
        try {
            // If candidate is already an employee, load their structure
            // Otherwise use sensible defaults
        } catch (e) { }
        setOfferForm({ ...defaults, joiningDate: d.toISOString().split('T')[0] });
        setShowOfferModal(true);
    };

    const offerGross = (offerForm.basic || 0) + (offerForm.hra || 0) + (offerForm.travelAllowance || 0) + (offerForm.medicalAllowance || 0) + (offerForm.specialAllowance || 0) + (offerForm.bonus || 0);
    const offerPF = Math.round(Math.min(offerForm.basic || 0, 15000) * 0.12);
    const offerPT = (offerForm.basic || 0) > 10000 ? 200 : (offerForm.basic || 0) > 7500 ? 175 : 0;
    const offerTDS = Math.round(Math.max(0, offerGross * 12 - 75000) * 0.05 * 1.04 / 12); // simplified
    const offerNet = offerGross - offerPF - offerPT - offerTDS;
    const offerCTC = (offerGross + offerPF) * 12;

    const handleGenerateOffer = async (e) => {
        e.preventDefault();
        setOfferLoading(true);
        try {
            await api.post("/talent/offers", {
                applicationId: offerTargetApp.id,
                basicSalary: offerGross,
                allowances: (offerForm.travelAllowance || 0) + (offerForm.medicalAllowance || 0) + (offerForm.specialAllowance || 0) + (offerForm.bonus || 0),
                joiningDate: offerForm.joiningDate
            });
            setShowOfferModal(false);
            fetchJob();
            alert("Offer Letter Generated Successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to generate offer");
        } finally {
            setOfferLoading(false);
        }
    };

    const handleOfferStatusUpdate = async (offerId, status) => {
        try {
            await api.put(`/talent/offers/${offerId}/status`, { status });
            fetchJob();
        } catch (err) {
            alert("Failed to update offer status");
        }
    };

    if (loading) return <div className="text-white p-8">Loading...</div>;
    if (!job) return <div className="text-white p-8">Job not found</div>;

    return (
        <div className="p-8 relative">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/talent')} className="flex items-center gap-2 text-white/60 hover:text-white">
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={18} /> Add Candidate
                </button>
            </div>

            {/* AI Report Modal */}
            {viewReport && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Assessment Analysis</h2>
                            <button onClick={() => setViewReport(null)} className="text-white/60 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-white/80">{viewReport}</div>
                    </div>
                </div>
            )}

            {/* Offer Generation Modal */}
            {showOfferModal && offerTargetApp && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-6 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Gift size={20} className="text-teal-400" /> Generate Offer Letter</h2>
                                <p className="text-white/50 text-sm mt-0.5">
                                    {offerTargetApp.candidate.firstName} {offerTargetApp.candidate.lastName} — {job.title}
                                </p>
                            </div>
                            <button onClick={() => setShowOfferModal(false)} className="text-white/60 hover:text-white"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleGenerateOffer} className="space-y-4">
                            {/* Salary Components — editable */}
                            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                                <p className="text-xs text-teal-400 uppercase tracking-wider font-semibold mb-3">💰 Salary Components (Editable)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Basic Salary', key: 'basic' },
                                        { label: 'HRA', key: 'hra' },
                                        { label: 'Travel Allowance', key: 'travelAllowance' },
                                        { label: 'Medical Allowance', key: 'medicalAllowance' },
                                        { label: 'Special Allowance', key: 'specialAllowance' },
                                        { label: 'Bonus (Monthly)', key: 'bonus' },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="text-xs text-white/40 block mb-1">{label}</label>
                                            <div className="flex items-center bg-black/30 border border-white/10 rounded-lg overflow-hidden focus-within:border-teal-500">
                                                <span className="px-2 text-white/30 text-sm">₹</span>
                                                <input
                                                    type="number" min="0"
                                                    value={offerForm[key]}
                                                    onChange={e => setOfferForm(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                                                    className="flex-1 bg-transparent text-white text-sm py-2 pr-2 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live CTC Summary */}
                            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                                <p className="text-xs text-teal-400 uppercase tracking-wider mb-3 font-semibold">📊 CTC Summary</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between"><span className="text-white/60">Gross Monthly</span><span className="text-white">₹{offerGross.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-white/60">PF (Employee)</span><span className="text-red-400">-₹{offerPF.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-white/60">Prof. Tax</span><span className="text-red-400">-₹{offerPT.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-white/60">TDS (Est.)</span><span className="text-red-400">-₹{offerTDS.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between font-bold border-t border-white/10 pt-2 col-span-2">
                                        <span className="text-white">Net Take-Home</span>
                                        <span className="text-green-400">₹{Math.round(offerNet).toLocaleString('en-IN')}/mo</span>
                                    </div>
                                    <div className="flex justify-between col-span-2">
                                        <span className="text-white/50 text-xs">Annual CTC (incl. Employer PF)</span>
                                        <span className="text-teal-400 font-bold">₹{offerCTC.toLocaleString('en-IN')}/yr</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Joining Date</label>
                                <input type="date" required value={offerForm.joiningDate}
                                    onChange={e => setOfferForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                                    className="w-full bg-black/30 text-white p-3 rounded-lg border border-white/10 focus:border-teal-500 focus:outline-none" />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20">Cancel</button>
                                <button type="submit" disabled={offerLoading || offerGross === 0} className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-500 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {offerLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Gift size={16} /> Generate Offer</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Candidate Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-xl border border-white/10 w-full max-w-lg">
                        <h2 className="text-2xl font-bold text-white mb-6">Add Candidate</h2>
                        <form onSubmit={handleSubmitCandidate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input name="firstName" placeholder="First Name" value={candidateForm.firstName} onChange={handleInputChange} className="bg-black/20 text-white p-3 rounded" required />
                                <input name="lastName" placeholder="Last Name" value={candidateForm.lastName} onChange={handleInputChange} className="bg-black/20 text-white p-3 rounded" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="email" placeholder="Email" value={candidateForm.email} onChange={handleInputChange} className="bg-black/20 text-white p-3 rounded" required />
                                <input name="phone" placeholder="Phone" value={candidateForm.phone} onChange={handleInputChange} className="bg-black/20 text-white p-3 rounded" />
                            </div>
                            <input name="experienceYears" placeholder="Experience (Years)" type="number" value={candidateForm.experienceYears} onChange={handleInputChange} className="w-full bg-black/20 text-white p-3 rounded" required />
                            <input name="skills" placeholder="Skills (comma separated)" value={candidateForm.skills} onChange={handleInputChange} className="w-full bg-black/20 text-white p-3 rounded" required />
                            <div className="border border-dashed border-white/20 p-4 rounded text-center">
                                <label className="cursor-pointer text-blue-400 hover:text-blue-300 flex flex-col items-center">
                                    <Upload size={24} className="mb-2" />
                                    <span>{candidateForm.resume ? candidateForm.resume.name : "Upload Resume (PDF/DOC)"}</span>
                                    <input type="file" name="resume" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                                </label>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/10 text-white rounded hover:bg-white/20">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Job Info */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                <p className="text-white/60 mb-4">{job.department?.name} • {job.location} • {job.type}</p>
                <div className="prose text-white/80 max-w-none"><p>{job.description}</p></div>
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {['APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER'].map(stage => {
                    const count = job.applications.filter(a => a.status === stage).length;
                    return (
                        <div key={stage} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                            <p className="text-2xl font-bold text-white">{count}</p>
                            <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{stage}</p>
                        </div>
                    );
                })}
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Candidates Pipeline</h2>

            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-white/60 text-sm">
                        <tr>
                            <th className="p-4">Candidate</th>
                            <th className="p-4">AI Score</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Experience</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-white">
                        {job.applications.map(app => {
                            const isShortlisted = app.aiScore >= 80;
                            const assessment = app.assessments?.length > 0 ? app.assessments[0] : null;
                            const offer = app.offers?.length > 0 ? app.offers[0] : null;

                            return (
                                <tr key={app.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4">
                                        <div className="font-medium flex items-center gap-2">
                                            {app.candidate.firstName} {app.candidate.lastName}
                                            {isShortlisted && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">SHORTLISTED</span>}
                                        </div>
                                        <div className="text-xs text-white/40">{app.candidate.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-white/10 rounded-full h-2">
                                                <div className={`h-2 rounded-full ${app.aiScore >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${app.aiScore}%` }} />
                                            </div>
                                            <span className="text-sm">{Math.round(app.aiScore)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[app.status] || 'bg-white/10'}`}>{app.status}</span>
                                    </td>
                                    <td className="p-4">{app.candidate.experienceYears} Yrs</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {/* Send Test */}
                                            {app.status === 'APPLIED' && (
                                                <button onClick={() => handleCreateTest(app.id)} className="p-2 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 text-xs flex items-center gap-1">
                                                    <BrainCircuit size={14} /> Send Test
                                                </button>
                                            )}

                                            {/* Open Test (Dev) */}
                                            {app.status === 'ASSESSMENT' && assessment && (
                                                <button onClick={() => window.open(`/talent/assessment/${assessment.id}`, '_blank')} className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                                                    Open Test
                                                </button>
                                            )}

                                            {/* View Report */}
                                            {assessment?.status === 'COMPLETED' && (
                                                <button onClick={() => setViewReport(assessment.analysisReport)} className="p-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-xs flex items-center gap-1">
                                                    <FileText size={14} /> Report
                                                </button>
                                            )}

                                            {/* Generate Offer */}
                                            {app.status === 'INTERVIEW' && !offer && (
                                                <button onClick={() => openOfferModal(app)} className="p-2 bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30 text-xs flex items-center gap-1">
                                                    <Gift size={14} /> Generate Offer
                                                </button>
                                            )}

                                            {/* Offer Status Badge + Actions */}
                                            {offer && (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] border font-medium ${OFFER_STATUS_COLORS[offer.status]}`}>
                                                        OFFER: {offer.status}
                                                    </span>
                                                    <div className="text-[10px] text-white/40">
                                                        ₹{(offer.basicSalary + offer.allowances).toLocaleString('en-IN')}/mo
                                                    </div>
                                                    {offer.status === 'GENERATED' && (
                                                        <button onClick={() => handleOfferStatusUpdate(offer.id, 'SENT')} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                                                            <Send size={10} /> Mark Sent
                                                        </button>
                                                    )}
                                                    {offer.status === 'SENT' && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleOfferStatusUpdate(offer.id, 'ACCEPTED')} className="text-[10px] text-green-400 hover:underline flex items-center gap-1">
                                                                <CheckCircle size={10} /> Accept
                                                            </button>
                                                            <button onClick={() => handleOfferStatusUpdate(offer.id, 'REJECTED')} className="text-[10px] text-red-400 hover:underline flex items-center gap-1">
                                                                <XCircle size={10} /> Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    {offer.status === 'ACCEPTED' && (
                                                        <span className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Hired!</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {job.applications.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-white/40">No candidates applied yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobDetails;
