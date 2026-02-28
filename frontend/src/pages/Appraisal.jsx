import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target, Star, CheckCircle, Clock, ChevronDown, ChevronUp,
    Users, TrendingUp, Award, Send, Download, Plus, Trash2,
    AlertCircle, DollarSign, FileText, Settings, Briefcase
} from "lucide-react";

const QUARTERS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" onClick={() => !readonly && onChange?.(s)}
                className={`text-2xl transition ${readonly ? 'cursor-default' : 'hover:scale-110'} ${s <= value ? 'text-yellow-400' : 'text-white/20'}`}>★</button>
        ))}
        {value > 0 && <span className="text-white/50 text-sm ml-1 self-center">{value}/5</span>}
    </div>
);

const Badge = ({ children, color = 'bg-white/10 text-white/50' }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>
);

const phaseColor = (phase) => ({
    KRA_DRAFT: 'bg-orange-500/20 text-orange-300',
    KRA_APPROVED: 'bg-teal-500/20 text-teal-300',
    GOAL_SETTING: 'bg-blue-500/20 text-blue-300',
    GOAL_ACCEPTED: 'bg-purple-500/20 text-purple-300',
    SELF_REVIEW: 'bg-yellow-500/20 text-yellow-300',
    MANAGER_REVIEW: 'bg-purple-500/20 text-purple-300',
    Q4_ANNUAL: 'bg-pink-500/20 text-pink-300',
    HR_FINAL: 'bg-orange-500/20 text-orange-300',
    BUDGET_ALLOC: 'bg-green-500/20 text-green-300',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300',
}[phase] || 'bg-white/10 text-white/50');

// ─── Employee Panel ──────────────────────────────────────────────────────────
const EmployeePanel = ({ cycle, api, onRefresh }) => {
    const myGoals = (cycle?.goals || []).filter(g => g.kraCategory !== 'TEAM_KRA');
    const phase = cycle?.phase || '';
    const canSelfReview = ['SELF_REVIEW', 'Q4_ANNUAL', 'HR_FINAL'].includes(phase);
    const canAccept = phase === 'GOAL_SETTING' || phase === 'GOAL_ACCEPTED';
    const [goalRatings, setGoalRatings] = useState({});
    const [goalComments, setGoalComments] = useState({});
    const [submitting, setSubmitting] = useState('');

    const handleAccept = async (goalId, accept) => {
        try {
            await api.post(`/appraisal/goals/${goalId}/accept`, { accept, concern: null });
            onRefresh();
        } catch { alert('Failed to accept goal'); }
    };

    const handleGoalSelfReview = async (goalId) => {
        const r = goalRatings[goalId];
        if (!r) return alert('Please give a rating');
        setSubmitting(goalId);
        try {
            await api.post(`/appraisal/goals/${goalId}/self-review`, { selfRating: r, selfComment: goalComments[goalId] || '' });
            onRefresh();
        } catch { alert('Failed to submit'); }
        setSubmitting('');
    };

    return (
        <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                    <Target size={18} className="text-purple-400" />
                    My Goals — {QUARTERS[(cycle?.quarter || 1) - 1]} {cycle?.year}
                </h3>
                <p className="text-white/40 text-xs mb-4">Phase: <Badge color={phaseColor(phase)}>{phase?.replace(/_/g, ' ')}</Badge></p>

                {myGoals.length === 0 && <p className="text-white/30 text-sm">No goals set yet for this quarter.</p>}

                <div className="space-y-3">
                    {myGoals.map(g => (
                        <div key={g.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                    <p className="text-white font-medium">{g.title}</p>
                                    {g.description && <p className="text-white/50 text-sm mt-0.5">{g.description}</p>}
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        <span className="text-white/30 text-xs">Weight: {g.weight}%</span>
                                        {g.kraCategory && <span className="text-purple-400/60 text-xs">{g.kraCategory}</span>}
                                    </div>
                                </div>
                                <div className="shrink-0 text-right space-y-1">
                                    {g.acceptedByEmployee
                                        ? <Badge color="bg-green-500/20 text-green-300">✓ Accepted</Badge>
                                        : canAccept && (
                                            <button onClick={() => handleAccept(g.id, true)}
                                                className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-500">
                                                Accept Goal
                                            </button>
                                        )}
                                </div>
                            </div>

                            {/* Self Review */}
                            {canSelfReview && g.acceptedByEmployee && !g.selfSubmittedAt && (
                                <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
                                    <p className="text-white/60 text-xs font-bold uppercase">Self Review</p>
                                    <StarRating value={goalRatings[g.id] || 0} onChange={v => setGoalRatings(p => ({ ...p, [g.id]: v }))} />
                                    <textarea rows={2} value={goalComments[g.id] || ''} onChange={e => setGoalComments(p => ({ ...p, [g.id]: e.target.value }))}
                                        placeholder="Comment on this goal..." className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none" />
                                    <button onClick={() => handleGoalSelfReview(g.id)} disabled={submitting === g.id}
                                        className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 disabled:opacity-50">
                                        {submitting === g.id ? 'Submitting...' : 'Submit Self Rating'}
                                    </button>
                                </div>
                            )}
                            {g.selfSubmittedAt && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-yellow-300">
                                    <CheckCircle size={14} /> Self-rated {g.selfRating}/5
                                    {g.managerRating && <span className="text-purple-300 ml-2">| Manager: {g.managerRating}/5</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Published results */}
            {cycle?.reviews?.[0]?.status === 'PUBLISHED' && (
                <div className="bg-gradient-to-br from-purple-900/20 to-teal-900/20 border border-purple-500/20 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award size={18} className="text-yellow-400" /> Published Results</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-500/10 rounded-xl p-3 text-center">
                            <p className="text-white/50 text-xs mb-1">Manager Rating</p>
                            <StarRating value={cycle.reviews[0].managerRating || 0} readonly />
                        </div>
                        {cycle.reviews[0].salaryHike && (
                            <div className="bg-green-500/10 rounded-xl p-3 text-center">
                                <p className="text-white/50 text-xs mb-1">Salary Hike</p>
                                <p className="text-green-400 text-2xl font-bold">{cycle.reviews[0].salaryHike}%</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Manager Panel ──────────────────────────────────────────────────────────
const ManagerPanel = ({ cycle, api, onRefresh }) => {
    const [kraTitle, setKraTitle] = useState('');
    const [kraObj, setKraObj] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [goals, setGoals] = useState([{ title: '', weight: 100, kraCategory: '' }]);
    const [submitting, setSubmitting] = useState('');
    const [directReports, setDirectReports] = useState([]); // actual DB team members
    const phase = cycle?.phase || '';

    // Load actual direct reports (not derived from goals which may be empty)
    useEffect(() => {
        api.get('/appraisal/team-members')
            .then(r => setDirectReports(r.data || []))
            .catch(() => { });
    }, []);

    const teamGoals = (cycle?.goals || []).filter(g => g.kraCategory !== 'TEAM_KRA');
    const teamKRA = (cycle?.goals || []).find(g => g.kraCategory === 'TEAM_KRA');
    const teamReviews = cycle?.reviews || [];

    // Build member map from cycle data (goals + reviews)
    const memberMap = {};
    // First seed ALL direct reports so they appear even with no goals yet
    directReports.forEach(u => {
        memberMap[u.id] = { user: u, goals: [], review: null };
    });
    // Then merge in any goals / reviews from the cycle
    teamGoals.forEach(g => {
        if (memberMap[g.userId]) {
            memberMap[g.userId].goals.push(g);
        } else {
            memberMap[g.userId] = { user: g.user, goals: [g], review: null };
        }
    });
    teamReviews.forEach(r => {
        if (memberMap[r.userId]) memberMap[r.userId].review = r;
        else memberMap[r.userId] = { user: r.user, goals: [], review: r };
    });
    const members = Object.values(memberMap);

    const totalWeight = goals.reduce((s, g) => s + (parseFloat(g.weight) || 0), 0);

    const handleKRA = async () => {
        if (!kraTitle.trim()) return alert('KRA title required');
        setSubmitting('kra');
        try {
            await api.post('/appraisal/kra', { cycleId: cycle.id, kraTitle, kraObjectives: kraObj });
            setKraTitle(''); setKraObj('');
            onRefresh();
        } catch (e) { alert(e.response?.data?.message || 'Failed'); }
        setSubmitting('');
    };

    const handleSetGoals = async (userId) => {
        if (Math.round(totalWeight) !== 100) return alert(`Weights must total 100%. Current: ${totalWeight}%`);
        setSubmitting('goals');
        try {
            await api.post('/appraisal/goals', { cycleId: cycle.id, userId, goals: goals.filter(g => g.title.trim()) });
            setGoals([{ title: '', weight: 100, kraCategory: '' }]);
            setSelectedMember(null);
            onRefresh();
        } catch (e) { alert(e.response?.data?.message || 'Failed to set goals'); }
        setSubmitting('');
    };

    const handleGoalReview = async (goalId, rating, comment) => {
        setSubmitting(goalId);
        try {
            await api.post(`/appraisal/goals/${goalId}/review`, { managerRating: rating, managerComment: comment });
            onRefresh();
        } catch { alert('Failed'); }
        setSubmitting('');
    };

    return (
        <div className="space-y-5">
            {/* Step 1: KRA Initiation */}
            {(phase === 'KRA_DRAFT' || !teamKRA) && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Briefcase size={18} className="text-orange-400" />
                        {teamKRA ? '✓ Team KRA Submitted (Pending Approval)' : 'Step 1: Initiate Team KRA'}
                    </h3>
                    {teamKRA ? (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                            <p className="text-white font-medium">{teamKRA.title}</p>
                            <p className="text-white/50 text-sm mt-1">{teamKRA.description}</p>
                            <Badge color="bg-orange-500/20 text-orange-300">Awaiting Owner/Admin Approval</Badge>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input value={kraTitle} onChange={e => setKraTitle(e.target.value)}
                                placeholder="Team KRA Title (e.g. Q1 Delivery Excellence)"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500" />
                            <textarea value={kraObj} onChange={e => setKraObj(e.target.value)} rows={3}
                                placeholder="Objectives and key results for the team this quarter..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 resize-none" />
                            <button onClick={handleKRA} disabled={submitting === 'kra'}
                                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 font-medium disabled:opacity-50">
                                {submitting === 'kra' ? 'Submitting...' : 'Submit Team KRA for Approval'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Goal Setting per member */}
            {(phase === 'GOAL_SETTING' || phase === 'GOAL_ACCEPTED' || phase === 'SELF_REVIEW') && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Target size={18} className="text-blue-400" />Team Goals — {QUARTERS[(cycle?.quarter || 1) - 1]}</h3>
                    {members.length === 0 && <p className="text-white/30 text-sm">No team members found.</p>}
                    <div className="space-y-3">
                        {members.map(({ user, goals: mGoals, review }) => (
                            <div key={user?.id} className="border border-white/10 rounded-xl overflow-hidden">
                                <button onClick={() => setSelectedMember(selectedMember === user?.id ? null : user?.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm">{user?.name?.[0]}</div>
                                        <div className="text-left">
                                            <p className="text-white font-medium">{user?.name}</p>
                                            <p className="text-white/40 text-xs">{user?.designation} • {user?.department?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge color={`${mGoals.length > 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-white/10 text-white/30'}`}>
                                            {mGoals.length} goals
                                        </Badge>
                                        {selectedMember === user?.id ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {selectedMember === user?.id && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                            className="border-t border-white/10 p-4 space-y-4 overflow-hidden">
                                            {/* Existing goals */}
                                            {mGoals.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-white/50 text-xs font-bold uppercase">Current Goals</p>
                                                    {mGoals.map(g => (
                                                        <div key={g.id} className="bg-white/5 rounded-lg p-3">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-white text-sm font-medium">{g.title} <span className="text-white/30 text-xs ml-1">{g.weight}%</span></p>
                                                                {g.acceptedByEmployee ? <Badge color="bg-green-500/20 text-green-300">Accepted</Badge> : <Badge>Pending</Badge>}
                                                            </div>
                                                            {/* Manager goal review after self-review */}
                                                            {g.selfSubmittedAt && !g.managerRating && phase === 'MANAGER_REVIEW' && (
                                                                <GoalReviewForm goal={g} onSubmit={handleGoalReview} submitting={submitting} />
                                                            )}
                                                            {g.managerRating && (
                                                                <p className="text-purple-300 text-xs mt-1">Manager rating: {g.managerRating}/5</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Set/update goals */}
                                            {(phase === 'GOAL_SETTING' || mGoals.length === 0) && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-white/50 text-xs font-bold uppercase">Set Goals</p>
                                                        <span className={`text-xs font-mono ${Math.round(totalWeight) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                                                            Total: {totalWeight}% {Math.round(totalWeight) === 100 ? '✓' : '(must = 100%)'}
                                                        </span>
                                                    </div>
                                                    {goals.map((g, i) => (
                                                        <div key={i} className="flex gap-2 mb-2">
                                                            <input value={g.title} onChange={e => setGoals(p => p.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))}
                                                                placeholder={`Goal ${i + 1}`} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                                            <input value={g.kraCategory} onChange={e => setGoals(p => p.map((x, xi) => xi === i ? { ...x, kraCategory: e.target.value } : x))}
                                                                placeholder="Category" className="w-28 bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none" />
                                                            <input type="number" value={g.weight} onChange={e => setGoals(p => p.map((x, xi) => xi === i ? { ...x, weight: parseFloat(e.target.value) || 0 } : x))}
                                                                placeholder="%" className="w-16 bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                                            {goals.length > 1 && <button onClick={() => setGoals(p => p.filter((_, xi) => xi !== i))} className="text-red-400 px-1">✕</button>}
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => setGoals(p => [...p, { title: '', weight: 0, kraCategory: '' }])} className="text-blue-400 text-sm hover:text-blue-300">+ Add Goal</button>
                                                        <button onClick={() => handleSetGoals(user?.id)} disabled={submitting === 'goals' || Math.round(totalWeight) !== 100}
                                                            className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
                                                            {submitting === 'goals' ? 'Saving...' : 'Save Goals'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 8/9: Annual Console (Q4) */}
            {(phase === 'Q4_ANNUAL' || cycle?.quarter === 4) && (
                <AnnualConsoleManager api={api} cycle={cycle} onRefresh={onRefresh} />
            )}

            {/* Budget distribution */}
            {phase === 'BUDGET_ALLOC' && (
                <BudgetDistributionPanel api={api} cycle={cycle} members={members} onRefresh={onRefresh} />
            )}
        </div>
    );
};

const GoalReviewForm = ({ goal, onSubmit, submitting }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    return (
        <div className="mt-2 p-2 bg-purple-500/5 rounded-lg space-y-2 border border-purple-500/10">
            <p className="text-xs text-white/50">Employee self-rating: {goal.selfRating}/5 — "{goal.selfComment}"</p>
            <StarRating value={rating} onChange={setRating} />
            <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Manager feedback..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none resize-none" />
            <button onClick={() => onSubmit(goal.id, rating, comment)} disabled={!rating || submitting === goal.id}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-500 disabled:opacity-50">Rate Goal</button>
        </div>
    );
};

const AnnualConsoleManager = ({ api, cycle, onRefresh }) => {
    const [data, setData] = useState(null);
    const [finalRatings, setFinalRatings] = useState({});
    const [submitting, setSubmitting] = useState('');

    useEffect(() => {
        api.get(`/appraisal/annual-console?year=${cycle?.year}`).then(r => setData(r.data)).catch(() => { });
    }, [cycle]);

    const handleFinalRating = async (userId, rating) => {
        setSubmitting(userId);
        try {
            await api.post('/appraisal/final-rating', { cycleId: cycle.id, userId, managerFinalRating: rating });
            onRefresh();
        } catch { alert('Failed'); }
        setSubmitting('');
    };

    if (!data) return <div className="text-white/30 text-sm">Loading annual console...</div>;
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-pink-400" />Annual Rating Console — {data.year}</h3>
            <div className="space-y-3">
                {data.members?.map(m => (
                    <div key={m.user?.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-pink-500/30 flex items-center justify-center text-pink-300 font-bold text-sm">{m.user?.name?.[0]}</div>
                            <div>
                                <p className="text-white font-medium">{m.user?.name}</p>
                                <p className="text-white/40 text-xs">{m.user?.designation}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {[1, 2, 3, 4].map(q => {
                                const qd = m.quarters?.[q];
                                return (
                                    <div key={q} className="bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-white/40 text-xs">Q{q}</p>
                                        <p className="text-white font-bold">{qd?.managerRating ? `${qd.managerRating}/5` : '—'}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {!m.quarters?.[cycle?.quarter]?.managerFinalRating ? (
                            <div className="flex items-center gap-3">
                                <StarRating value={finalRatings[m.user?.id] || 0} onChange={v => setFinalRatings(p => ({ ...p, [m.user?.id]: v }))} />
                                <button onClick={() => handleFinalRating(m.user?.id, finalRatings[m.user?.id])}
                                    disabled={!finalRatings[m.user?.id] || submitting === m.user?.id}
                                    className="px-3 py-1.5 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-500 disabled:opacity-50">
                                    {submitting === m.user?.id ? 'Saving...' : 'Set Final Rating'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle size={14} /> Final: {m.quarters[cycle?.quarter].managerFinalRating}/5</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const BudgetDistributionPanel = ({ api, cycle, members, onRefresh }) => {
    const [budget, setBudget] = useState(null);
    const [distributions, setDistributions] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/appraisal/budget/${cycle.id}/my-team`).then(r => { setBudget(r.data.budget); const m = {}; r.data.allocations.forEach(a => { m[a.userId] = a.hikePercent; }); setDistributions(m); }).catch(() => { });
    }, [cycle.id]);

    const handleDistribute = async () => {
        setSubmitting(true);
        try {
            const dists = members.map(m => ({ userId: m.user?.id, hikePercent: parseFloat(distributions[m.user?.id] || 0), currentCTC: 500000 }));
            await api.post('/appraisal/budget/distribute', { cycleId: cycle.id, distributions: dists });
            onRefresh();
        } catch (e) { alert(e.response?.data?.message || 'Failed'); }
        setSubmitting(false);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><DollarSign size={18} className="text-green-400" />Budget Distribution</h3>
            {budget ? (
                <p className="text-white/50 text-sm mb-4">Allocated: <span className="text-green-400 font-bold">₹{budget.totalBudget?.toLocaleString('en-IN')}</span> | Used: ₹{budget.usedBudget?.toLocaleString('en-IN')}</p>
            ) : <p className="text-white/30 text-sm mb-4">No budget allocated yet. Awaiting Owner/Admin.</p>}
            {budget && (
                <div className="space-y-3">
                    {members.map(({ user }) => (
                        <div key={user?.id} className="flex items-center gap-3">
                            <span className="text-white flex-1">{user?.name}</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={distributions[user?.id] || ''} onChange={e => setDistributions(p => ({ ...p, [user?.id]: e.target.value }))}
                                    placeholder="Hike %" className="w-24 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                                <span className="text-white/40 text-sm">%</span>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleDistribute} disabled={submitting}
                        className="w-full py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-500 font-medium disabled:opacity-50 mt-2">
                        {submitting ? 'Saving...' : 'Save Budget Distribution'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Admin/Owner Panel ────────────────────────────────────────────────────────
const AdminPanel = ({ cycle, api, onRefresh }) => {
    const [pendingKRAs, setPendingKRAs] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [budgetInputs, setBudgetInputs] = useState({});
    const [managers, setManagers] = useState([]);
    const [submitting, setSubmitting] = useState('');
    const [revisedRatings, setRevisedRatings] = useState({});

    const load = useCallback(async () => {
        try {
            const [kras, reviews, bgt, mgrs] = await Promise.all([
                api.get('/appraisal/kra/pending').catch(() => ({ data: [] })),
                api.get(`/appraisal/team/${cycle?.id}`).catch(() => ({ data: [] })),
                cycle?.id ? api.get(`/appraisal/budget/${cycle.id}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                api.get('/employees?role=MANAGER').catch(() => ({ data: [] }))
            ]);
            setPendingKRAs(kras.data || []);
            setPendingReviews((reviews.data || []).filter(r => r.status === 'MANAGER_DONE' && !r.hrApproved));
            setBudgets(bgt.data || []);
            setManagers(mgrs.data || []);
        } catch { }
    }, [cycle?.id]);

    useEffect(() => { load(); }, [load]);

    const approveKRA = async (id) => {
        setSubmitting('kra' + id);
        try { await api.post(`/appraisal/kra/${id}/approve`); load(); onRefresh(); } catch { alert('Failed'); }
        setSubmitting('');
    };

    const approveFinal = async (reviewId, approve) => {
        setSubmitting('fr' + reviewId);
        try {
            await api.post('/appraisal/final-rating/approve', { reviewId, approved: approve, revisedRating: revisedRatings[reviewId] || undefined });
            load(); onRefresh();
        } catch { alert('Failed'); }
        setSubmitting('');
    };

    const allocateBudget = async (managerId) => {
        const amt = budgetInputs[managerId];
        if (!amt) return alert('Enter budget amount');
        setSubmitting('budget' + managerId);
        try {
            await api.post('/appraisal/budget', { cycleId: cycle.id, managerId, totalBudget: parseFloat(amt) });
            load();
        } catch (e) { alert(e.response?.data?.message || 'Failed'); }
        setSubmitting('');
    };

    const generateLetters = async () => {
        if (!confirm('Generate appraisal letters and update CTC for all employees?')) return;
        try {
            const r = await api.post(`/appraisal/generate-letters/${cycle.id}`);
            alert(r.data.message);
            onRefresh();
        } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="space-y-5">
            {/* KRA Approval */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Briefcase size={18} className="text-orange-400" />Team KRA Approvals</h3>
                {pendingKRAs.length === 0 ? <p className="text-white/30 text-sm">No pending KRAs.</p> : pendingKRAs.map(kra => (
                    <div key={kra.id} className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-3">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="text-white font-medium">{kra.title}</p>
                                <p className="text-white/50 text-sm mt-1">{kra.description}</p>
                                <p className="text-orange-300 text-xs mt-1">By: {kra.setBy?.name} — {kra.cycle?.quarter && `Q${kra.cycle.quarter} ${kra.cycle.year}`}</p>
                            </div>
                            <button onClick={() => approveKRA(kra.id)} disabled={submitting === 'kra' + kra.id}
                                className="shrink-0 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-500 disabled:opacity-50">
                                {submitting === 'kra' + kra.id ? '...' : 'Approve KRA'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Final Rating Approval */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award size={18} className="text-purple-400" />Final Rating Approvals</h3>
                {pendingReviews.length === 0 ? <p className="text-white/30 text-sm">No final ratings pending approval.</p> : pendingReviews.map(r => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                                <p className="text-white font-medium">{r.user?.name}</p>
                                <p className="text-white/40 text-xs">{r.user?.designation} • {r.user?.department?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/50 text-xs mb-1">Manager Final Rating</p>
                                <StarRating value={r.managerFinalRating || r.managerRating || 0} readonly />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="number" min={1} max={5} step={0.1} value={revisedRatings[r.id] || ''}
                                onChange={e => setRevisedRatings(p => ({ ...p, [r.id]: e.target.value }))}
                                placeholder="Revise rating (optional)" className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                            <button onClick={() => approveFinal(r.id, true)} disabled={submitting === 'fr' + r.id}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50">Approve</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget Allocation */}
            {cycle?.id && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><DollarSign size={18} className="text-green-400" />Budget Allocation per Team</h3>
                    <div className="space-y-3">
                        {managers.slice(0, 20).map(m => {
                            const existing = budgets.find(b => b.managerId === m.id);
                            return (
                                <div key={m.id} className="flex items-center gap-3">
                                    <span className="text-white flex-1 text-sm">{m.name} <span className="text-white/40 text-xs">({m.department?.name})</span></span>
                                    {existing ? (
                                        <Badge color="bg-green-500/20 text-green-300">₹{existing.totalBudget?.toLocaleString('en-IN')} allocated</Badge>
                                    ) : (
                                        <>
                                            <input type="number" value={budgetInputs[m.id] || ''} onChange={e => setBudgetInputs(p => ({ ...p, [m.id]: e.target.value }))}
                                                placeholder="₹ Budget" className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                                            <button onClick={() => allocateBudget(m.id)} disabled={submitting === 'budget' + m.id}
                                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50">Allocate</button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {budgets.length > 0 && (
                        <button onClick={generateLetters}
                            className="mt-5 w-full py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2">
                            <FileText size={18} /> Generate Appraisal Letters & Update CTC
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── HR Panel ─────────────────────────────────────────────────────────────────
const HRPanel = ({ cycle, api, onRefresh }) => {
    const [hikeData, setHikeData] = useState({});
    const [publishing, setPublishing] = useState(false);
    const [saving, setSaving] = useState(null);
    const reviews = cycle?.reviews || [];
    const managerDoneReviews = reviews.filter(r => r.status === 'MANAGER_DONE' || r.status === 'HR_APPROVED');

    const PHASES = ['KRA_DRAFT', 'KRA_APPROVED', 'GOAL_SETTING', 'GOAL_ACCEPTED', 'SELF_REVIEW', 'MANAGER_REVIEW', 'Q4_ANNUAL', 'HR_FINAL', 'BUDGET_ALLOC', 'COMPLETED'];

    const handleSaveHike = async (reviewId) => {
        const d = hikeData[reviewId] || {};
        setSaving(reviewId);
        try { await api.post('/appraisal/hr-approve', { reviewId, salaryHike: parseFloat(d.salaryHike) || 0, hikeAmount: parseFloat(d.hikeAmount) || 0, hrApproved: true }); onRefresh(); } catch { alert('Failed'); }
        setSaving(null);
    };

    const handlePublish = async () => {
        if (!confirm('Publish all approved reviews?')) return;
        setPublishing(true);
        try { await api.post(`/appraisal/publish/${cycle.id}`); onRefresh(); } catch { alert('Failed'); }
        setPublishing(false);
    };

    return (
        <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2"><Settings size={18} className="text-orange-400" />Cycle Phase Control</h3>
                    <Badge color={phaseColor(cycle?.phase)}>{cycle?.phase?.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PHASES.map(p => (
                        <button key={p} onClick={() => api.put(`/appraisal/cycles/${cycle.id}/status`, { phase: p }).then(onRefresh)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${cycle?.phase === p ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                            {p.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award size={18} className="text-orange-400" />HR Review & Hike Setting</h3>
                {managerDoneReviews.length === 0 ? <p className="text-white/30 text-sm">No reviews ready for HR approval yet.</p> : (
                    <div className="space-y-3">
                        {managerDoneReviews.map(r => (
                            <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-white font-medium">{r.user?.name}</p>
                                        <p className="text-white/40 text-xs">{r.user?.designation} • {r.user?.department?.name}</p>
                                    </div>
                                    <Badge color={r.status === 'HR_APPROVED' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/50'}>{r.status?.replace('_', ' ')}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div><p className="text-white/40 text-xs mb-1">Self Rating</p><StarRating value={r.selfRating || 0} readonly /></div>
                                    <div><p className="text-white/40 text-xs mb-1">Manager Rating</p><StarRating value={r.managerFinalRating || r.managerRating || 0} readonly /></div>
                                </div>
                                {r.status !== 'HR_APPROVED' && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Hike %</label>
                                            <input type="number" value={hikeData[r.id]?.salaryHike || ''} onChange={e => setHikeData(p => ({ ...p, [r.id]: { ...p[r.id], salaryHike: e.target.value } }))}
                                                placeholder="e.g. 15" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Hike Amount (₹/mo)</label>
                                            <input type="number" value={hikeData[r.id]?.hikeAmount || ''} onChange={e => setHikeData(p => ({ ...p, [r.id]: { ...p[r.id], hikeAmount: e.target.value } }))}
                                                placeholder="e.g. 8000" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                                        </div>
                                    </div>
                                )}
                                {r.status === 'HR_APPROVED'
                                    ? <div className="mt-3 flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={14} /> Approved — Hike: {r.salaryHike}% (₹{r.hikeAmount?.toLocaleString('en-IN')}/mo)</div>
                                    : <button onClick={() => handleSaveHike(r.id)} disabled={saving === r.id} className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-500 disabled:opacity-50">{saving === r.id ? 'Saving...' : '✓ Approve & Set Hike'}</button>}
                            </div>
                        ))}
                    </div>
                )}
                {managerDoneReviews.some(r => r.status === 'HR_APPROVED') && cycle?.status !== 'PUBLISHED' && (
                    <button onClick={handlePublish} disabled={publishing}
                        className="mt-5 w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                        <TrendingUp size={18} /> {publishing ? 'Publishing...' : 'Publish Results to All Employees'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Annual Summary ───────────────────────────────────────────────────────────
const AnnualSummary = ({ api }) => {
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    useEffect(() => { api.get(`/appraisal/annual?year=${year}`).then(r => setData(r.data)).catch(() => { }); }, [year]);
    if (!data) return null;
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><TrendingUp size={18} className="text-teal-400" />Annual Summary</h3>
                <select value={year} onChange={e => setYear(e.target.value)} className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            {data.annualAvgRating && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-teal-500/20 rounded-xl text-center">
                    <p className="text-white/50 text-sm">Annual Average Rating</p>
                    <p className="text-4xl font-bold text-white mt-1">{data.annualAvgRating?.toFixed(1)}<span className="text-white/30 text-xl">/5</span></p>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.quarters?.map(q => (
                    <div key={q.quarter} className={`p-3 rounded-xl border ${q.review?.status === 'PUBLISHED' ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                        <p className="text-white/50 text-xs font-bold uppercase">Q{q.quarter}</p>
                        {q.review ? (
                            <>
                                <StarRating value={q.review.managerRating || 0} readonly />
                                {q.review.salaryHike && <p className="text-green-400 text-xs mt-1">+{q.review.salaryHike}% hike</p>}
                                <Badge color={`mt-1 ${q.review.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>{q.review.status?.replace('_', ' ')}</Badge>
                            </>
                        ) : <p className="text-white/20 text-xs mt-1">Not started</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Appraisal = () => {
    const { user, api } = useAuth();
    const [cycle, setCycle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('self');

    const role = user?.LegacyRole || user?.role?.name;
    const roleType = user?.role?.type;
    // isOwner: set from login response OR via role type check
    const isActualOwner = user?.isOwner === true;
    const isPrivileged = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR'].includes(role) ||
        ['ADMINISTRATOR', 'EXECUTIVE', 'LEADERSHIP'].includes(roleType) ||
        isActualOwner;
    const isOwnerAdmin = ['ADMIN', 'OWNER'].includes(role) ||
        ['ADMINISTRATOR', 'EXECUTIVE'].includes(roleType) ||
        isActualOwner;
    const isHR = role === 'HR';
    const isManager = role === 'MANAGER' || ['LEADERSHIP', 'EXECUTIVE', 'ADMINISTRATOR'].includes(roleType) || isActualOwner;
    const [hasTeam, setHasTeam] = useState(false);

    const fetchCycle = async () => {
        try {
            // Check team membership via dedicated endpoint (works for any role)
            const [cycleRes, teamRes] = await Promise.all([
                api.get('/appraisal/current'),
                api.get('/appraisal/has-team').catch(() => ({ data: { hasTeam: false } }))
            ]);
            setCycle(cycleRes.data);
            setHasTeam(teamRes.data.hasTeam || isPrivileged);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCycle(); }, []);

    const tabs = [
        { id: 'self', label: '👤 My Appraisal', show: true },
        { id: 'annual', label: '📊 Annual View', show: true },
        { id: 'team', label: '👥 Team Review', show: hasTeam },
        { id: 'admin', label: '⚙️ Admin Console', show: isOwnerAdmin },
        { id: 'hr', label: '✅ HR Approval', show: isPrivileged },
    ].filter(t => t.show);

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">Appraisal Cycle</h1>
                    {cycle && (
                        <p className="text-white/40 text-sm mt-1">
                            {QUARTERS[(cycle.quarter || 1) - 1]} {cycle.year} •
                            <Badge color={`ml-2 ${phaseColor(cycle.phase)}`}>{cycle.phase?.replace(/_/g, ' ')}</Badge>
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {activeTab === 'self' && <EmployeePanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                        {activeTab === 'annual' && <AnnualSummary api={api} />}
                        {activeTab === 'team' && <ManagerPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                        {activeTab === 'admin' && <AdminPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                        {activeTab === 'hr' && <HRPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                    </motion.div>
                </AnimatePresence>
            )}
        </motion.div>
    );
};

export default Appraisal;
