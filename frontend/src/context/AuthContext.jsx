import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";

// Create Axios Instance
const api = axios.create({
    baseURL: API_URL,
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            fetchMe();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchMe = async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, role) => {
        const { data } = await api.post("/auth/login", { email, password, role });
        localStorage.setItem("token", data.token);
        api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, api }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
