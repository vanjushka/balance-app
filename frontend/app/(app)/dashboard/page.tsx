"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createReport } from "@/lib/reports";
import { api, ApiException } from "@/lib/api";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);

    const dt = new Date(Date.UTC(year, month - 1, day));
    dt.setUTCDate(dt.getUTCDate() + days);

    const y = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const da = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
}

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}

type SymptomsIndexResponse = {
    data?: unknown[];
    meta?: unknown;
};

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    const [reportLoading, setReportLoading] = useState<"7" | "30" | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);

    const [todayLoading, setTodayLoading] = useState(false);
    const [todayError, setTodayError] = useState<string | null>(null);
    const [loggedToday, setLoggedToday] = useState<boolean | null>(null);

    const today = useMemo(() => todayISO(), []);
    const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;
        setTodayError(null);
        setTodayLoading(true);

        (async () => {
            try {
                const qs = new URLSearchParams({
                    from: today,
                    to: today,
                    per_page: "1",
                }).toString();

                const res = await api.get<SymptomsIndexResponse>(
                    `/api/symptoms?${qs}`
                );

                const has = Array.isArray(res?.data) && res.data.length > 0;
                if (!cancelled) setLoggedToday(has);
            } catch (err) {
                if (!cancelled)
                    setTodayError(
                        errorMessage(err, "Failed to load today's status")
                    );
            } finally {
                if (!cancelled) setTodayLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, today]);

    async function downloadReport(days: 7 | 30) {
        setReportError(null);
        setReportLoading(days === 7 ? "7" : "30");

        try {
            const period_end = today;
            const period_start = addDaysISO(today, -(days - 1));

            const report = await createReport({ period_start, period_end });

            if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not set");

            window.location.href = `${apiUrl}/reports/${report.id}/download`;
        } catch (err) {
            setReportError(errorMessage(err, "Failed to generate report"));
        } finally {
            setReportLoading(null);
        }
    }

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
                        Welcome back{user.name ? `, ${user.name}` : ""}.
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

            <div className="mt-8 grid gap-4">
                <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-medium text-zinc-100">
                                Symptoms
                            </h2>
                            <p className="mt-1 text-xs text-zinc-400">
                                Track pain, mood and energy over time.
                            </p>
                        </div>

                        <Link
                            href="/symptoms"
                            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 px-3 text-sm font-medium text-zinc-950 hover:bg-white"
                        >
                            Open
                        </Link>
                    </div>

                    <div className="mt-4">
                        {todayError ? (
                            <p className="rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                                {todayError}
                            </p>
                        ) : todayLoading || loggedToday === null ? (
                            <p className="text-sm text-zinc-400">
                                Checking today…
                            </p>
                        ) : loggedToday ? (
                            <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-900 bg-black/20 px-3 py-3">
                                <p className="text-sm text-zinc-200">
                                    Logged today ✅
                                </p>
                                <Link
                                    href={`/symptoms?date=${today}`}
                                    className="text-sm text-zinc-100 underline underline-offset-4 hover:text-white"
                                >
                                    View
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-900 bg-black/20 px-3 py-3">
                                <p className="text-sm text-zinc-200">
                                    No log yet today
                                </p>
                                <Link
                                    href={`/symptoms/new?date=${today}`}
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 px-3 text-sm font-medium text-zinc-950 hover:bg-white"
                                >
                                    Log today
                                </Link>
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-xs text-zinc-500">
                        Logged in as{" "}
                        <span className="text-zinc-300">{user.email}</span>
                    </p>
                </section>

                <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <h2 className="text-sm font-medium text-zinc-100">
                        Reports (PDF)
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                        Download a summary for your last days to share or
                        review.
                    </p>

                    {reportError && (
                        <p className="mt-4 rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                            {reportError}
                        </p>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => void downloadReport(7)}
                            disabled={reportLoading !== null}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-200 hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {reportLoading === "7"
                                ? "Preparing…"
                                : "Last 7 days"}
                        </button>

                        <button
                            type="button"
                            onClick={() => void downloadReport(30)}
                            disabled={reportLoading !== null}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-200 hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {reportLoading === "30"
                                ? "Preparing…"
                                : "Last 30 days"}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
