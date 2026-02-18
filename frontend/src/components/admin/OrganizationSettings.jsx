import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../ui/Card";
import { Save, RefreshCw } from "lucide-react";

const OrganizationSettings = ({ onUpdate }) => {
    const { api, user } = useAuth();
    const [policy, setPolicy] = useState({ casualLeaves: 24, earnedLeaves: 20 });
    const [orgData, setOrgData] = useState({ name: "", address: "", latitude: "", longitude: "", logo: null });
    const [configAccess, setConfigAccess] = useState({ hr: false, director: false });
    const [holidays, setHolidays] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        fetchOrgDetails();
        fetchHolidays();
    }, [year]);

    const fetchOrgDetails = async () => {
        try {
            const res = await api.get("/organization");
            if (res.data) {
                setOrgData({
                    name: res.data.name,
                    address: res.data.address || "",
                    latitude: res.data.latitude || "",
                    longitude: res.data.longitude || "",
                    logo: null // Don't prefill file input
                });
                if (res.data.leavePolicy) {
                    setPolicy(res.data.leavePolicy);
                }
                setConfigAccess({
                    hr: res.data.configHrAccess || false,
                    director: res.data.configDirectorAccess || false
                });

                // Determine if current user is owner based on response match
                // We should ideally use a robust check, but ID match is good standard
                if (user?.id === res.data.ownerId) {
                    setIsOwner(true);
                }
            }
        } catch (err) {
            console.error("Failed to fetch org details");
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await api.get(`/holidays?year=${year}`);
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays");
        }
    };

    const handleSyncHolidays = async () => {
        try {
            await api.post("/holidays/sync", { year });
            alert("Holidays synchronized successfully");
            fetchHolidays();
        } catch (err) {
            alert("Failed to sync holidays: " + (err.response?.data?.message || err.message));
        }
    };

    const handleOrgUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", orgData.name);
        formData.append("address", orgData.address);
        formData.append("latitude", orgData.latitude);
        formData.append("longitude", orgData.longitude);
        formData.append("casualLeaves", policy.casualLeaves);
        formData.append("earnedLeaves", policy.earnedLeaves);

        if (isOwner) {
            formData.append("configHrAccess", configAccess.hr);
            formData.append("configDirectorAccess", configAccess.director);
        }

        if (orgData.logo) {
            formData.append("logo", orgData.logo);
        }

        try {
            await api.put("/organization", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("Organization settings updated successfully");
            fetchOrgDetails();
            if (onUpdate) onUpdate(); // Refresh global layout state
        } catch (err) {
            alert("Failed to update organization: " + (err.response?.data?.message || "Unknown error"));
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold text-white mb-4">Organization Details</h3>
                <form onSubmit={handleOrgUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-white/70 text-sm">Organization Name</label>
                            <input
                                value={orgData.name}
                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white/70 text-sm">Address</label>
                            <input
                                value={orgData.address}
                                onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                                className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white/70 text-sm">Latitude</label>
                            <input
                                type="text"
                                placeholder="Paste 'Lat, Long' here or type Latitude"
                                value={orgData.latitude}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.includes(',')) {
                                        const parts = val.split(',').map(s => s.trim());
                                        setOrgData({
                                            ...orgData,
                                            latitude: parts[0] || "",
                                            longitude: parts[1] || ""
                                        });
                                    } else {
                                        setOrgData({ ...orgData, latitude: val });
                                    }
                                }}
                                className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white/70 text-sm">Longitude</label>
                            <input
                                type="number" step="any"
                                value={orgData.longitude}
                                onChange={(e) => setOrgData({ ...orgData, longitude: e.target.value })}
                                className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white/70 text-sm">Organization Logo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setOrgData({ ...orgData, logo: e.target.files[0] })}
                                className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                            />
                        </div>
                    </div>

                    {isOwner && (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <h4 className="text-lg font-semibold text-white mb-2">Access Control</h4>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 text-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={configAccess.hr}
                                        onChange={(e) => setConfigAccess({ ...configAccess, hr: e.target.checked })}
                                        className="accent-purple-600 w-4 h-4"
                                    />
                                    Enable HR Access to Settings
                                </label>
                                <label className="flex items-center gap-2 text-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={configAccess.director}
                                        onChange={(e) => setConfigAccess({ ...configAccess, director: e.target.checked })}
                                        className="accent-purple-600 w-4 h-4"
                                    />
                                    Enable Director Access to Settings
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-white/10 pt-4 mt-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Leave Policy Defaults</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-white/70 text-sm">Casual Leaves (Annual)</label>
                                <input
                                    type="number"
                                    value={policy.casualLeaves}
                                    onChange={(e) => setPolicy({ ...policy, casualLeaves: e.target.value })}
                                    className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-white/70 text-sm">Earned Leaves (Annual)</label>
                                <input
                                    type="number"
                                    value={policy.earnedLeaves}
                                    onChange={(e) => setPolicy({ ...policy, earnedLeaves: e.target.value })}
                                    className="w-full p-2 mt-1 rounded bg-black/20 border border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded text-white font-bold hover:bg-purple-700">
                        <Save size={18} /> Save Settings
                    </button>
                </form>
            </Card>


            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Indian Holidays ({year})</h3>
                    <button
                        onClick={handleSyncHolidays}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-700 transition"
                    >
                        <RefreshCw size={16} /> Sync from Govt API
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {holidays.map(holiday => (
                        <div key={holiday.id} className="p-3 bg-white/5 rounded border border-white/5">
                            <div className="font-medium text-white">{holiday.name}</div>
                            <div className="text-sm text-white/60">
                                {new Date(holiday.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-purple-300 mt-1">{holiday.type}</div>
                        </div>
                    ))}
                    {holidays.length === 0 && (
                        <div className="col-span-full text-center text-white/50 py-4">
                            No holidays found. Click Sync to fetch.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default OrganizationSettings;
