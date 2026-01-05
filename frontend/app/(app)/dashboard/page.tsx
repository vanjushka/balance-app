"use client";

import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <main style={{ display: "grid", gap: 12 }}>
            <h1>Dashboard</h1>

            <p>Logged in as: {user?.email}</p>

            <button onClick={logout}>Logout</button>
        </main>
    );
}
