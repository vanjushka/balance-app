"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BarChart3, User } from "lucide-react";

type Tab = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

const tabs: Tab[] = [
    { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
    { href: "/symptoms", label: "Timeline", icon: <Calendar size={20} /> },
    { href: "/insights", label: "Insights", icon: <BarChart3 size={20} /> },
    { href: "/profile", label: "Profile", icon: <User size={20} /> },
];

function isActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(href + "/");
}

export default function AppNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/80">
            <div className="mx-auto w-full max-w-md px-3 py-2">
                <div className="grid grid-cols-4">
                    {tabs.map((t) => {
                        const active = isActive(pathname, t.href);

                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                aria-label={t.label}
                                aria-current={active ? "page" : undefined}
                                className="flex flex-col items-center justify-center gap-1 py-2"
                            >
                                <span
                                    className={[
                                        "flex h-9 w-9 items-center justify-center rounded-full transition",
                                        active
                                            ? "bg-[color-mix(in_oklch,var(--primary)_20%,transparent_80%)] text-[var(--primary)]"
                                            : "text-[var(--muted)]",
                                    ].join(" ")}
                                >
                                    {t.icon}
                                </span>

                                <span
                                    className={[
                                        "text-[11px] leading-none",
                                        active
                                            ? "text-[var(--primary)] font-medium"
                                            : "text-[var(--muted)]",
                                    ].join(" ")}
                                >
                                    {t.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
