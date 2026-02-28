import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../utils/config";
import {
    Palette, Sun, Moon, Monitor, Upload, Save, Image, RefreshCw,
    Building2, MapPin, Mail, Globe, FileText, AlertCircle, CheckCircle2
} from "lucide-react";

const PRESETS = [
    { name: "Royal Purple", primary: "#a855f7", accent: "#ec4899" },
    { name: "Ocean Blue", primary: "#3b82f6", accent: "#06b6d4" },
    { name: "Forest Green", primary: "#10b981", accent: "#84cc16" },
    { name: "Sunset Orange", primary: "#f97316", accent: "#ef4444" },
    { name: "Midnight Indigo", primary: "#6366f1", accent: "#8b5cf6" },
    { name: "Corporate Teal", primary: "#14b8a6", accent: "#0ea5e9" },
];

// Indian GST number format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, error, hint }) => (
    <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {label}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full py-2.5 rounded-xl border text-sm transition-colors focus:outline-none"
                style={{
                    paddingLeft: Icon ? '2.25rem' : '0.75rem',
                    paddingRight: '0.75rem',
                    background: 'var(--bg-base)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                }}
            />
        </div>
        {error && <p className="text-xs mt-1 text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        {hint && !error && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
);

const BrandingSettings = () => {
    const { user, api } = useAuth();
    const { branding, refreshBranding, switchTheme, themeMode, logoSrc, loginBgSrc } = useTheme();
    const [form, setForm] = useState({
        primaryColor: "#a855f7",
        accentColor: "#ec4899",
        themeMode: "dark",
        loginBgType: "gradient",
        // Org info
        address: "",
        latitude: "",
        longitude: "",
        contactEmail: "",
        website: "",
        gstNumber: "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [bgFile, setBgFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bgPreview, setBgPreview] = useState(null);
    const logoRef = useRef(null);
    const bgRef = useRef(null);

    useEffect(() => {
        if (branding) {
            setForm({
                primaryColor: branding.primaryColor || "#a855f7",
                accentColor: branding.accentColor || "#ec4899",
                themeMode: branding.themeMode || "dark",
                loginBgType: branding.loginBgType || "gradient",
                address: branding.address || "",
                latitude: branding.latitude != null ? String(branding.latitude) : "",
                longitude: branding.longitude != null ? String(branding.longitude) : "",
                contactEmail: branding.contactEmail || "",
                website: branding.website || "",
                gstNumber: branding.gstNumber || "",
            });
        }
    }, [branding]);

    const handleLogoChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
    };

    const handleBgChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setBgFile(f);
        setBgPreview(URL.createObjectURL(f));
    };

    const validate = () => {
        const newErrors = {};
        if (form.gstNumber && !GST_REGEX.test(form.gstNumber.toUpperCase())) {
            newErrors.gstNumber = "Invalid GST number format (e.g. 27AAPFU0939F1ZV)";
        }
        if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
            newErrors.contactEmail = "Invalid email address";
        }
        if (form.latitude && (isNaN(Number(form.latitude)) || Math.abs(Number(form.latitude)) > 90)) {
            newErrors.latitude = "Latitude must be between -90 and 90";
        }
        if (form.longitude && (isNaN(Number(form.longitude)) || Math.abs(Number(form.longitude)) > 180)) {
            newErrors.longitude = "Longitude must be between -180 and 180";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        setSaved(false);
        try {
            const fd = new FormData();
            // Branding fields
            fd.append("primaryColor", form.primaryColor);
            fd.append("accentColor", form.accentColor);
            fd.append("themeMode", form.themeMode);
            fd.append("loginBgType", form.loginBgType);
            // Org info fields
            fd.append("address", form.address);
            if (form.latitude) fd.append("latitude", form.latitude);
            if (form.longitude) fd.append("longitude", form.longitude);
            fd.append("contactEmail", form.contactEmail);
            fd.append("website", form.website);
            fd.append("gstNumber", form.gstNumber.toUpperCase());
            // Logo
            if (logoFile) fd.append("logo", logoFile);

            await api.put("/organization", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Upload login background separately if provided
            if (bgFile) {
                const bgFd = new FormData();
                bgFd.append("loginBackground", bgFile);
                await api.post("/organization/login-background", bgFd, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            await refreshBranding();
            setSaved(true);
            setLogoFile(null);
            setBgFile(null);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to save branding settings");
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = (preset) => {
        setForm(f => ({ ...f, primaryColor: preset.primary, accentColor: preset.accent }));
    };

    const themeModes = [
        { value: "dark", label: "Dark", icon: Moon },
        { value: "light", label: "Light", icon: Sun },
        { value: "system", label: "System", icon: Monitor },
    ];

    const sectionStyle = {
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)'
    };

    return (
        <div className="min-h-screen p-6 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <Palette className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                    Organization Branding
                </h1>
                <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
                    Customize branding, contact info, and organization identity — set once, applies everywhere
                </p>
            </div>

            {/* ────── Organization Info ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    Organization Info
                </h2>
                <div className="space-y-4">
                    <InputField
                        label="Address"
                        icon={MapPin}
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="123 Business Park, City, State - 400001"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                            label="Latitude"
                            type="number"
                            value={form.latitude}
                            onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                            placeholder="e.g. 18.5204"
                            error={errors.latitude}
                            hint="Used for location-based features"
                        />
                        <InputField
                            label="Longitude"
                            type="number"
                            value={form.longitude}
                            onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                            placeholder="e.g. 73.8567"
                            error={errors.longitude}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                            label="Contact Email"
                            icon={Mail}
                            type="email"
                            value={form.contactEmail}
                            onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                            placeholder="hr@company.com"
                            error={errors.contactEmail}
                        />
                        <InputField
                            label="Website"
                            icon={Globe}
                            type="url"
                            value={form.website}
                            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                            placeholder="https://www.company.com"
                        />
                    </div>
                    <div>
                        <InputField
                            label="GST Number"
                            icon={FileText}
                            value={form.gstNumber}
                            onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
                            placeholder="27AAPFU0939F1ZV"
                            error={errors.gstNumber}
                            hint="15-character Indian GST Registration Number"
                        />
                        {form.gstNumber && !errors.gstNumber && GST_REGEX.test(form.gstNumber) && (
                            <p className="text-xs mt-1 flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" /> Valid GST number
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ────── Color Presets ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Palette className="w-5 h-5" /> Color Presets
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PRESETS.map(p => (
                        <button key={p.name} onClick={() => applyPreset(p)}
                            className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                            style={{
                                borderColor: form.primaryColor === p.primary ? p.primary : 'var(--border-color)',
                                background: form.primaryColor === p.primary ? `${p.primary}15` : 'transparent'
                            }}>
                            <div className="flex gap-1">
                                <div className="w-6 h-6 rounded-full" style={{ background: p.primary }} />
                                <div className="w-6 h-6 rounded-full" style={{ background: p.accent }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ────── Custom Colors ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Custom Colors
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Primary Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={form.primaryColor}
                                onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={form.primaryColor}
                                onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-sm font-mono border"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Accent Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={form.accentColor}
                                onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={form.accentColor}
                                onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-sm font-mono border"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        </div>
                    </div>
                </div>
                {/* Live preview bar */}
                <div className="mt-4 h-3 rounded-full overflow-hidden flex">
                    <div className="flex-1" style={{ background: form.primaryColor }} />
                    <div className="flex-1" style={{ background: form.accentColor }} />
                    <div className="flex-1" style={{ background: `linear-gradient(90deg, ${form.primaryColor}, ${form.accentColor})` }} />
                </div>
            </section>

            {/* ────── Theme Mode ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Application Theme
                </h2>
                <div className="flex gap-4">
                    {themeModes.map(m => {
                        const Icon = m.icon;
                        const active = form.themeMode === m.value;
                        return (
                            <button key={m.value} onClick={() => {
                                setForm(f => ({ ...f, themeMode: m.value }));
                                switchTheme(m.value);
                            }}
                                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                                style={{
                                    borderColor: active ? form.primaryColor : 'var(--border-color)',
                                    background: active ? `${form.primaryColor}15` : 'transparent',
                                }}>
                                <Icon className="w-6 h-6" style={{ color: active ? form.primaryColor : 'var(--text-muted)' }} />
                                <span className="text-sm font-medium" style={{ color: active ? form.primaryColor : 'var(--text-secondary)' }}>{m.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ────── Logo Upload ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Organization Logo
                </h2>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl border flex items-center justify-center overflow-hidden"
                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                        {(logoPreview || logoSrc) ? (
                            <img src={logoPreview || logoSrc} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <Image className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        )}
                    </div>
                    <div>
                        <button onClick={() => logoRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                            <Upload className="w-4 h-4" /> Upload Logo
                        </button>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>PNG, JPG, or SVG. Max 2MB.</p>
                        {logoFile && <p className="text-xs mt-1 text-green-400">✓ {logoFile.name} ready to upload</p>}
                        <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </div>
                </div>
            </section>

            {/* ────── Login Background ────── */}
            <section className="rounded-2xl p-6 border" style={sectionStyle}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Login Page Background
                </h2>
                <div className="flex gap-3 mb-4">
                    {["gradient", "image", "video"].map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, loginBgType: t }))}
                            className="px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-all"
                            style={{
                                borderColor: form.loginBgType === t ? form.primaryColor : 'var(--border-color)',
                                background: form.loginBgType === t ? `${form.primaryColor}15` : 'transparent',
                                color: form.loginBgType === t ? form.primaryColor : 'var(--text-secondary)'
                            }}>
                            {t}
                        </button>
                    ))}
                </div>

                {form.loginBgType !== "gradient" && (
                    <div className="flex items-center gap-6">
                        <div className="w-48 h-28 rounded-xl border overflow-hidden flex items-center justify-center"
                            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                            {(bgPreview || loginBgSrc) ? (
                                form.loginBgType === "video" ? (
                                    <video src={bgPreview || loginBgSrc} className="w-full h-full object-cover" muted autoPlay loop />
                                ) : (
                                    <img src={bgPreview || loginBgSrc} alt="Login BG" className="w-full h-full object-cover" />
                                )
                            ) : (
                                <Image className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                            )}
                        </div>
                        <div>
                            <button onClick={() => bgRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                <Upload className="w-4 h-4" /> Upload {form.loginBgType === "video" ? "Video" : "Image"}
                            </button>
                            {bgFile && <p className="text-xs mt-1 text-green-400">✓ {bgFile.name} ready to upload</p>}
                            <input ref={bgRef} type="file" className="hidden"
                                accept={form.loginBgType === "video" ? "video/*" : "image/*"} onChange={handleBgChange} />
                        </div>
                    </div>
                )}

                {form.loginBgType === "gradient" && (
                    <div className="h-28 rounded-xl overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${form.primaryColor}40, ${form.accentColor}40, ${form.primaryColor}20)` }}>
                        <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                            <span className="text-sm font-medium">Gradient Preview (uses your brand colors)</span>
                        </div>
                    </div>
                )}
            </section>

            {/* ────── Save Button ────── */}
            <div className="flex items-center gap-4">
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})` }}>
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "Saving..." : "Save Branding & Info"}
                </button>
                {saved && (
                    <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#10b981' }}>
                        <CheckCircle2 className="w-4 h-4" /> Settings saved! Applied across all pages.
                    </span>
                )}
            </div>
        </div>
    );
};

export default BrandingSettings;
