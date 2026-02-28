import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CheckCircle, XCircle, Calendar, Send } from "lucide-react";

const OfficeVisitApprovals = () => {
    const { api, user } = useAuth();
    const [myRequests, setMyRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ targetOfficeId: "", date: "" });

    const isManager = ['HR', 'ADMIN', 'OWNER', 'DIRECTOR', 'MANAGER'].includes(user?.LegacyRole) ||
        ['ADMINISTRATOR', 'LEADERSHIP'].includes(user?.role?.type) ||
        user?.isOwner;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [myRes, offRes] = await Promise.all([
                api.get('/office-visits/my-requests'),
                api.get('/offices')
            ]);
            setMyRequests(myRes.data);
            setOffices(offRes.data);

            if (isManager) {
                const pendRes = await api.get('/office-visits/pending');
                setPendingRequests(pendRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post('/office-visits', formData);
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit request.");
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.put(`/office-visits/${id}/status`, { status });
            setPendingRequests(prev => prev.filter(r => r.id !== id));
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">Office Branch Visits</h2>
                    <p className="text-gray-400">Request permission to check-in at a different branch.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20"
                >
                    <Send size={18} /> Ask Permission
                </button>
            </div>

            {isManager && pendingRequests.length > 0 && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="text-yellow-400" /> Pending Transfers Approvals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRequests.map(req => (
                            <motion.div key={req.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                                <div>
                                    <p className="font-bold text-white">{req.user.name}</p>
                                    <p className="text-sm text-gray-400 mb-1">{req.user.email}</p>
                                    <div className="bg-purple-500/10 text-purple-300 p-2 rounded-lg text-sm mt-3 inline-block">
                                        Wants to visit: <span className="font-bold">{req.targetOffice?.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Calendar size={12} /> {new Date(req.date).toDateString()}</p>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                    <button onClick={() => handleAction(req.id, 'APPROVED')} className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition font-bold flex items-center justify-center gap-1"><CheckCircle size={16} /> Approve</button>
                                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition font-bold flex items-center justify-center gap-1"><XCircle size={16} /> Deny</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-xl font-bold text-white mb-4">My Requests History</h3>
                <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10 text-gray-400">
                            <tr>
                                <th className="p-4 rounded-tl-xl">Requested Branch</th>
                                <th className="p-4">Date of Visit</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {myRequests.map(req => (
                                <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="p-4 font-bold text-white">{req.targetOffice?.name}</td>
                                    <td className="p-4">{new Date(req.date).toDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {myRequests.length === 0 && (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No requests filed.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                            <h3 className="text-2xl font-bold text-white mb-6">New Visit Request</h3>
                            <form onSubmit={handleApply} className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Target Branch</label>
                                    <select required value={formData.targetOfficeId} onChange={e => setFormData({ ...formData, targetOfficeId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="" className="bg-gray-900">Select Branch...</option>
                                        {offices.map(o => (
                                            <option key={o.id} value={o.id} className="bg-gray-900">{o.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Date Placeholder</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 rounded-xl text-gray-400 hover:text-white transition">Cancel</button>
                                    <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg">Submit Request</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OfficeVisitApprovals;
