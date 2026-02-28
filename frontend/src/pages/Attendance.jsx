import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { MapPin, Clock, Home, CheckCircle, XCircle, LogOut, Timer } from "lucide-react";
import { motion } from "framer-motion";

const Attendance = () => {
    const { api, user } = useAuth();
    const [location, setLocation] = useState(null);
    const [error, setError] = useState("");
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [wfhAddress, setWfhAddress] = useState("");
    const [activeTab, setActiveTab] = useState("mark");
    const [clockOutLoading, setClockOutLoading] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const { data } = await api.get("/attendance/my");
            setAttendance(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Derive today's attendance record
    const todayRecord = attendance.find(
        (r) => new Date(r.date).toDateString() === new Date().toDateString()
    );
    const isClockedIn = !!todayRecord && !todayRecord.clockOut;
    const isClockedOut = !!todayRecord && !!todayRecord.clockOut;

    const formatDuration = (start, end) => {
        const diffMs = new Date(end) - new Date(start);
        const totalMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const handleClockOut = async () => {
        try {
            setClockOutLoading(true);
            setError("");
            await api.put("/attendance/clockout");
            fetchAttendance();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to clock out");
        } finally {
            setClockOutLoading(false);
        }
    };

    const getLocation = async () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        // Insecure contexts (HTTP) will instantly fail geolocation in Chrome
        if (window.isSecureContext === false) {
            // Fallback for demo/testing without SSL
            try {
                setLoading(true);
                // Simple IP tracking fallback
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    setLocation({
                        latitude: data.latitude,
                        longitude: data.longitude,
                    });
                    setError("Using IP-based location (No HTTPS detected)");
                } else {
                    throw new Error("IP Geolocation failed");
                }
            } catch (fallbackErr) {
                // Absolute fallback - hardcoded reasonable coords for testing
                setLocation({ latitude: 28.6139, longitude: 77.2090 });
                setError("Using mock location for testing (HTTPS required for real GPS)");
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoading(false);
                setError("");
            },
            (err) => {
                console.error("Geolocation Error:", err);
                if (err.code === 1) {
                    setError("Location access denied by user. Please enable it in browser settings.");
                } else if (err.code === 2) {
                    setError("Location unavailable. Cannot determine position.");
                } else {
                    setError(`Unable to retrieve your location: ${err.message}`);
                }
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleClockIn = async (type) => {
        if (!location) {
            setError("Please get your location first");
            return;
        }

        try {
            setLoading(true);
            await api.post("/attendance/mark", {
                latitude: location.latitude,
                longitude: location.longitude,
                address: "Detected Location", // Ideally reverse geocode here
                type, // OFFICE or WFH
            });
            fetchAttendance();
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to mark attendance");
        } finally {
            setLoading(false);
        }
    };

    const handleWfhRequest = async (e) => {
        e.preventDefault();
        if (!location) {
            setError("Please get your location to register WFH spot");
            return;
        }
        try {
            await api.post("/wfh", {
                latitude: location.latitude,
                longitude: location.longitude,
                address: wfhAddress
            });
            alert("WFH Location requested successfully!");
            setWfhAddress("");
        } catch (err) {
            setError(err.response?.data?.message);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Attendance Management</h2>

            <div className="flex space-x-4 border-b border-white/10 pb-2">
                <button onClick={() => setActiveTab("mark")} className={`pb-2 ${activeTab === "mark" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>Mark Attendance</button>
                <button onClick={() => setActiveTab("history")} className={`pb-2 ${activeTab === "history" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>History</button>
                <button onClick={() => setActiveTab("wfh")} className={`pb-2 ${activeTab === "wfh" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}>WFH Setup</button>
            </div>

            {activeTab === "mark" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                        <div className="p-4 bg-blue-500/20 rounded-full animate-pulse">
                            <MapPin className="w-12 h-12 text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400">Current Location</p>
                            {location ? (
                                <p className="text-white font-mono text-sm mt-1">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm mt-1">Not detected</p>
                            )}
                        </div>

                        <button
                            onClick={getLocation}
                            disabled={loading}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            {loading ? "Detecting..." : "Detect Location"}
                        </button>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <div className="flex gap-4 w-full px-8">
                            <button
                                onClick={() => handleClockIn("OFFICE")}
                                disabled={!location || loading || isClockedIn || isClockedOut}
                                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white shadow-lg disabled:opacity-50"
                            >
                                Office Check-In
                            </button>
                            <button
                                onClick={() => handleClockIn("WFH")}
                                disabled={!location || loading || isClockedIn || isClockedOut}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold text-white shadow-lg disabled:opacity-50"
                            >
                                WFH Check-In
                            </button>
                        </div>

                        {isClockedIn && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full px-8"
                            >
                                <button
                                    onClick={handleClockOut}
                                    disabled={clockOutLoading}
                                    className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {clockOutLoading ? "Clocking Out..." : "Clock Out"}
                                </button>
                            </motion.div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-white mb-4">Today's Status</h3>
                        {todayRecord ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-green-400">
                                    <CheckCircle />
                                    <div>
                                        <p className="font-medium">Clocked In</p>
                                        <p className="text-sm text-gray-400">{new Date(todayRecord.clockIn).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                {isClockedOut ? (
                                    <>
                                        <div className="flex items-center gap-3 text-red-400">
                                            <LogOut />
                                            <div>
                                                <p className="font-medium">Clocked Out</p>
                                                <p className="text-sm text-gray-400">{new Date(todayRecord.clockOut).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-purple-400">
                                            <Timer />
                                            <div>
                                                <p className="font-medium">Duration</p>
                                                <p className="text-sm text-gray-400">{formatDuration(todayRecord.clockIn, todayRecord.clockOut)}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 text-yellow-400 animate-pulse">
                                        <Clock />
                                        <p className="font-medium">Currently Working...</p>
                                    </div>
                                )}

                                <p className="text-gray-400 text-sm pl-9">Type: <span className="px-2 py-0.5 rounded bg-white/10 text-xs">{todayRecord.type}</span></p>
                                {todayRecord.status && (
                                    <p className="text-gray-400 text-sm pl-9">Status: <span className={`px-2 py-0.5 rounded text-xs ${todayRecord.status === 'LATE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{todayRecord.status}</span></p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <Clock className="w-10 h-10 mb-2 opacity-50" />
                                <p>You haven't checked in today</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === "wfh" && (
                <Card className="max-w-md">
                    <h3 className="text-xl font-bold text-white mb-4">Request WFH Location</h3>
                    <p className="text-gray-400 text-sm mb-4">Get approval for your home location to enable WFH check-ins.</p>
                    <form onSubmit={handleWfhRequest} className="space-y-4">
                        <button type="button" onClick={getLocation} className="text-blue-400 text-sm hover:underline">
                            Use Current Location ({location ? 'Set' : 'Not Set'})
                        </button>
                        <input
                            type="text"
                            placeholder="Home Address"
                            value={wfhAddress}
                            onChange={(e) => setWfhAddress(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                        />
                        <button type="submit" className="w-full py-2 bg-purple-600 rounded-lg text-white">
                            Submit Request
                        </button>
                    </form>
                </Card>
            )}

            {activeTab === "history" && (
                <Card>
                    <table className="w-full text-left text-gray-400">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-2">Date</th>
                                <th className="p-2">In</th>
                                <th className="p-2">Out</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((record) => (
                                <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-2 text-white">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="p-2">{new Date(record.clockIn).toLocaleTimeString()}</td>
                                    <td className="p-2">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</td>
                                    <td className="p-2"><span className="px-2 py-1 rounded bg-white/10 text-xs">{record.type}</span></td>
                                    <td className="p-2 text-green-400">{record.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

export default Attendance;
