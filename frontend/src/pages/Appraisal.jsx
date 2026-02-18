import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Star, CheckCircle, Clock, ChevronDown, ChevronUp, Users, TrendingUp, Award, Send, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const QUARTERS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
const STATUS_COLORS = {
    OPEN: 'bg-blue-500/20 text-blue-300',
    SELF_ASSESSMENT: 'bg-yellow-500/20 text-yellow-300',
    MANAGER_REVIEW: 'bg-purple-500/20 text-purple-300',
    HR_REVIEW: 'bg-orange-500/20 text-orange-300',
    PUBLISHED: 'bg-green-500/20 text-green-300',
    PENDING: 'bg-white/10 text-white/50',
    SELF_DONE: 'bg-yellow-500/20 text-yellow-300',
    MANAGER_DONE: 'bg-purple-500/20 text-purple-300',
    HR_APPROVED: 'bg-teal-500/20 text-teal-300',
};

const GOAL_STATUS_COLORS = {
    PENDING: 'bg-white/10 text-white/50',
    ACHIEVED: 'bg-green-500/20 text-green-300',
    PARTIAL: 'bg-yellow-500/20 text-yellow-300',
    MISSED: 'bg-red-500/20 text-red-300',
};

const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" onClick={() => !readonly && onChange?.(s)}
                className={`text-2xl transition ${readonly ? 'cursor-default' : 'hover:scale-110'} ${s <= value ? 'text-yellow-400' : 'text-white/20'}`}>
                ★
            </button>
        ))}
        {value > 0 && <span className="text-white/50 text-sm ml-1 self-center">{value}/5</span>}
    </div>
);

// ─── Employee Self-Assessment Panel ──────────────────────────────────────────
const SelfAssessmentPanel = ({ cycle, api, onRefresh }) => {
    const myReview = cycle?.reviews?.[0];
    const myGoals = cycle?.goals || [];
    const [selfRating, setSelfRating] = useState(myReview?.selfRating || 0);
    const [selfComment, setSelfComment] = useState(myReview?.selfComment || '');
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = cycle?.status === 'OPEN' || cycle?.status === 'SELF_ASSESSMENT';
    const alreadySubmitted = myReview?.status === 'SELF_DONE' || myReview?.status === 'MANAGER_DONE' || myReview?.status === 'HR_APPROVED' || myReview?.status === 'PUBLISHED';

    const handleSubmit = async () => {
        if (!selfRating) return alert('Please give a rating');
        setSubmitting(true);
        try {
            await api.post('/appraisal/self-assessment', {
                cycleId: cycle.id,
                selfRating,
                selfComment
            });
            onRefresh();
        } catch (e) {
            alert('Failed to submit self-assessment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Goals */}
            {myGoals.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Target size={18} className="text-purple-400" /> My Goals for {QUARTERS[(cycle.quarter || 1) - 1]}
                    </h3>
                    <div className="space-y-3">
                        {myGoals.map(g => (
                            <div key={g.id} className="flex items-start justify-between gap-4 p-3 bg-white/5 rounded-xl">
                                <div className="flex-1">
                                    <p className="text-white font-medium">{g.title}</p>
                                    {g.description && <p className="text-white/50 text-sm mt-0.5">{g.description}</p>}
                                    <p className="text-white/30 text-xs mt-1">Weight: {g.weight}%</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${GOAL_STATUS_COLORS[g.status] || ''}`}>
                                    {g.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Self Assessment Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Star size={18} className="text-yellow-400" /> Self Assessment
                </h3>

                {alreadySubmitted && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> Self-assessment submitted. Awaiting manager review.
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Your Rating</label>
                        <StarRating value={selfRating} onChange={setSelfRating} readonly={alreadySubmitted} />
                    </div>
                    <div>
                        <label className="text-white/60 text-sm mb-2 block">Comments & Achievements</label>
                        <textarea
                            value={selfComment}
                            onChange={e => setSelfComment(e.target.value)}
                            disabled={alreadySubmitted}
                            rows={4}
                            placeholder="Describe your key achievements, challenges, and areas of improvement..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
                        />
                    </div>
                    {!alreadySubmitted && canSubmit && (
                        <button onClick={handleSubmit} disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 text-sm font-medium disabled:opacity-50">
                            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Self-Assessment'}
                        </button>
                    )}
                </div>

                {/* Published result */}
                {myReview?.status === 'PUBLISHED' && (
                    <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider">📊 Published Results</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-purple-500/10 rounded-xl p-3 text-center">
                                <p className="text-white/50 text-xs">Your Rating</p>
                                <StarRating value={myReview.selfRating || 0} readonly />
                            </div>
                            <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                                <p className="text-white/50 text-xs">Manager Rating</p>
                                <StarRating value={myReview.managerRating || 0} readonly />
                            </div>
                            {myReview.finalRating && (
                                <div className="bg-teal-500/10 rounded-xl p-3 text-center">
                                    <p className="text-white/50 text-xs">Annual Rating</p>
                                    <p className="text-teal-400 text-2xl font-bold">{myReview.finalRating}/5</p>
                                </div>
                            )}
                            {myReview.salaryHike && (
                                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                                    <p className="text-white/50 text-xs">Salary Hike</p>
                                    <p className="text-green-400 text-2xl font-bold">{myReview.salaryHike}%</p>
                                    {myReview.hikeAmount && <p className="text-green-300 text-xs">+₹{myReview.hikeAmount?.toLocaleString('en-IN')}/mo</p>}
                                </div>
                            )}
                        </div>
                        {myReview.managerComment && (
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/40 text-xs mb-1">Manager's Feedback</p>
                                <p className="text-white/80 text-sm italic">"{myReview.managerComment}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Manager Panel ────────────────────────────────────────────────────────────
const ManagerPanel = ({ cycle, api, onRefresh }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [goals, setGoals] = useState([{ title: '', description: '', weight: 100 }]);
    const [managerRating, setManagerRating] = useState(0);
    const [managerComment, setManagerComment] = useState('');
    const [submittingGoals, setSubmittingGoals] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    const teamReviews = cycle?.reviews || [];
    const teamGoals = cycle?.goals || [];

    // Group goals by user
    const goalsByUser = {};
    teamGoals.forEach(g => {
        if (!goalsByUser[g.userId]) goalsByUser[g.userId] = [];
        goalsByUser[g.userId].push(g);
    });

    const handleSetGoals = async (userId) => {
        setSubmittingGoals(true);
        try {
            await api.post('/appraisal/goals', {
                cycleId: cycle.id,
                userId,
                goals: goals.filter(g => g.title.trim())
            });
            setGoals([{ title: '', description: '', weight: 100 }]);
            onRefresh();
        } catch (e) {
            alert('Failed to set goals: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmittingGoals(false);
        }
    };

    const handleManagerReview = async (reviewId) => {
        setSubmittingReview(true);
        try {
            await api.post('/appraisal/manager-review', {
                reviewId,
                managerRating,
                managerComment,
                managerApproved: true
            });
            setManagerRating(0);
            setManagerComment('');
            onRefresh();
        } catch (e) {
            alert('Failed to submit review: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmittingReview(false);
        }
    };

    // Get unique team members from reviews + goals
    const teamMembers = [...new Map([
        ...teamReviews.map(r => [r.userId, r.user]),
        ...teamGoals.map(g => [g.userId, g.user])
    ]).entries()].map(([id, user]) => ({ id, ...user }));

    return (
        <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Users size={18} className="text-blue-400" /> Team Members — {QUARTERS[(cycle?.quarter || 1) - 1]}
                </h3>

                {teamMembers.length === 0 && (
                    <p className="text-white/30 text-sm">No team members found. Ensure employees have you set as their manager.</p>
                )}

                <div className="space-y-3">
                    {teamMembers.map(member => {
                        const review = teamReviews.find(r => r.userId === member.id);
                        const memberGoals = goalsByUser[member.id] || [];
                        const isExpanded = selectedEmployee === member.id;

                        return (
                            <motion.div key={member.id} className="border border-white/10 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setSelectedEmployee(isExpanded ? null : member.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                                            {member.name?.[0]}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium">{member.name}</p>
                                            <p className="text-white/40 text-xs">{member.designation} • {member.department?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {review && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[review.status] || ''}`}>
                                                {review.status?.replace('_', ' ')}
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/10 p-4 space-y-4 overflow-hidden"
                                        >
                                            {/* Set Goals */}
                                            <div>
                                                <h4 className="text-white/70 text-sm font-bold mb-3 uppercase tracking-wider">
                                                    {memberGoals.length > 0 ? '✏️ Update Goals' : '🎯 Set Goals'}
                                                </h4>
                                                {memberGoals.length > 0 && (
                                                    <div className="mb-3 space-y-1">
                                                        {memberGoals.map(g => (
                                                            <div key={g.id} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-lg">
                                                                <span className="text-white/80">{g.title}</span>
                                                                <span className={`px-2 py-0.5 rounded text-xs ${GOAL_STATUS_COLORS[g.status]}`}>{g.status}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {goals.map((g, i) => (
                                                    <div key={i} className="flex gap-2 mb-2">
                                                        <input
                                                            value={g.title}
                                                            onChange={e => setGoals(prev => prev.map((p, pi) => pi === i ? { ...p, title: e.target.value } : p))}
                                                            placeholder={`Goal ${i + 1}`}
                                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={g.weight}
                                                            onChange={e => setGoals(prev => prev.map((p, pi) => pi === i ? { ...p, weight: parseFloat(e.target.value) } : p))}
                                                            placeholder="Weight%"
                                                            className="w-20 bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                        />
                                                        {goals.length > 1 && (
                                                            <button onClick={() => setGoals(prev => prev.filter((_, pi) => pi !== i))}
                                                                className="text-red-400 hover:text-red-300 px-2">✕</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => setGoals(prev => [...prev, { title: '', description: '', weight: 0 }])}
                                                        className="text-purple-400 text-sm hover:text-purple-300">+ Add Goal</button>
                                                    <button onClick={() => handleSetGoals(member.id)} disabled={submittingGoals}
                                                        className="ml-auto px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-50">
                                                        {submittingGoals ? 'Saving...' : 'Save Goals'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Manager Review */}
                                            {review?.status === 'SELF_DONE' && (
                                                <div className="border-t border-white/10 pt-4">
                                                    <h4 className="text-white/70 text-sm font-bold mb-3 uppercase tracking-wider">⭐ Manager Review</h4>
                                                    <div className="bg-white/5 rounded-xl p-3 mb-3">
                                                        <p className="text-white/40 text-xs mb-1">Employee's Self-Rating</p>
                                                        <StarRating value={review.selfRating || 0} readonly />
                                                        {review.selfComment && <p className="text-white/60 text-sm mt-2 italic">"{review.selfComment}"</p>}
                                                    </div>
                                                    <StarRating value={managerRating} onChange={setManagerRating} />
                                                    <textarea
                                                        value={managerComment}
                                                        onChange={e => setManagerComment(e.target.value)}
                                                        rows={3}
                                                        placeholder="Manager's feedback..."
                                                        className="w-full mt-3 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                                                    />
                                                    <button onClick={() => handleManagerReview(review.id)} disabled={submittingReview || !managerRating}
                                                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 disabled:opacity-50">
                                                        {submittingReview ? 'Submitting...' : 'Submit & Approve'}
                                                    </button>
                                                </div>
                                            )}

                                            {review?.status === 'MANAGER_DONE' && (
                                                <div className="border-t border-white/10 pt-4">
                                                    <p className="text-green-400 text-sm flex items-center gap-2">
                                                        <CheckCircle size={14} /> Review submitted. Awaiting HR approval.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
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

    const handleSaveHike = async (reviewId) => {
        const d = hikeData[reviewId] || {};
        setSaving(reviewId);
        try {
            await api.post('/appraisal/hr-approve', {
                reviewId,
                salaryHike: parseFloat(d.salaryHike) || 0,
                hikeAmount: parseFloat(d.hikeAmount) || 0,
                hrApproved: true
            });
            onRefresh();
        } catch (e) {
            alert('Failed to approve');
        } finally {
            setSaving(null);
        }
    };

    const handlePublish = async () => {
        if (!confirm('Publish all approved reviews? This will notify employees.')) return;
        setPublishing(true);
        try {
            await api.post(`/appraisal/publish/${cycle.id}`);
            onRefresh();
        } catch (e) {
            alert('Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Cycle Status Control */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Award size={18} className="text-orange-400" /> HR Review & Publish
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[cycle?.status] || ''}`}>
                        {cycle?.status}
                    </span>
                </div>

                {/* Status progression */}
                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
                    {['OPEN', 'SELF_ASSESSMENT', 'MANAGER_REVIEW', 'HR_REVIEW', 'PUBLISHED'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => cycle?.status !== 'PUBLISHED' && api.put(`/appraisal/cycles/${cycle.id}/status`, { status: s }).then(onRefresh)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${cycle?.status === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                            {i < 4 && <span className="text-white/20">→</span>}
                        </div>
                    ))}
                </div>

                {/* Reviews list */}
                {managerDoneReviews.length === 0 ? (
                    <p className="text-white/30 text-sm">No reviews ready for HR approval yet.</p>
                ) : (
                    <div className="space-y-3">
                        {managerDoneReviews.map(r => (
                            <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="text-white font-medium">{r.user?.name}</p>
                                        <p className="text-white/40 text-xs">{r.user?.designation} • {r.user?.department?.name}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${STATUS_COLORS[r.status]}`}>
                                        {r.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <p className="text-white/40 text-xs mb-1">Self Rating</p>
                                        <StarRating value={r.selfRating || 0} readonly />
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs mb-1">Manager Rating</p>
                                        <StarRating value={r.managerRating || 0} readonly />
                                    </div>
                                </div>

                                {r.status !== 'HR_APPROVED' && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Hike % *</label>
                                            <input
                                                type="number"
                                                value={hikeData[r.id]?.salaryHike || ''}
                                                onChange={e => setHikeData(prev => ({ ...prev, [r.id]: { ...prev[r.id], salaryHike: e.target.value } }))}
                                                placeholder="e.g. 15"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Hike Amount (₹/mo)</label>
                                            <input
                                                type="number"
                                                value={hikeData[r.id]?.hikeAmount || ''}
                                                onChange={e => setHikeData(prev => ({ ...prev, [r.id]: { ...prev[r.id], hikeAmount: e.target.value } }))}
                                                placeholder="e.g. 8000"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {r.status === 'HR_APPROVED' ? (
                                    <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                                        <CheckCircle size={14} /> Approved — Hike: {r.salaryHike}% (₹{r.hikeAmount?.toLocaleString('en-IN')}/mo)
                                    </div>
                                ) : (
                                    <button onClick={() => handleSaveHike(r.id)} disabled={saving === r.id}
                                        className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-500 disabled:opacity-50">
                                        {saving === r.id ? 'Saving...' : '✓ Approve & Set Hike'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Publish button */}
                {managerDoneReviews.some(r => r.status === 'HR_APPROVED') && cycle?.status !== 'PUBLISHED' && (
                    <button onClick={handlePublish} disabled={publishing}
                        className="mt-5 w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:from-green-500 hover:to-teal-500 disabled:opacity-50 flex items-center justify-center gap-2">
                        <TrendingUp size={18} /> {publishing ? 'Publishing...' : 'Publish Results to All Employees'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Annual Summary ───────────────────────────────────────────────────────────
const AnnualSummary = ({ api, user }) => {
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        api.get(`/appraisal/annual?year=${year}`)
            .then(r => setData(r.data))
            .catch(() => { });
    }, [year, api]);

    if (!data) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-teal-400" /> Annual Summary
                </h3>
                <select value={year} onChange={e => setYear(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none">
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
                {data.quarters.map(q => (
                    <div key={q.quarter} className={`p-3 rounded-xl border ${q.review?.status === 'PUBLISHED' ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                        <p className="text-white/50 text-xs font-bold uppercase">Q{q.quarter}</p>
                        {q.review ? (
                            <>
                                <StarRating value={q.review.managerRating || 0} readonly />
                                {q.review.salaryHike && <p className="text-green-400 text-xs mt-1">+{q.review.salaryHike}% hike</p>}
                                <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLORS[q.review.status]}`}>
                                    {q.review.status?.replace('_', ' ')}
                                </span>
                            </>
                        ) : (
                            <p className="text-white/20 text-xs mt-1">Not started</p>
                        )}
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
    const isPrivileged = ['HR', 'ADMIN', 'OWNER'].includes(role) || user?.isOwner;
    const isManager = role === 'MANAGER' || user?.role?.type === 'LEADERSHIP';

    const fetchCycle = async () => {
        try {
            const { data } = await api.get('/appraisal/current');
            setCycle(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCycle(); }, []);

    const tabs = [
        { id: 'self', label: 'My Appraisal', show: true },
        { id: 'annual', label: 'Annual View', show: true },
        { id: 'team', label: 'Team Review', show: isManager || isPrivileged },
        { id: 'hr', label: 'HR Approval', show: isPrivileged },
    ].filter(t => t.show);

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">
                        Appraisal Cycle
                    </h1>
                    {cycle && (
                        <p className="text-white/40 text-sm mt-1">
                            {QUARTERS[(cycle.quarter || 1) - 1]} {cycle.year} •
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[cycle.status]}`}>
                                {cycle.status?.replace('_', ' ')}
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
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
                        {activeTab === 'self' && <SelfAssessmentPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                        {activeTab === 'annual' && <AnnualSummary api={api} user={user} />}
                        {activeTab === 'team' && <ManagerPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                        {activeTab === 'hr' && <HRPanel cycle={cycle} api={api} onRefresh={fetchCycle} />}
                    </motion.div>
                </AnimatePresence>
            )}
        </motion.div>
    );
};

export default Appraisal;
