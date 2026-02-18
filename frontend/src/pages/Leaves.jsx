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
                        <Card key={leave.id} className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-white">{leave.type}</h4>
                                <p className="text-sm text-gray-400">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">{leave.reason}</p>
                            </div>
                            <div className={`px-3 py-1 rounded text-sm ${leave.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : leave.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {leave.status}
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
