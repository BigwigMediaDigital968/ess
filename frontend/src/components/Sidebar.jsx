import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Home, Users, Calendar, DollarSign, FileText, Settings, LogOut,
    Briefcase, MapPin, User, MessageCircle, UserPlus, BarChart2,
    Palette, Package, DoorOpen, ChevronDown,
    Ticket, AlertCircle, RefreshCcw, TrendingUp, Database,
    BookOpen, Shield, LayoutDashboard, ClipboardList,
    Clock, Building2
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
//  NavItem — single link
// ─────────────────────────────────────────────────────────────────────────────
const NavItem = ({ link, onClick }) => {
    const location = useLocation();
    const Icon = link.icon;
    const isActive = location.pathname === link.path ||
        (link.path !== "/" && location.pathname.startsWith(link.path) && link.path.length > 1);

    if (link.external) {
        return (
            <a href={link.path} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-gray-400 hover:text-white hover:bg-white/5">
                <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
                <span className="font-medium">{link.name}</span>
            </a>
        );
    }

    return (
        <Link to={link.path} onClick={onClick}
            className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 relative overflow-hidden group",
                isActive ? "bg-white/10 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            style={isActive ? { boxShadow: "0 4px 20px -5px rgba(var(--color-primary-rgb),0.3)" } : {}}
        >
            {isActive && (
                <motion.div layoutId="activeTab"
                    className="absolute inset-0 bg-white/5 rounded-xl" />
            )}
            <Icon className="w-4 h-4 shrink-0 transition-colors"
                style={{ color: isActive ? "var(--color-accent)" : "var(--text-secondary)" }} />
            <span className="font-medium relative z-10">{link.name}</span>
        </Link>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  NavGroup — animated collapsible drawer
// ─────────────────────────────────────────────────────────────────────────────
const NavGroup = ({ label, icon: Icon, color = "text-white/50", links, defaultOpen = false, onLinkClick }) => {
    const location = useLocation();
    const hasActive = links.some(l =>
        l.path === location.pathname || (l.path !== "/" && location.pathname.startsWith(l.path))
    );
    const [open, setOpen] = useState(defaultOpen || hasActive);

    return (
        <div className="space-y-0.5">
            {/* Group header */}
            <button
                onClick={() => setOpen(o => !o)}
                className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all",
                    "text-white/40 hover:text-white/70 hover:bg-white/5",
                    open && "text-white/60"
                )}
            >
                <Icon className={clsx("w-4 h-4 shrink-0", color)} />
                <span className="flex-1 text-left">{label}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </motion.div>
            </button>

            {/* Animated children */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="group-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden pl-2"
                    >
                        <div className="space-y-0.5 border-l border-white/10 pl-2 ml-3">
                            {links.map(link => (
                                <NavItem key={link.path} link={link} onClick={onLinkClick} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ open, setOpen, user, orgName, orgLogo }) => {
    const { logout } = useAuth();
    const close = () => setOpen(false);

    // ── Access flags ──────────────────────────────────────────────────────────
    const isPlatformOps = user?.department === "Platform Operations";
    const isOwner = user?.isOwner;
    const isAdmin = ["ADMIN", "OWNER"].includes(user?.LegacyRole) || user?.role?.type === "ADMINISTRATOR";
    const isHR = user?.LegacyRole === "HR" || user?.role?.name?.toUpperCase() === "HR";
    const isManager = user?.LegacyRole === "MANAGER" || user?.role?.name?.toUpperCase() === "MANAGER" || user?.role?.type === "LEADERSHIP";
    const isDirector = ["DIRECTOR"].includes(user?.LegacyRole) || ["LEADERSHIP", "EXECUTIVE"].includes(user?.role?.type);

    const isPrivileged = isOwner || isAdmin || isHR || isDirector;
    const canAccessTAS = isPrivileged || isManager;
    const canAccessSalary = isPrivileged && !isManager;
    const canAccessAssets = canAccessTAS || ["ASSETMGR"].includes(user?.role?.name?.toUpperCase());
    const canAccessOffices = isPrivileged;

    // Full SD admin access: Platform Operations dept (ANY role) OR Owner/Admin
    const isServiceDeskAdmin = isPlatformOps || isOwner || isAdmin;

    // ── Link groups ───────────────────────────────────────────────────────────

    const personalLinks = [
        { name: "Dashboard", path: "/", icon: Home },
        { name: "My Profile", path: "/profile", icon: User },
        { name: "Attendance", path: "/attendance", icon: Clock },
        { name: "My Roster", path: "/my-roster", icon: Calendar },
        { name: "My Salary Slips", path: "/salary-slips", icon: DollarSign },
    ];

    const communicationLinks = [
        { name: "Chat", path: "/chat", icon: MessageCircle },
        { name: "Directory", path: "/directory", icon: Users },
        { name: "Holidays", path: "/holidays", icon: Calendar },
        { name: "Documents", path: "http://localhost:8080", icon: FileText, external: true },
    ];

    const hrLinks = [
        ...(isHR || isAdmin || isOwner || isDirector ? [
            { name: "Leaves", path: "/leaves", icon: Calendar },
        ] : [
            { name: "Leaves", path: "/leaves", icon: Calendar },
        ]),
        // Appraisals for everyone
        { name: "Appraisal", path: "/appraisal", icon: ClipboardList },
        { name: "Offboarding", path: "/offboarding", icon: DoorOpen },
    ];

    const hrAdminLinks = [
        ...(isHR || isAdmin || isOwner ? [
            { name: "Admin Panel", path: "/admin", icon: Settings },
            { name: "Onboarding", path: "/onboarding", icon: UserPlus },
        ] : []),
        ...(canAccessTAS ? [
            { name: "Recruitment", path: "/talent", icon: Briefcase },
            { name: "Candidates", path: "/talent/candidates", icon: Users },
            { name: "Roster Mgmt", path: "/roster", icon: Calendar },
            { name: "Reports", path: "/reports", icon: BarChart2 },
        ] : []),
        ...(canAccessSalary ? [
            { name: "Salary Structure", path: "/salary", icon: DollarSign },
            { name: "Branding", path: "/branding", icon: Palette },
        ] : []),
        ...(canAccessOffices ? [
            { name: "Offices", path: "/offices", icon: MapPin },
        ] : []),
        ...(canAccessAssets ? [
            { name: "Asset Management", path: "/assets", icon: Package },
        ] : []),
    ];

    // Service Desk — everyone has at minimum Raise Ticket + View My Tickets
    const sdEmployeeLinks = [
        { name: "Raise Ticket", path: "/servicedesk", icon: Ticket },
    ];

    const sdAgentLinks = [
        { name: "SD Dashboard", path: "/servicedesk/dashboard", icon: LayoutDashboard },
        { name: "Incidents", path: "/servicedesk/incidents", icon: AlertCircle },
        { name: "Changes", path: "/servicedesk/changes", icon: RefreshCcw },
        { name: "Problems", path: "/servicedesk/problems", icon: TrendingUp },
        { name: "CMDB", path: "/servicedesk/cmdb", icon: Database },
        { name: "KEDB", path: "/servicedesk/kedb", icon: BookOpen },
        { name: "SLA Policies", path: "/servicedesk/sla", icon: Shield },
        { name: "SD Reports", path: "/servicedesk/reports", icon: BarChart2 },
        { name: "SD Admin", path: "/servicedesk/admin", icon: Settings },
    ];

    const sidebarVariants = {
        open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 28 } },
        closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 280, damping: 28 } },
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate={open ? "open" : (window.innerWidth >= 768 ? "open" : "closed")}
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 md:relative md:translate-x-0",
                    "bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col"
                )}
            >
                {/* Logo / Org name */}
                <div className="p-5 flex flex-col items-center border-b border-white/5 gap-2">
                    {orgLogo ? (
                        <img src={orgLogo} alt={orgName || "Logo"}
                            className="w-14 h-14 object-contain rounded-lg bg-white/5 p-1"
                            onError={e => { e.target.style.display = "none"; }}
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                            {orgName ? orgName.charAt(0).toUpperCase() : "B"}
                        </div>
                    )}
                    <h1 className="text-base font-bold bg-clip-text text-transparent text-center break-words w-full"
                        style={{ backgroundImage: "linear-gradient(to right, var(--color-accent), var(--color-primary))" }}>
                        {orgName}
                    </h1>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">

                    {/* ── Personal ── */}
                    <NavGroup
                        label="Personal"
                        icon={User}
                        color="text-blue-400"
                        links={personalLinks}
                        defaultOpen={true}
                        onLinkClick={close}
                    />

                    {/* ── Workspace ── */}
                    <NavGroup
                        label="Workspace"
                        icon={MessageCircle}
                        color="text-teal-400"
                        links={communicationLinks}
                        onLinkClick={close}
                    />

                    {/* ── People & HR ── */}
                    <NavGroup
                        label="People & HR"
                        icon={Users}
                        color="text-pink-400"
                        links={hrLinks}
                        onLinkClick={close}
                    />

                    {/* ── HR / Operations Admin ── only visible if has any links */}
                    {hrAdminLinks.length > 0 && (
                        <NavGroup
                            label="HR Management"
                            icon={Building2}
                            color="text-purple-400"
                            links={hrAdminLinks}
                            onLinkClick={close}
                        />
                    )}

                    {/* ── Service Desk ── */}
                    <NavGroup
                        label="Service Desk"
                        icon={Ticket}
                        color="text-orange-400"
                        links={isServiceDeskAdmin ? [...sdEmployeeLinks, ...sdAgentLinks] : sdEmployeeLinks}
                        onLinkClick={close}
                    />

                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/5">
                    <button onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
