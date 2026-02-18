import { useState, useEffect } from "react";
import api from "../utils/api";
import { Search, FileText, Mail, Phone, Briefcase } from "lucide-react";

const CandidateDatabase = () => {
    const [candidates, setCandidates] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await api.get("/talent/candidates");
            setCandidates(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // skills is a String[] array from the backend
    const getSkillsArray = (skills) => Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);

    const filteredCandidates = candidates.filter(c => {
        const skillsStr = getSkillsArray(c.skills).join(' ').toLowerCase();
        return (
            c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skillsStr.includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Candidate Database</h1>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-3.5 text-white/40" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, email, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-white focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map(c => (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{c.firstName} {c.lastName}</h3>
                                <p className="text-blue-400 text-sm font-medium">{c.experienceYears} Years Exp</p>
                            </div>
                            {c.resumeUrl && (
                                <a
                                    href={`http://localhost:3434${c.resumeUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 text-xs font-medium border border-blue-500/30 transition"
                                    title="Download Resume"
                                >
                                    <FileText size={14} /> Resume
                                </a>
                            )}
                        </div>

                        <div className="space-y-2 text-white/60 text-sm mb-4">
                            <div className="flex items-center gap-2">
                                <Mail size={16} /> {c.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} /> {c.phone || "N/A"}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {getSkillsArray(c.skills).slice(0, 5).map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 border border-white/5">
                                    {skill}
                                </span>
                            ))}
                            {getSkillsArray(c.skills).length > 5 && (
                                <span className="px-2 py-1 text-xs text-white/40">+{getSkillsArray(c.skills).length - 5} more</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filteredCandidates.length === 0 && (
                <div className="text-center text-white/40 py-12">No candidates found matching your search.</div>
            )}
        </div>
    );
};

export default CandidateDatabase;
