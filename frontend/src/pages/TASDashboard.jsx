import { useState, useEffect } from "react";
import api from "../utils/api";
import { Plus, Users, FileText, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TASDashboard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({ open: 0, applications: 0, interviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await api.get("/talent/jobs");
            setJobs(res.data);

            // Calculate Stats
            const open = res.data.filter(j => j.status === 'OPEN').length;
            const apps = res.data.reduce((acc, j) => acc + j.applications.length, 0);
            setStats({ open, applications: apps, interviews: 0 }); // Interviews need separate fetch or expanded include
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Talent Acquisition</h1>
                <button onClick={() => navigate('/talent/create-job')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <Plus size={18} /> Post New Job
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><BriefcaseIcon size={24} /></div>
                    <div>
                        <p className="text-white/60 text-sm">Open Jobs</p>
                        <h2 className="text-2xl font-bold text-white">{stats.open}</h2>
                    </div>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Users size={24} /></div>
                    <div>
                        <p className="text-white/60 text-sm">Total Applications</p>
                        <h2 className="text-2xl font-bold text-white">{stats.applications}</h2>
                    </div>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-400"><Clock size={24} /></div>
                    <div>
                        <p className="text-white/60 text-sm">Interviews Scheduled</p>
                        <h2 className="text-2xl font-bold text-white">-</h2>
                    </div>
                </div>
            </div>

            {/* Job List */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-xl font-semibold text-white">Active Job Postings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-white/60 text-sm bg-black/20">
                                <th className="p-4">Job Title</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Applications</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 text-white">
                                    <td className="p-4 font-medium">{job.title}</td>
                                    <td className="p-4">{job.department?.name || '-'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-white/10 rounded text-sm">{job.applications.length} Candidates</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${job.status === 'OPEN' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => navigate(`/talent/job/${job.id}`)} className="text-blue-400 hover:text-blue-300 text-sm">View Details</button>
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-white/40">No active job postings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const BriefcaseIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);

export default TASDashboard;
