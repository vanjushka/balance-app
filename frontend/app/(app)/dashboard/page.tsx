"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    if (loading) {
        return (
            <main className="mx-auto w-full max-w-3xl px-6 py-10">
                <p className="text-sm text-zinc-400">Loading…</p>
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                        Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Logged in as{" "}
                        <span className="text-zinc-200">{user.email}</span>
                    </p>
                </div>

                <button
                    onClick={async () => {
                        await logout();
                        router.replace("/login");
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 hover:border-zinc-700"
                >
                    Logout
                </button>
            </div>

            <div className="mt-10">
                <h2 className="text-lg font-medium text-zinc-100">
                    My symptoms
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    Next: connect /api/symptoms list + create.
                </p>
            </div>
        </main>
    );
}
