import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Check, X, Clock } from "lucide-react";

const Leaves = () => {
    const { api, user } = useAuth();
    const [activeTab, setActiveTab] = useState("apply");
    const [leaves, setLeaves] = useState([]);
    const [pending, setPending] = useState([]);
    const [stats, setStats] = useState(null);

    // Form State
    const [type, setType] = useState("CASUAL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetchMyLeaves();
        fetchStats();
        if (user.role === 'MANAGER' || user.role === 'ADMIN') {
            fetchPendingLeaves();
        }
    }, [activeTab]);

    const fetchMyLeaves = async () => {
        try {
            const { data } = await api.get("/leaves/my");
            setLeaves(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get("/leaves/stats");
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPendingLeaves = async () => {
        try {
            const { data } = await api.get("/leaves/pending");
            setPending(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post("/leaves", { type, startDate, endDate, reason });
            alert("Leave applied successfully!");
            setReason("");
            setStartDate("");
            setEndDate("");
            fetchMyLeaves();
            fetchStats();
            setActiveTab("history");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to apply");
        }
    };

    const handleApproval = async (id, status) => {
        try {
            await api.put(`/leaves/${id}`, { status });
            fetchPendingLeaves();
        } catch (err) {
            alert("Action failed");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Leave Management</h2>

            {/* Stats Panel */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="relative overflow-hidden">
                        <h3 className="text-lg font-bold text-purple-400 mb-2">Casual Leave</h3>
                        <div className="flex justify-between text-white">
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Total</p>
                                <p className="text-2xl font-bold">{stats.casual.total}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Taken</p>
                                <p className="text-2xl font-bold">{stats.casual.taken}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Balance</p>
                                <p className={`text-2xl font-bold ${stats.casual.balance < 3 ? 'text-red-500' : 'text-green-400'}`}>
                                    {stats.casual.balance}
                                </p>
                            </div>
                        </div>
                        {stats.casual.balance < 3 && (
                            <div className="mt-2 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                                ⚠️ Low Balance!
                            </div>
                        )}
                    </Card>

                    <Card className="relative overflow-hidden">
                        <h3 className="text-lg font-bold text-blue-400 mb-2">Earned Leave</h3>
                        <div className="flex justify-between text-white">
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Total</p>
                                <p className="text-2xl font-bold">{stats.earned.total}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Taken</p>
                                <p className="text-2xl font-bold">{stats.earned.taken}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Balance</p>
                                <p className={`text-2xl font-bold ${stats.earned.balance < 3 ? 'text-red-500' : 'text-green-400'}`}>
                                    {stats.earned.balance}
                                </p>
                            </div>
                        </div>
                        {stats.earned.balance < 3 && (
                            <div className="mt-2 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                                ⚠️ Low Balance!
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <div className="flex space-x-4 border-b border-white/10 pb-2">
                <button onClick={() => setActiveTab("apply")} className={`pb-2 ${activeTab === "apply" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>Apply Leave</button>
                <button onClick={() => setActiveTab("history")} className={`pb-2 ${activeTab === "history" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>My History</button>
                {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
                    <button onClick={() => setActiveTab("approvals")} className={`pb-2 ${activeTab === "approvals" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>Approvals ({pending.length})</button>
                )}
            </div>

            {activeTab === "apply" && (
                <Card className="max-w-xl">
                    <form onSubmit={handleApply} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Leave Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-white">
                                <option value="CASUAL">Casual Leave</option>
                                <option value="SICK">Sick Leave</option>
                                <option value="EARNED">Earned Leave</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-1">From</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-white" required />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">To</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-white" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Reason</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-white/10 text-white" rows="3" required></textarea>
                        </div>
                        <button type="submit" className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white font-bold">Submit Request</button>
                    </form>
                </Card>
            )}

            {activeTab === "history" && (
                <div className="grid gap-4">
                    {leaves.map(leave => (
                        <Card key={leave.id} className="flex flex-col gap-4 bg-gradient-to-b from-white/5 to-transparent border border-white/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white uppercase tracking-wide">{leave.type} LEAVE</h4>
                                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                                        <Clock size={14} className="text-purple-400" />
                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                    </p>
                                    <div className="text-sm text-gray-300 mt-3 bg-black/40 p-3 rounded-lg border border-white/5">
                                        <span className="text-gray-500 block text-xs mb-1 uppercase tracking-wider font-semibold">Reason for Leave</span>
                                        {leave.reason}
                                    </div>
                                </div>
                            </div>

                            {/* Workflow Stepper */}
                            <div className="mt-2 pt-5 border-t border-white/10">
                                <h5 className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-wider">Approval Workflow</h5>
                                <div className="flex items-center justify-between relative px-4">
                                    {/* Line connecting steps */}
                                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-800 -z-10 rounded"></div>
                                    <div className={`absolute top-4 left-4 h-0.5 -z-10 rounded transition-all duration-1000 ease-in-out
                                        ${leave.status === 'APPROVED' ? 'w-[calc(100%-2rem)] bg-green-500' :
                                            leave.status === 'REJECTED' ? 'w-[calc(100%-2rem)] bg-red-500' : 'w-1/2 bg-purple-500'}`}></div>

                                    {/* Step 1: Applied */}
                                    <div className="flex flex-col items-center gap-3 bg-[var(--bg-surface)] px-2">
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                                            <Check size={16} />
                                        </div>
                                        <span className="text-xs text-gray-300 font-medium">Applied</span>
                                    </div>

                                    {/* Step 2: Manager Review */}
                                    <div className="flex flex-col items-center gap-3 bg-[var(--bg-surface)] px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                                            ${leave.status === 'PENDING' ? 'border-purple-500 text-purple-400 bg-purple-900/30' :
                                                leave.status === 'APPROVED' ? 'border-green-500 bg-green-500 text-white' :
                                                    'border-red-500 bg-red-500 text-white'}`}>
                                            {leave.status === 'PENDING' ? (
                                                <>
                                                    <div className="absolute inset-0 rounded-full border border-purple-500 animate-ping opacity-50"></div>
                                                    <Clock size={16} className="relative z-10" />
                                                </>
                                            ) : leave.status === 'APPROVED' ? <Check size={16} /> : <X size={16} />}
                                        </div>
                                        <div className="text-center">
                                            <span className={`text-xs font-medium block ${leave.status === 'PENDING' ? 'text-purple-400' : 'text-gray-300'}`}>
                                                Manager Review
                                            </span>
                                            <span className="text-[10px] text-gray-500 mt-0.5 block">
                                                {leave.user?.manager ? `with ${leave.user.manager.name}` : 'Auto / HR'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Step 3: Final Decision */}
                                    <div className="flex flex-col items-center gap-3 bg-[var(--bg-surface)] px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                            ${leave.status === 'PENDING' ? 'border-gray-700 text-gray-600 bg-gray-900' :
                                                leave.status === 'APPROVED' ? 'border-green-500 bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                                                    'border-red-500 bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}>
                                            {leave.status === 'APPROVED' ? <Check size={16} /> :
                                                leave.status === 'REJECTED' ? <X size={16} /> : <Clock size={16} />}
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${leave.status === 'APPROVED' ? 'text-green-400' :
                                                leave.status === 'REJECTED' ? 'text-red-400' : 'text-gray-600'
                                            }`}>
                                            {leave.status === 'PENDING' ? 'Decision' : leave.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === "approvals" && (
                <div className="grid gap-4">
                    {pending.length === 0 && <p className="text-gray-500">No pending approvals.</p>}
                    {pending.map(leave => (
                        <Card key={leave.id} className="flex justify-between items-center bg-white/10">
                            <div>
                                <h4 className="font-bold text-white">{leave.user.name} ({leave.type})</h4>
                                <p className="text-sm text-gray-400">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-300 italic">"{leave.reason}"</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApproval(leave.id, 'APPROVED')} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Check /></button>
                                <button onClick={() => handleApproval(leave.id, 'REJECTED')} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><X /></button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaves;
