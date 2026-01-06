"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { fetchMe, logout as apiLogout } from "@/lib/auth";
import { ApiException } from "@/lib/api";

export type User = {
    id: number;
    name?: string | null;
    email: string;
};

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
            const { user } = await fetchMe<User>();
            setUser(user);
        } catch (err) {
            // If not authenticated, backend should return 401
            if (err instanceof ApiException && err.status === 401) {
                setUser(null);
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Sanctum session: attempt to load the current user on mount
        refetch();
    }, [refetch]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // ignore
        } finally {
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
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
