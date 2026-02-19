import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { API_BASE_URL } from "../utils/config";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Derive CSS custom properties from org branding
function applyThemeVars(branding, resolvedMode) {
    const root = document.documentElement;
    const isDark = resolvedMode === 'dark';

    // Primary & accent colors (hex → used directly)
    const primary = branding?.primaryColor || '#a855f7';
    const accent = branding?.accentColor || '#ec4899';

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-primary-rgb', hexToRgb(primary));
    root.style.setProperty('--color-accent-rgb', hexToRgb(accent));

    if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.setProperty('--bg-base', '#0a0a1a');
        root.style.setProperty('--bg-surface', 'rgba(255,255,255,0.05)');
        root.style.setProperty('--bg-surface-hover', 'rgba(255,255,255,0.08)');
        root.style.setProperty('--border-color', 'rgba(255,255,255,0.1)');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#9ca3af');
        root.style.setProperty('--text-muted', '#6b7280');
    } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.setProperty('--bg-base', '#f8fafc');
        root.style.setProperty('--bg-surface', 'rgba(0,0,0,0.03)');
        root.style.setProperty('--bg-surface-hover', 'rgba(0,0,0,0.06)');
        root.style.setProperty('--border-color', 'rgba(0,0,0,0.1)');
        root.style.setProperty('--text-primary', '#1e293b');
        root.style.setProperty('--text-secondary', '#475569');
        root.style.setProperty('--text-muted', '#94a3b8');
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '168,85,247';
}

function resolveMode(mode) {
    if (mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode || 'dark';
}

export const ThemeProvider = ({ children }) => {
    const [branding, setBranding] = useState(null);
    const [themeMode, setThemeMode] = useState('dark'); // org default
    const [resolvedMode, setResolvedMode] = useState('dark');
    const [loaded, setLoaded] = useState(false);

    // Fetch org branding on mount (public endpoint, no auth needed)
    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await api.get('/organization/public');
                setBranding(res.data);
                const mode = res.data?.themeMode || 'dark';
                setThemeMode(mode);
                const resolved = resolveMode(mode);
                setResolvedMode(resolved);
                applyThemeVars(res.data, resolved);
            } catch (e) {
                applyThemeVars(null, 'dark');
            } finally {
                setLoaded(true);
            }
        };
        fetchBranding();
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        if (themeMode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedMode(resolved);
            applyThemeVars(branding, resolved);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [themeMode, branding]);

    const switchTheme = useCallback((mode) => {
        setThemeMode(mode);
        const resolved = resolveMode(mode);
        setResolvedMode(resolved);
        applyThemeVars(branding, resolved);
    }, [branding]);

    const refreshBranding = useCallback(async () => {
        try {
            const res = await api.get('/organization/public');
            setBranding(res.data);
            const mode = res.data?.themeMode || 'dark';
            setThemeMode(mode);
            const resolved = resolveMode(mode);
            setResolvedMode(resolved);
            applyThemeVars(res.data, resolved);
        } catch (e) { /* ignore */ }
    }, []);

    const value = {
        branding,
        themeMode,
        resolvedMode,
        switchTheme,
        refreshBranding,
        loaded,
        logoSrc: branding?.logoUrl ? `${API_BASE_URL}${branding.logoUrl}` : null,
        orgName: branding?.name || 'ESS Portal',
        loginBgSrc: branding?.loginBgUrl ? `${API_BASE_URL}${branding.loginBgUrl}` : null,
        loginBgType: branding?.loginBgType || 'gradient',
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
