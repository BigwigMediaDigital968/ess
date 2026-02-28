import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import VirtualIDCard from "../components/VirtualIDCard";
import { User, Mail, Briefcase, MapPin, Droplet, Camera, Upload, Award } from "lucide-react";

const Profile = () => {
    const { user, api, login } = useAuth(); // Need login (or a way to refresh user)
    const [orgData, setOrgData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await api.get("/organization/public");
                setOrgData(res.data);

                try {
                    const resAuth = await api.get("/organization");
                    setOrgData(resAuth.data);
                } catch (e) { /* ignore */ }

            } catch (err) {
                console.error("Failed to fetch org data");
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [api]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profilePicture", file);

        setUploading(true);
        try {
            // Update profile (which handles profilePicture upload)
            const { data: updatedUser } = await api.put("/employees/profile", formData);

            // Reload to update context
            window.location.reload();
        } catch (error) {
            console.error("Failed to upload profile picture", error);
            alert("Failed to upload profile picture.");
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div className="text-white">Loading...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4">
            {/* Left: Profile Details */}
            <div className="flex-1 space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-8 relative z-10">
                        {orgData?.logoUrl && (
                            <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                                <img
                                    src={`${API_BASE_URL}${orgData.logoUrl}`}
                                    alt="Org Logo"
                                    className="w-24 h-24 object-contain"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img
                                src={user.profilePictureUrl ? `${API_BASE_URL}${user.profilePictureUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                className="w-24 h-24 rounded-full border-4 border-purple-500/50 object-cover transition-opacity group-hover:opacity-75"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8 drop-shadow-md" />
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                            <p className="text-purple-300 font-medium text-lg flex items-center gap-2">
                                <Briefcase size={18} /> {user.designation || "Employee"}
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 text-xs flex items-center gap-1 text-gray-400 hover:text-white transition"
                            >
                                <Upload size={12} /> Change Photo
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                <Mail size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Email</span>
                            </div>
                            <p className="text-white font-medium truncate">{user.email}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                <User size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Role</span>
                            </div>
                            <p className="text-white font-medium">{user.role?.name || user.role || "Employee"}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                <Droplet size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Blood Group</span>
                            </div>
                            <p className="text-white font-medium">{user.bloodGroup || "Not Set"}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                <MapPin size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Address</span>
                            </div>
                            <p className="text-white font-medium text-sm">{user.address || "Not Set"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: ID Card */}
            <div className="flex flex-col items-center justify-start gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        Your Digital ID
                    </h3>
                    <VirtualIDCard user={user} organization={orgData} />
                </div>

                {user.certifications && user.certifications.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl w-full">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Award className="text-yellow-400" size={20} /> Certifications
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {user.certifications.map((cert) => (
                                <div key={cert.id} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 hover:bg-white/20 transition-colors" title={cert.name}>
                                    {cert.imageUrl ? (
                                        <img src={`${API_BASE_URL}${cert.imageUrl}`} alt={cert.name} className="w-10 h-10 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
                                            <Award size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white font-medium text-sm">{cert.name}</p>
                                        <p className="text-gray-400 text-xs">{cert.issuingOrg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
