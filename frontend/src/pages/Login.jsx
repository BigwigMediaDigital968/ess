import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState("EMPLOYEE");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const [orgBranding, setOrgBranding] = useState({ name: "BigwigESS", logoUrl: null });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await axios.get("http://localhost:3434/api/organization/public");
                if (res.data) {
                    setOrgBranding({
                        name: res.data.name || "BigwigESS",
                        logoUrl: res.data.logoUrl
                    });
                }
            } catch (err) {
                console.error("Failed to load branding");
            }
        };
        fetchBranding();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        try {
            await login(email, password, selectedRole);
            setLoginSuccess(true);
            // Wait for exit animation then navigate
            setTimeout(() => navigate("/"), 700);
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
            setIsLoggingIn(false);
        }
    };

    const logoSrc = orgBranding.logoUrl
        ? `http://localhost:3434${orgBranding.logoUrl}`
        : "/assets/images/logo.png";

    return (
        <div className="flex min-h-screen items-center justify-center bg-black overflow-hidden relative">
            {/* Background Video */}
            <video autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover z-0">
                <source src="/assets/videos/background.mp4" type="video/mp4" />
            </video>

            {/* Animated gradient overlay */}
            <motion.div
                className="absolute inset-0 z-0"
                animate={loginSuccess
                    ? { background: "radial-gradient(ellipse at center, rgba(139,92,246,0.6) 0%, rgba(0,0,0,0.95) 70%)" }
                    : { background: "rgba(0,0,0,0.6)" }
                }
                transition={{ duration: 0.6 }}
            />

            {/* Success ripple */}
            <AnimatePresence>
                {loginSuccess && (
                    <motion.div
                        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full border-2 border-purple-400"
                                initial={{ width: 0, height: 0, opacity: 0.8 }}
                                animate={{ width: 600, height: 600, opacity: 0 }}
                                transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Login Card */}
            <AnimatePresence>
                {!loginSuccess && (
                    <motion.div
                        key="login-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl"
                    >
                        {/* Logo & Branding */}
                        <motion.div
                            className="text-center mb-8 flex flex-col items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <motion.img
                                src={logoSrc}
                                alt="Logo"
                                className="w-32 h-auto object-contain mb-4 drop-shadow-lg"
                                onError={(e) => { e.target.src = "/assets/images/logo.png"; }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            />
                            <h1 className="text-4xl font-bold text-white tracking-tight">
                                {orgBranding.name === "BigwigESS" ? "Bigwig Media" : orgBranding.name}
                            </h1>
                            <p className="text-gray-300 mt-2 text-sm font-medium tracking-wide uppercase opacity-80">
                                Employee Self Service
                            </p>
                        </motion.div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {[
                                { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "you@company.com" },
                                { label: "Passcode / Password", type: "password", value: password, setter: setPassword, placeholder: "••••••••" }
                            ].map(({ label, type, value, setter, placeholder }, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={value}
                                        onChange={e => setter(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600 transition-all"
                                        placeholder={placeholder}
                                        required
                                    />
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-sm font-medium text-gray-400 mb-1">Login As</label>
                                <select
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-all appearance-none"
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(139,92,246,0.5)" }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all relative overflow-hidden"
                            >
                                {isLoggingIn ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <motion.span
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                                        />
                                        Signing In...
                                    </span>
                                ) : "Sign In"}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success state — centered checkmark */}
            <AnimatePresence>
                {loginSuccess && (
                    <motion.div
                        key="success"
                        className="relative z-20 flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-full bg-purple-500/30 border-2 border-purple-400 flex items-center justify-center"
                            animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 40px rgba(139,92,246,0.8)", "0 0 0px rgba(139,92,246,0)"] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                            <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <motion.path
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </svg>
                        </motion.div>
                        <motion.p
                            className="text-white text-xl font-bold"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Welcome back!
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
