"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/layout/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
                <div className="mx-auto w-full max-w-md px-5 py-10">
                    <p className="text-sm text-[var(--muted)]">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
                <div className="mx-auto w-full max-w-md px-5 py-10">
                    <p className="text-sm text-[var(--muted)]">Redirecting…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
            <div className="mx-auto w-full max-w-md px-5 pt-6 pb-24">
                {children}
            </div>

            <AppNav />
        </div>
    );
}
