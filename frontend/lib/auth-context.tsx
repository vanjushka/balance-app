"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { User, fetchMe, logout as apiLogout } from "@/lib/auth";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    refetch: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        try {
            const me = await fetchMe();
            setUser(me);
        } catch {
            setUser(null);
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        refetch();
    }, [refetch]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // intentionally ignored
        } finally {
            localStorage.removeItem("token");
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetch, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
