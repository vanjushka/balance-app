"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Tab = {
    href: string;
    label: string;
};

const tabs: Tab[] = [
    { href: "/dashboard", label: "Home" },
    { href: "/symptoms", label: "Timeline" },
    { href: "/insights", label: "Insights" },
    { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(href + "/");
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-dvh bg-black">
                <div className="mx-auto w-full max-w-md px-5 py-10">
                    <p className="text-sm text-zinc-400">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-dvh bg-black">
                <div className="mx-auto w-full max-w-md px-5 py-10">
                    <p className="text-sm text-zinc-400">Redirecting…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-black">
            <div className="mx-auto w-full max-w-md px-5 pt-6 pb-24">
                {children}
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/60">
                <div className="mx-auto w-full max-w-md px-3 py-2">
                    <div className="grid grid-cols-4 gap-2">
                        {tabs.map((t) => {
                            const active = isActive(pathname, t.href);
                            return (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    aria-current={active ? "page" : undefined}
                                    className={[
                                        "rounded-xl px-2 py-2 text-center text-xs transition",
                                        active
                                            ? "bg-zinc-900 text-zinc-100"
                                            : "text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200",
                                    ].join(" ")}
                                >
                                    {t.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
}
