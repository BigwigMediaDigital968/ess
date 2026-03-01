import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Clock, CheckCircle, XCircle, AlertTriangle, User, Calendar, FileText, Hourglass, ChevronRight, Send, X } from 'lucide-react';

// ─── Sandglass animation component ────────────────────────────────────────────
const Sandglass = ({ percent }) => (
    <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">
        <defs>
            <linearGradient id="sg-top" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="sg-bot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
        </defs>
        {/* Outline */}
        <path d="M5,5 L75,5 L45,50 L75,95 L5,95 L35,50 Z" fill="none" stroke="#4b5563" strokeWidth="2" />
        {/* Top sand (draining) */}
        <clipPath id="top-clip"><path d="M5,5 L75,5 L45,50 L35,50 Z" /></clipPath>
        <rect x="0" y={5 + (45 * percent / 100)} width="80" height={45 * (1 - percent / 100)} fill="url(#sg-top)" clipPath="url(#top-clip)" opacity="0.85" />
        {/* Bottom sand (filling) */}
        <clipPath id="bot-clip"><path d="M35,50 L45,50 L75,95 L5,95 Z" /></clipPath>
        <rect x="0" y={95 - (45 * percent / 100)} width="80" height={45 * percent / 100} fill="url(#sg-bot)" clipPath="url(#bot-clip)" opacity="0.9" />
        {/* Neck dot */}
        <circle cx="40" cy="50" r="3" fill="#ec4899" />
    </svg>
);

// ─── Countdown timer ───────────────────────────────────────────────────────────
const Countdown = ({ lastDay }) => {
    const [remaining, setRemaining] = useState('');
    const [totalMs, setTotalMs] = useState(1);
    const [elapsedPct, setElapsedPct] = useState(0);

    useEffect(() => {
        const end = new Date(lastDay).getTime();
        const updateTimer = () => {
            const now = Date.now();
            const diff = end - now;
            if (diff <= 0) { setRemaining('Last day today!'); setElapsedPct(100); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        const id = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(id);
    }, [lastDay]);

    return <span className="font-mono text-xl font-bold text-purple-300 tracking-widest tabular-nums">{remaining}</span>;
};

// ─── Step progress indicator ───────────────────────────────────────────────────
const STEPS = [
    { key: 'manager', label: 'Manager Clearance', icon: User },
    { key: 'it', label: 'IT Handover', icon: FileText },
    { key: 'hr', label: 'HR Final Approval', icon: CheckCircle },
];

const StepIndicator = ({ request }) => {
    const completed = {
        manager: !!request.managerApprovedAt,
        it: !!request.itClearedAt,
        hr: !!request.hrApprovedAt,
    };
    const active = !completed.manager ? 'manager' : !completed.it ? 'it' : !completed.hr ? 'hr' : null;

    return (
        <div className="flex items-start gap-0 w-full mt-4">
            {STEPS.map((step, i) => {
                const done = completed[step.key];
                const isActive = active === step.key;
                const Icon = step.icon;
                return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                            {i > 0 && <div className={`flex-1 h-1 rounded-full transition-all duration-700 ${completed[STEPS[i - 1].key] ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`} />}
                            <motion.div
                                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg z-10
                                    ${done ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400 shadow-emerald-500/30'
                                        : isActive ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 shadow-purple-500/40 animate-pulse'
                                            : 'bg-white/5 border-white/20'}`}
                            >
                                {done ? <CheckCircle size={18} className="text-white" /> : <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />}
                            </motion.div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-1 rounded-full transition-all duration-700 ${done ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`} />}
                        </div>
                        <p className={`text-xs mt-2 font-medium text-center ${done ? 'text-emerald-400' : isActive ? 'text-purple-300' : 'text-gray-600'}`}>
                            {step.label}
                        </p>
                        {done && <p className="text-[10px] text-gray-600 mt-0.5">{new Date(request[`${step.key === 'it' ? 'itClearedAt' : step.key === 'manager' ? 'managerApprovedAt' : 'hrApprovedAt'}`]).toLocaleDateString()}</p>}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Resignation form modal ────────────────────────────────────────────────────
const ResignationModal = ({ onClose, onSubmit, forUserId, forUserName }) => {
    const [lastDay, setLastDay] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const minDate = new Date(); minDate.setDate(minDate.getDate() + 30);
    const minDateStr = minDate.toISOString().split('T')[0];

    const handleSubmit = async () => {
        if (!lastDay) return;
        setLoading(true);
        await onSubmit({ userId: forUserId, lastDay, reason });
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle size={20} className="text-amber-400" />
                        {forUserId ? `Resign: ${forUserName}` : 'Submit Resignation'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Last Working Day <span className="text-red-400">*</span> (min 30 days notice)</label>
                        <input type="date" min={minDateStr} value={lastDay} onChange={e => setLastDay(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Reason (optional)</label>
                        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Better opportunity, personal reasons..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
                        ⚠️ This action will notify your manager and HR immediately. Once submitted, your resignation must be cancelled by contacting HR.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">Cancel</button>
                        <button onClick={handleSubmit} disabled={!lastDay || loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                            <Send size={16} /> {loading ? 'Submitting...' : 'Submit Resignation'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Offboarding Page ─────────────────────────────────────────────────────
const Offboarding = () => {
    const { user } = useAuth();
    const [myRequest, setMyRequest] = useState(null);
    const [teamRequests, setTeamRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalTarget, setModalTarget] = useState(null); // { id, name } for HR initiating for someone
    const [actionLoading, setActionLoading] = useState('');

    const isPrivileged = ['ADMIN', 'OWNER', 'HR', 'DIRECTOR'].includes(user?.LegacyRole || '');
    const isManager = user?.LegacyRole === 'MANAGER';
    const isHR = user?.LegacyRole === 'HR';
    const isAdmin = ['ADMIN', 'OWNER'].includes(user?.LegacyRole || '');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [myRes, teamRes] = await Promise.all([
                api.get('/offboarding/my').catch(() => ({ data: null })),
                (isPrivileged || isManager) ? api.get('/offboarding/team').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
            ]);
            setMyRequest(myRes.data);
            setTeamRequests(teamRes.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [isPrivileged, isManager]);

    useEffect(() => { load(); }, [load]);

    const handleSubmitResignation = async ({ userId, lastDay, reason }) => {
        try {
            await api.post('/offboarding', { userId, lastDay, reason });
            setShowModal(false);
            setModalTarget(null);
            await load();
        } catch (err) { alert(err.response?.data?.message || 'Error submitting resignation'); }
    };

    const handleApproveStep = async (id, step) => {
        setActionLoading(id + step);
        try {
            await api.patch(`/offboarding/${id}/step`, { step });
            await load();
        } catch (err) { alert(err.response?.data?.message || 'Error updating step'); }
        setActionLoading('');
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel this offboarding request?')) return;
        try {
            await api.delete(`/offboarding/${id}`);
            await load();
        } catch (err) { alert(err.response?.data?.message || 'Error cancelling'); }
    };

    const getNextStep = (req) => {
        if (!req.managerApprovedAt) return 'MANAGER';
        if (!req.itClearedAt) return 'IT';
        if (!req.hrApprovedAt) return 'HR';
        return null;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500" />
        </div>
    );

    return (
        <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl"><Hourglass className="w-6 h-6 text-red-400" /></div>
                        Offboarding
                    </h1>
                    <p className="text-gray-400 mt-1">Manage resignation workflows and exit clearances</p>
                </div>
                {!myRequest && (
                    <button onClick={() => { setModalTarget(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600/80 to-pink-600/80 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-red-500/30">
                        <AlertTriangle size={16} /> Submit Resignation
                    </button>
                )}
            </div>

            {/* ── My Offboarding Status ── */}
            {myRequest && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-start gap-6">
                        {/* Sandglass */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.div animate={{ rotate: myRequest.status === 'COMPLETED' ? 0 : [0, 0, 3, -3, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}>
                                <Sandglass percent={
                                    myRequest.status === 'COMPLETED' ? 100 :
                                        !myRequest.managerApprovedAt ? 10 :
                                            !myRequest.itClearedAt ? 40 :
                                                !myRequest.hrApprovedAt ? 75 : 100
                                } />
                            </motion.div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Time remaining</span>
                            <Countdown lastDay={myRequest.lastDay} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-lg font-bold text-white">Your Resignation</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${myRequest.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                    'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                    {myRequest.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-1">
                                Last working day: <span className="text-white font-medium">{new Date(myRequest.lastDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </p>
                            {myRequest.reason && <p className="text-gray-500 text-sm mb-4 italic">"{myRequest.reason}"</p>}

                            <StepIndicator request={myRequest} />

                            {myRequest.status === 'COMPLETED' && (
                                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm">
                                    ✅ All clearances complete. Wishing you all the best in your next journey!
                                </div>
                            )}

                            {myRequest.status === 'PENDING' && (
                                <button onClick={() => handleCancel(myRequest.id)}
                                    className="mt-4 text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
                                    <X size={12} /> Withdraw resignation
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Team / HR View ── */}
            {(isPrivileged || isManager) && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">
                            {isPrivileged ? 'All Offboarding Requests' : 'Team Offboarding'}
                            {teamRequests.length > 0 && <span className="ml-2 bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full border border-red-500/20">{teamRequests.length}</span>}
                        </h2>
                        {isPrivileged && (
                            <button onClick={() => { setModalTarget({ id: null, name: 'Employee' }); setShowModal(true); }}
                                className="text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-all">
                                + Initiate for Employee
                            </button>
                        )}
                    </div>

                    {teamRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 bg-white/3 rounded-2xl border border-white/5">
                            <CheckCircle size={32} className="mx-auto mb-2 text-gray-700" />
                            No active offboarding requests
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teamRequests.map(req => {
                                const nextStep = getNextStep(req);
                                return (
                                    <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <img src={req.user.profilePictureUrl ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://ess.bigwigmediadigital.com:3434'}${req.user.profilePictureUrl}`
                                                : `https://ui-avatars.com/api/?name=${req.user.name}&background=random`}
                                                alt={req.user.name} className="w-12 h-12 rounded-full border-2 border-white/10" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-white font-semibold">{req.user.name}</span>
                                                    <span className="text-gray-500 text-sm">·</span>
                                                    <span className="text-purple-300 text-sm">{req.user.designation}</span>
                                                    {req.user.department && <span className="text-gray-500 text-xs">({req.user.department.name})</span>}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${req.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                                        'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                                        {req.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    Last day: <span className="text-gray-300">{new Date(req.lastDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    {req.reason && <span className="ml-2 italic">· "{req.reason}"</span>}
                                                </p>

                                                <StepIndicator request={req} />

                                                {/* Approval buttons */}
                                                {nextStep && (
                                                    <div className="mt-3 flex gap-2 flex-wrap">
                                                        {nextStep === 'MANAGER' && isManager && (
                                                            <button onClick={() => handleApproveStep(req.id, 'MANAGER')}
                                                                disabled={actionLoading === req.id + 'MANAGER'}
                                                                className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-1">
                                                                <CheckCircle size={12} /> Approve Manager Clearance
                                                            </button>
                                                        )}
                                                        {nextStep === 'IT' && isAdmin && (
                                                            <button onClick={() => handleApproveStep(req.id, 'IT')}
                                                                disabled={actionLoading === req.id + 'IT'}
                                                                className="px-4 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-1">
                                                                <CheckCircle size={12} /> Mark IT Handover Complete
                                                            </button>
                                                        )}
                                                        {nextStep === 'HR' && isHR && (
                                                            <button onClick={() => handleApproveStep(req.id, 'HR')}
                                                                disabled={actionLoading === req.id + 'HR'}
                                                                className="px-4 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-1">
                                                                <CheckCircle size={12} /> Final HR Approval
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Countdown lastDay={req.lastDay} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Resignation Modal */}
            <AnimatePresence>
                {showModal && (
                    <ResignationModal
                        onClose={() => { setShowModal(false); setModalTarget(null); }}
                        onSubmit={handleSubmitResignation}
                        forUserId={modalTarget?.id || null}
                        forUserName={modalTarget?.name || ''}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Offboarding;
