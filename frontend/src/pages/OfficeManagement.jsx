import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { MapPin, Plus, Edit2, Trash2, Crosshair } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OfficeManagement = () => {
    const { api } = useAuth();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingOffice, setEditingOffice] = useState(null);
    const [formData, setFormData] = useState({
        name: "", address: "", latitude: "", longitude: "", radius: 200
    });

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/offices");
            setOffices(data);
        } catch (err) {
            setError("Failed to fetch offices");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingOffice) {
                await api.put(`/offices/${editingOffice.id}`, formData);
            } else {
                await api.post("/offices", formData);
            }
            setShowModal(false);
            fetchOffices();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save office");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this office?")) return;
        try {
            await api.delete(`/offices/${id}`);
            fetchOffices();
        } catch (err) {
            alert(err.response?.data?.message || "Cannot delete office in use.");
        }
    };

    const detectLocation = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        if (window.isSecureContext === false) {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    setFormData({ ...formData, latitude: data.latitude, longitude: data.longitude });
                    alert("Using IP-based location (No HTTPS detected)");
                } else {
                    throw new Error("IP fetch failed");
                }
            } catch (err) {
                setFormData({ ...formData, latitude: 28.6139, longitude: 77.2090 });
                alert("Using mock location (HTTPS required for real GPS)");
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => setFormData({ ...formData, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => alert("Could not fetch location automatically.")
        );
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text');
        const match = paste.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
        if (match) {
            e.preventDefault();
            setFormData(prev => ({
                ...prev,
                latitude: match[1],
                longitude: match[2]
            }));
        }
    };


    const openModal = (office = null) => {
        if (office) {
            setEditingOffice(office);
            setFormData({
                name: office.name, address: office.address,
                latitude: office.latitude, longitude: office.longitude, radius: office.radius
            });
        } else {
            setEditingOffice(null);
            setFormData({ name: "", address: "", latitude: "", longitude: "", radius: 200 });
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">Office Branches</h2>
                    <p className="text-gray-400">Manage physical locations and attendance geofences.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flexItems-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/20"
                >
                    <Plus size={18} /> Add Office
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offices.map((office) => (
                        <motion.div
                            key={office.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black/20 border border-white/10 rounded-2xl p-6 group hover:border-purple-500/30 transition-all shadow-xl backdrop-blur-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <MapPin className="text-purple-400 w-6 h-6" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(office)} className="p-2 bg-white/5 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(office.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{office.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 h-10">{office.address || "No address provided"}</p>

                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                                    <span className="text-gray-500">Geofence (Radius)</span>
                                    <span className="font-mono">{office.radius} m</span>
                                </div>
                                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                                    <span className="text-gray-500">GPS Coords</span>
                                    <span className="font-mono text-xs text-blue-300">{office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between mt-4 border-t border-white/5 pt-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Employees</p>
                                        <p className="text-lg font-bold text-white">{office._count?.users || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Assets</p>
                                        <p className="text-lg font-bold text-white">{office._count?.assets || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl">
                            <h3 className="text-2xl font-bold text-white mb-6">{editingOffice ? 'Edit Office' : 'New Office Branch'}</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Branch Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. London HQ" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Street Address</label>
                                    <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" rows="2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Latitude</label>
                                        <input required type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} onPaste={handlePaste} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Longitude</label>
                                        <input required type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} onPaste={handlePaste} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={detectLocation} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                                        <Crosshair size={16} /> Auto-Detect Current GPS
                                    </button>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Allowed Check-in Radius (Meters)</label>
                                    <input required type="number" value={formData.radius} onChange={e => setFormData({ ...formData, radius: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                                    <p className="text-xs text-gray-500 mt-1">Default 200m. Employees outside this circle will be blocked from checking in.</p>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white transition">Cancel</button>
                                    <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg">{editingOffice ? 'Save Changes' : 'Create Branch'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OfficeManagement;
