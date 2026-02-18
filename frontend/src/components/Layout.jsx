import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWidget from "./ChatWidget";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

const Layout = () => {
    const { user, loading, api } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [orgLogo, setOrgLogo] = useState(null);
    const [orgName, setOrgName] = useState("BigwigESS");

    const fetchOrg = async () => {
        try {
            // Ensure api is available
            if (api) {
                const res = await api.get("/organization");
                if (res.data) {
                    if (res.data.logoUrl) setOrgLogo(res.data.logoUrl);
                    if (res.data.name) setOrgName(res.data.name);
                }
            }
        } catch (e) {
            console.log("Failed to fetch Org info", e);
        }
    };

    useEffect(() => {
        if (user && api) {
            fetchOrg();
        }
    }, [user, api]);

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white overflow-hidden">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} orgLogo={orgLogo} orgName={orgName} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">

                {/* Header (Mobile Toggle) - Visible only on mobile */}
                <header className="p-4 flex items-center justify-between md:hidden z-10 glass m-2 rounded-xl">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            {orgLogo && <img src={`http://localhost:3434${orgLogo}?t=${new Date().getTime()}`} alt="Logo" className="h-6 w-6 object-contain rounded" />}
                            <span className="font-bold text-lg">{orgName}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl -z-10 rounded-3xl m-2 md:m-4 border border-white/10 shadow-2xl"></div>
                    <Outlet context={{ fetchOrg }} />
                </main>

                {/* Floating Chat Widget */}
                <ChatWidget />
            </div>
        </div>
    );
};

export default Layout;
