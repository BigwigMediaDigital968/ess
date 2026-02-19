import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../utils/config";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWidget from "./ChatWidget";
import { Menu } from "lucide-react";
import { useState } from "react";

const Layout = () => {
    const { user, loading } = useAuth();
    const { logoSrc, orgName } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="flex h-screen text-white overflow-hidden transition-colors duration-500"
            style={{
                background: 'radial-gradient(circle at top left, var(--bg-base) 0%, #000 100%)'
            }}>

            {/* Background Accent Blurs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30 pointer-events-none"
                style={{ background: 'var(--color-primary)' }} />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ background: 'var(--color-accent)' }} />

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} orgLogo={logoSrc} orgName={orgName} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300 z-10">

                {/* Header (Mobile Toggle) - Visible only on mobile */}
                <header className="p-4 flex items-center justify-between md:hidden z-10 glass m-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1">
                            <Menu className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                        </button>
                        <div className="flex items-center gap-2">
                            {logoSrc && <img src={logoSrc} alt="Logo" className="h-6 w-6 object-contain" />}
                            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{orgName}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Glass Container for pages */}
                    {/* We remove the heavy background on the main container to let the global theme shine through, 
                        or we can keep a subtle surface overlay */}
                    <div className="absolute inset-0 -z-10 m-2 md:m-4 rounded-3xl border shadow-2xl backdrop-blur-3xl transition-colors duration-500"
                        style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border-color)'
                        }}
                    ></div>
                    <Outlet />
                </main>

                {/* Floating Chat Widget */}
                <ChatWidget />
            </div>
        </div>
    );
};

export default Layout;
