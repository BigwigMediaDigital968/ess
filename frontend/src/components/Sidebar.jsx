import { Link, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import {
    Home, Users, Calendar, DollarSign, FileText, Settings, LogOut, Briefcase, MapPin, User, MessageCircle, UserPlus, BarChart2, Palette
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ open, setOpen, user, orgName = "BigwigESS", orgLogo }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: "Dashboard", path: "/", icon: Home },
        { name: "My Profile", path: "/profile", icon: User },
        { name: "Attendance", path: "/attendance", icon: MapPin },
        { name: "Leaves", path: "/leaves", icon: Calendar },
        { name: "Directory", path: "/directory", icon: Users },
        { name: "Appraisal", path: "/appraisal", icon: Briefcase },
        { name: "Documents", path: "http://localhost:8080", icon: FileText, external: true },
        { name: "Chat", path: "/chat", icon: MessageCircle },
        { name: "Holidays", path: "/holidays", icon: Calendar },
        { name: "My Roster", path: "/my-roster", icon: Calendar },
        { name: "My Salary Slips", path: "/salary-slips", icon: DollarSign },
    ];

    if (user?.role === 'ADMIN' || user?.LegacyRole === 'ADMIN' || user?.role?.name === 'Admin' || user?.role?.type === 'ADMINISTRATOR' || user?.isOwner) {
        links.push({ name: "Admin Panel", path: "/admin", icon: Settings });
        links.push({ name: "Onboarding", path: "/onboarding", icon: UserPlus });
    }

    // Show TAS links for: HR, Admin, Manager, Owner (legacy) OR ADMINISTRATOR/LEADERSHIP role types (Director)
    const canAccessTAS = (
        ['HR', 'ADMIN', 'MANAGER'].includes(user?.LegacyRole) ||
        user?.isOwner ||
        ['ADMINISTRATOR', 'LEADERSHIP'].includes(user?.role?.type) ||
        ['HR', 'ADMIN', 'MANAGER'].includes(user?.role?.name?.toUpperCase())
    );

    // Salary visible only to HR, Admin, Director, Owner — NOT Manager
    const isManager = user?.role?.name?.toUpperCase() === 'MANAGER' || user?.LegacyRole === 'MANAGER';
    const canAccessSalary = !isManager && (
        ['HR', 'ADMIN'].includes(user?.LegacyRole) ||
        user?.isOwner ||
        ['ADMINISTRATOR', 'LEADERSHIP'].includes(user?.role?.type) ||
        ['HR', 'ADMIN', 'DIRECTOR', 'OWNER'].includes(user?.role?.name?.toUpperCase())
    );

    if (canAccessTAS) {
        links.push({ name: "Recruitment", path: "/talent", icon: Briefcase });
        links.push({ name: "Candidates", path: "/talent/candidates", icon: Users });
        links.push({ name: "Roster Management", path: "/roster", icon: Calendar });
        links.push({ name: "Reports", path: "/reports", icon: BarChart2 });
    }
    if (canAccessSalary) {
        links.push({ name: "Salary Structure", path: "/salary", icon: DollarSign });
        links.push({ name: "Branding", path: "/branding", icon: Palette });
    }

    const sidebarVariants = {
        open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate={open ? "open" : (window.innerWidth >= 768 ? "open" : "closed")}
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out",
                    "bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col"
                )}
            >
                <div className="p-6 flex flex-col items-center justify-center border-b border-white/5 gap-3">
                    {orgLogo && (
                        <img
                            src={orgLogo}
                            alt="Org Logo"
                            className="w-16 h-16 object-contain rounded-lg bg-white/5 p-1"
                        />
                    )}
                    <h1 className="text-xl font-bold bg-clip-text text-transparent text-center break-words w-full"
                        style={{ backgroundImage: 'linear-gradient(to right, var(--color-accent), var(--color-primary))' }}>
                        {orgName}
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;

                        if (link.external) {
                            return (
                                <a
                                    key={link.path}
                                    href={link.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden text-gray-400 hover:text-white hover:bg-white/5"
                                >
                                    <Icon className="w-5 h-5 transition-colors" style={{ color: 'var(--text-secondary)' }} />
                                    <span className="font-medium relative z-10">{link.name}</span>
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-white/10 text-white border border-white/10 shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                                style={isActive ? { boxShadow: '0 4px 20px -5px rgba(var(--color-primary-rgb), 0.3)' } : {}}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/5 rounded-xl"
                                    />
                                )}
                                <Icon className={clsx("w-5 h-5 transition-colors")}
                                    style={{ color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)' }}
                                />
                                <span className="font-medium relative z-10">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
