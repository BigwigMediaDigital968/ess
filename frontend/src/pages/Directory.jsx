import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Search, Mail, Phone, MapPin, X, Network, Grid, User, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Users } from "lucide-react";

const OrgNode = ({ node, depth = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                layout
                className={`flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors w-64 ${depth === 0 ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : ''}`}
            >
                <div className="relative">
                    <img
                        src={node.profilePictureUrl ? `${API_BASE_URL}${node.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${node.name}&background=random`}
                        alt={node.name}
                        className="w-12 h-12 rounded-full border-2 border-purple-400 mb-2"
                    />
                    {hasChildren && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="absolute -bottom-2 -right-2 p-1 bg-gray-800 rounded-full border border-gray-600 hover:bg-gray-700 text-white"
                        >
                            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                    )}
                </div>
                <h4 className="font-bold text-white">{node.name}</h4>
                <p className="text-purple-300 text-xs">{node.designation}</p>
            </motion.div>

            {hasChildren && expanded && (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                    <div className="w-px h-6 bg-white/20"></div>
                    <div className="flex gap-4 relative">
                        {/* Connecting lines logic is complex for flex, simple approach: horizontal bar */}
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-10 right-10 h-px bg-white/20" />
                        )}
                        {node.children.map((child) => (
                            <div key={child.id} className="flex flex-col items-center">
                                <div className="w-px h-6 bg-white/20"></div>
                                <OrgNode node={child} depth={depth + 1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Directory = () => {
    const { api } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // grid | tree
    const [orgData, setOrgData] = useState(null);

    useEffect(() => {
        fetchEmployees();
        fetchOrg();
    }, []);

    const fetchOrg = async () => {
        try {
            const res = await api.get("/organization/public");
            setOrgData(res.data);
        } catch (e) { /* ignore */ }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get("/employees");
            setEmployees(data);
        } catch (err) {
            console.error(err);
        }
    };

    const buildTree = (emps) => {
        const map = {};
        const roots = [];
        // Init map
        emps.forEach(e => map[e.id] = { ...e, children: [] });
        // Connect
        emps.forEach(e => {
            if (e.managerId && map[e.managerId]) {
                map[e.managerId].children.push(map[e.id]);
            } else {
                roots.push(map[e.id]);
            }
        });
        return roots;
    };

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const treeData = buildTree(filtered);

    return (
        <div className="space-y-6 relative min-h-screen">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {orgData?.logoUrl && (
                        <img src={`${API_BASE_URL}${orgData.logoUrl}`} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-white/5 p-1" />
                    )}
                    <h2 className="text-3xl font-bold text-white">Employee Directory</h2>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("tree")}
                            className={`p-2 rounded-md transition ${viewMode === "tree" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            <Network size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map((emp) => (
                        <motion.div
                            key={emp.id}
                            whileHover={{ scale: 1.05 }}
                            layoutId={`card-${emp.id}`}
                            onClick={() => setSelectedEmp(emp)}
                            className="cursor-pointer"
                        >
                            <Card className="flex flex-col items-center text-center p-6 hover:bg-white/10 transition-colors">
                                <img
                                    src={emp.profilePictureUrl ? `${API_BASE_URL}${emp.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${emp.name}&background=random`}
                                    alt={emp.name}
                                    className="w-20 h-20 rounded-full mb-4 border-2 border-purple-500/50"
                                />
                                <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                                <p className="text-purple-300 text-sm">{emp.designation || 'Employee'}</p>
                                <p className="text-gray-500 text-xs mt-1">{emp.department?.name || 'No Dept'}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto pb-10">
                    <div className="min-w-max flex justify-center p-4">
                        {treeData.map(root => (
                            <OrgNode key={root.id} node={root} />
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Glass Modal */}
            <AnimatePresence>
                {selectedEmp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEmp(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            layoutId={`card-${selectedEmp.id}`}
                            className="fixed inset-0 m-auto w-full max-w-lg h-fit z-50 pointer-events-none flex items-center justify-center p-4"
                        >
                            <div className="bg-gray-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl relative w-full pointer-events-auto">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedEmp(null); }}
                                    className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center mb-6 relative">
                                    {orgData?.logoUrl && (
                                        <img src={`${API_BASE_URL}${orgData.logoUrl}`} alt="Logo" className="absolute top-0 right-0 h-8 w-8 object-contain opacity-40" />
                                    )}
                                    <img
                                        src={selectedEmp.profilePictureUrl ? `${API_BASE_URL}${selectedEmp.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${selectedEmp.name}&background=random`}
                                        alt={selectedEmp.name}
                                        className="w-32 h-32 rounded-full mb-4 border-4 border-purple-500/50 shadow-lg shadow-purple-500/20"
                                    />
                                    <h2 className="text-3xl font-bold text-white">{selectedEmp.name}</h2>
                                    <p className="text-xl text-purple-300">{selectedEmp.designation}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 text-gray-300">
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <Mail className="text-purple-400" />
                                        <span>{selectedEmp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <Briefcase className="text-blue-400" />
                                        <span>{selectedEmp.department?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <Users className="text-pink-400" />
                                        <span>Manager: {selectedEmp.manager?.name || 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Directory;
