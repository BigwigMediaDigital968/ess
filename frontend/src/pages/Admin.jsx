import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import RoleManagement from "../components/admin/RoleManagement";
import OrganizationSettings from "../components/admin/OrganizationSettings";
import EmployeeManagement from "../components/admin/EmployeeManagement";
import DepartmentManagement from "../components/admin/DepartmentManagement";

const Admin = () => {
    const { user, api } = useAuth();
    const { fetchOrg } = useOutletContext() || {};
    const [activeTab, setActiveTab] = useState("employees");
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [canAccessSettings, setCanAccessSettings] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // isAdminUser: LegacyRole ADMIN or dynamic role type ADMINISTRATOR
                const legacyIsAdmin = user?.LegacyRole === 'ADMIN';
                const dynamicIsAdmin = user?.role?.type === 'ADMINISTRATOR';
                const adminUser = legacyIsAdmin || dynamicIsAdmin;
                setIsAdminUser(adminUser);

                const res = await api.get("/organization");
                if (res.data) {
                    const ownerMatch = res.data.ownerId === user?.id;
                    const isHR = user?.LegacyRole === 'HR' || user?.role?.name === 'HR';
                    const isDirector = user?.role?.name === 'Director';

                    // Can access org settings if owner, or HR/Director with config flags, or any admin
                    if (adminUser || ownerMatch || (isHR && res.data.configHrAccess) || (isDirector && res.data.configDirectorAccess)) {
                        setCanAccessSettings(true);
                    }
                }
            } catch (err) {
                console.error("Failed to check access status");
            }
        };
        if (user) checkAccess();
    }, [user, api]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-2">
                <button
                    onClick={() => setActiveTab("employees")}
                    className={`px-4 py-2 rounded-t-lg transition ${activeTab === "employees" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:text-white"}`}
                >
                    Employee Management
                </button>
                <button
                    onClick={() => setActiveTab("roles")}
                    className={`px-4 py-2 rounded-t-lg transition ${activeTab === "roles" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:text-white"}`}
                >
                    Roles & Bands
                </button>
                {/* Departments: visible to any admin-type user */}
                {isAdminUser && (
                    <button
                        onClick={() => setActiveTab("departments")}
                        className={`px-4 py-2 rounded-t-lg transition ${activeTab === "departments" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:text-white"}`}
                    >
                        Departments
                    </button>
                )}
                {/* Org Settings: gated to owner / HR with config / Director with config */}
                {canAccessSettings && (
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 rounded-t-lg transition ${activeTab === "settings" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:text-white"}`}
                    >
                        Organization &amp; Settings
                    </button>
                )}
            </div>

            <div className="mt-6">
                {activeTab === "employees" && <EmployeeManagement />}
                {activeTab === "roles" && <RoleManagement />}
                {activeTab === "departments" && isAdminUser && <DepartmentManagement />}
                {activeTab === "settings" && canAccessSettings && <OrganizationSettings onUpdate={fetchOrg} />}
            </div>
        </div>
    );
};

export default Admin;
