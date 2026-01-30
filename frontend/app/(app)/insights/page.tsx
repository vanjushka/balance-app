"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listSymptomLogsRange, SymptomLog } from "@/lib/symptoms";
import { api, ApiException } from "@/lib/api";
import {
    getInsights,
    getInsightsSummary,
    InsightsResponse,
    InsightsSummaryResponse,
    getSharedPatterns,
    SharedPatternsResponse,
} from "@/lib/insights";

type RangeDays = 30 | 90;

type ReportCreateResponse = {
    data: {
        id: number;
    };
};

const DEBUG = false;

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function dateOnly(isoLike: string): string {
    return isoLike.slice(0, 10);
}

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}

function addDaysISO(iso: string, delta: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + delta);
    const yy = base.getUTCFullYear();
    const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(base.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

function rangeFromDays(days: RangeDays): { from: string; to: string } {
    const to = todayISO();
    const from = addDaysISO(to, -(days - 1));
    return { from, to };
}

function formatISODateShort(iso: string) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function SoftCard({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={[
                "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]",
                className ?? "",
            ].join(" ")}
        >
            {children}
        </div>
    );
}

function PillButton({
    active,
    children,
    onClick,
    pressed,
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    pressed: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={pressed}
            className={[
                "h-10 rounded-full px-4 text-sm transition",
                "border",
                active
                    ? "border-[var(--primary)] bg-[var(--surface)] text-[var(--fg)]"
                    : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--fg)]",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

export default function InsightsPage() {
    const [rangeDays, setRangeDays] = useState<RangeDays>(30);

    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    const [insights, setInsights] = useState<InsightsResponse | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    const [ai, setAi] = useState<InsightsSummaryResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [shared, setShared] = useState<SharedPatternsResponse | null>(null);
    const [sharedLoading, setSharedLoading] = useState(false);
    const [sharedError, setSharedError] = useState<string | null>(null);

    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

    const loadLogs = useCallback(
        async (signal?: AbortSignal) => {
            setLogsError(null);
            setLogsLoading(true);

            try {
                const { from, to } = rangeFromDays(rangeDays);
                const data = await listSymptomLogsRange({
                    from,
                    to,
                    per_page: 100,
                });

                if (signal?.aborted) return;

                setLogs(
                    [...data].sort((a, b) =>
                        dateOnly(b.log_date).localeCompare(
                            dateOnly(a.log_date),
                        ),
                    ),
                );
            } catch (err) {
                if (signal?.aborted) return;
                setLogsError(errorMessage(err, "Failed to load insights data"));
                setLogs([]);
            } finally {
                if (!signal?.aborted) setLogsLoading(false);
            }
        },
        [rangeDays],
    );

    const loadInsights = useCallback(
        async (signal?: AbortSignal) => {
            setInsightsError(null);
            setInsightsLoading(true);

            try {
                const res = await getInsights(rangeDays);
                if (signal?.aborted) return;
                setInsights(res);
            } catch (err) {
                if (signal?.aborted) return;
                setInsightsError(errorMessage(err, "Failed to load insights"));
                setInsights(null);
            } finally {
                if (!signal?.aborted) setInsightsLoading(false);
            }
        },
        [rangeDays],
    );

    const loadAi = useCallback(
        async (signal?: AbortSignal) => {
            setAiError(null);
            setAiLoading(true);

            try {
                const res = await getInsightsSummary(rangeDays);
                if (signal?.aborted) return;
                setAi(res);
            } catch (err) {
                if (signal?.aborted) return;
                setAiError(
                    errorMessage(err, "Failed to generate AI reflection"),
                );
                setAi(null);
            } finally {
                if (!signal?.aborted) setAiLoading(false);
            }
        },
        [rangeDays],
    );

    const loadShared = useCallback(
        async (signal?: AbortSignal) => {
            setSharedError(null);
            setSharedLoading(true);

            try {
                const res = await getSharedPatterns(rangeDays);
                if (signal?.aborted) return;
                setShared(res);
            } catch (err) {
                if (signal?.aborted) return;
                setSharedError(
                    errorMessage(err, "Failed to load shared patterns"),
                );
                setShared(null);
            } finally {
                if (!signal?.aborted) setSharedLoading(false);
            }
        },
        [rangeDays],
    );

    useEffect(() => {
        const c = new AbortController();
        void loadLogs(c.signal);
        void loadInsights(c.signal);
        return () => c.abort();
    }, [loadLogs, loadInsights]);

    const loggedDays = useMemo(() => {
        return insights?.data?.counts?.logged_days ?? logs.length;
    }, [insights?.data?.counts?.logged_days, logs.length]);

    useEffect(() => {
        if (loggedDays < 7) {
            setAiError(null);
            setAi(null);
            setAiLoading(false);
            return;
        }

        const c = new AbortController();
        void loadAi(c.signal);
        return () => c.abort();
    }, [rangeDays, loggedDays, loadAi]);

    useEffect(() => {
        if (logs.length <= 7) {
            setSharedError(null);
            setShared(null);
            setSharedLoading(false);
            return;
        }

        const c = new AbortController();
        void loadShared(c.signal);
        return () => c.abort();
    }, [rangeDays, logs.length, loadShared]);

    async function onDownload() {
        setDownloadError(null);
        setDownloadLoading(true);

        try {
            const { from, to } = rangeFromDays(rangeDays);

            const created = await api.post<ReportCreateResponse>(
                "/api/reports",
                {
                    period_start: from,
                    period_end: to,
                },
            );

            if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

            window.location.href = `${API_URL}/api/reports/${created.data.id}/download`;
        } catch (err) {
            setDownloadError(
                errorMessage(err, "Could not generate PDF report."),
            );
        } finally {
            setDownloadLoading(false);
        }
    }

    function onRetryAi() {
        if (loggedDays < 7) return;
        const c = new AbortController();
        void loadAi(c.signal);
    }

    const metrics = insights?.data ?? null;
    const meta = insights?.meta ?? null;

    const aiCards = useMemo(() => {
        if (!ai) return [];
        const cards: Array<{ kind: "summary" | "bullet"; text: string }> = [];

        if (ai.data.summary?.trim()) {
            cards.push({ kind: "summary", text: ai.data.summary.trim() });
        }

        if (Array.isArray(ai.data.bullets) && ai.data.bullets.length > 0) {
            for (const b of ai.data.bullets) {
                if (cards.length >= 4) break;
                if (typeof b === "string" && b.trim()) {
                    cards.push({ kind: "bullet", text: b.trim() });
                }
            }
        }

        return cards.slice(0, 4);
    }, [ai]);

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-24 pt-4 text-[var(--fg)]">
            <div className="mx-auto w-full max-w-md">
                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => history.back()}
                            className="h-10 w-10 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
                            aria-label="Back"
                            title="Back"
                        >
                            <span className="text-xl leading-none">‹</span>
                        </button>

                        <p className="text-sm text-[var(--muted)]">Insights</p>

                        <span className="h-10 w-10" aria-hidden />
                    </div>
                </header>

                <section className="space-y-2">
                    <h1 className="font-serif text-4xl leading-tight text-[var(--fg)]">
                        Patterns we’re noticing
                    </h1>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                        These gentle observations are based on your recent
                        check-ins. They’re here to support awareness, not to
                        diagnose.
                    </p>
                </section>

                <section className="mt-6 space-y-3">
                    <div className="flex gap-3">
                        <PillButton
                            active={rangeDays === 30}
                            pressed={rangeDays === 30}
                            onClick={() => setRangeDays(30)}
                        >
                            Last 30 days
                        </PillButton>

                        <PillButton
                            active={rangeDays === 90}
                            pressed={rangeDays === 90}
                            onClick={() => setRangeDays(90)}
                        >
                            Last 90 days
                        </PillButton>
                    </div>

                    <button
                        type="button"
                        onClick={onDownload}
                        disabled={downloadLoading}
                        className="inline-flex items-center gap-2 text-xs text-[var(--bold)] hover:text-[var(--fg)] disabled:opacity-60"
                    >
                        <span aria-hidden>⇩</span>
                        <span>
                            {downloadLoading
                                ? "Preparing report…"
                                : "Download report (PDF)"}
                        </span>
                    </button>

                    {downloadError && (
                        <SoftCard className="px-5 py-4">
                            <p className="text-sm text-[var(--danger)]">
                                {downloadError}
                            </p>
                        </SoftCard>
                    )}
                </section>

                <section className="mt-10">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif text-3xl leading-tight text-[var(--fg)]">
                            Reflection
                        </h2>

                        {loggedDays >= 7 && !aiLoading && (
                            <button
                                type="button"
                                onClick={onRetryAi}
                                className="text-xs text-[var(--subtle)] hover:text-[var(--fg)]"
                            >
                                Regenerate
                            </button>
                        )}
                    </div>

                    {loggedDays < 7 ? (
                        <SoftCard className="mt-4 px-6 py-6">
                            <p className="text-sm text-[var(--fg)]">
                                Not enough recent check-ins yet.
                            </p>
                            <p className="mt-1 text-xs text-[var(--subtle)]">
                                Add a few more days to unlock reflections.
                            </p>
                        </SoftCard>
                    ) : aiLoading ? (
                        <SoftCard className="mt-4 px-6 py-6">
                            <p className="text-sm text-[var(--muted)]">
                                Generating…
                            </p>
                        </SoftCard>
                    ) : aiError ? (
                        <SoftCard className="mt-4 px-5 py-4">
                            <p className="text-sm text-[var(--danger)]">
                                {aiError}
                            </p>
                        </SoftCard>
                    ) : ai ? (
                        <div className="mt-5 space-y-4">
                            {aiCards.length > 0 ? (
                                aiCards.map((c, idx) => (
                                    <SoftCard key={idx} className="px-6 py-6">
                                        <div className="flex gap-4">
                                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--subtle)]">
                                                {c.kind === "summary"
                                                    ? "◐"
                                                    : "•"}
                                            </div>
                                            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
                                                {c.text}
                                            </p>
                                        </div>
                                    </SoftCard>
                                ))
                            ) : (
                                <SoftCard className="px-6 py-6">
                                    <p className="text-sm text-[var(--muted)]">
                                        No AI response.
                                    </p>
                                </SoftCard>
                            )}

                            {ai.data.disclaimer?.trim() ? (
                                <div className="rounded-[22px] border border-[color-mix(in_oklch,var(--primary)_35%,var(--border)_65%)] bg-[color-mix(in_oklch,var(--primary)_8%,white_92%)] px-6 py-5">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_55%,white_45%)] text-[11px] font-medium leading-none text-[var(--primary)]">
                                            i
                                        </div>

                                        <p className="text-xs leading-relaxed text-[var(--muted)]">
                                            {ai.data.disclaimer}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <SoftCard className="mt-4 px-6 py-6">
                            <p className="text-sm text-[var(--muted)]">
                                No AI response.
                            </p>
                        </SoftCard>
                    )}
                </section>

                <div className="my-10 h-px w-full bg-[var(--border)] opacity-60" />

                <section className="mt-10 space-y-2">
                    <h2 className="font-serif text-3xl leading-tight text-[var(--fg)]">
                        Shared patterns
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                        Based on anonymized patterns from users with similar
                        experiences.
                    </p>

                    <div className="mt-6 space-y-4">
                        {logsError && (
                            <SoftCard className="px-5 py-4">
                                <p className="text-sm text-[var(--danger)]">
                                    {logsError}
                                </p>
                            </SoftCard>
                        )}

                        {logsLoading ? (
                            <SoftCard className="px-6 py-6">
                                <p className="text-sm text-[var(--muted)]">
                                    Loading…
                                </p>
                            </SoftCard>
                        ) : logs.length <= 7 ? (
                            <SoftCard className="px-6 py-6">
                                <p className="text-sm text-[var(--fg)]">
                                    Not enough check-ins yet.
                                </p>
                                <p className="mt-1 text-xs text-[var(--subtle)]">
                                    Shared patterns unlock after 7+ logged days.
                                </p>
                            </SoftCard>
                        ) : sharedLoading ? (
                            <SoftCard className="px-6 py-6">
                                <p className="text-sm text-[var(--muted)]">
                                    Loading shared patterns…
                                </p>
                            </SoftCard>
                        ) : sharedError ? (
                            <SoftCard className="px-5 py-4">
                                <p className="text-sm text-[var(--danger)]">
                                    {sharedError}
                                </p>
                            </SoftCard>
                        ) : shared ? (
                            <>
                                {shared.data.patterns
                                    .slice(0, 4)
                                    .map((text, idx) => (
                                        <SoftCard
                                            key={idx}
                                            className="px-6 py-6"
                                        >
                                            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
                                                {text}
                                            </p>
                                        </SoftCard>
                                    ))}

                                <div className="rounded-[22px] border border-[color-mix(in_oklch,var(--primary)_35%,var(--border)_65%)] bg-[color-mix(in_oklch,var(--primary)_8%,white_92%)] px-6 py-5">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_55%,white_45%)] text-[11px] font-medium leading-none text-[var(--primary)]">
                                            i
                                        </div>

                                        <p className="text-xs leading-relaxed text-[var(--muted)]">
                                            {shared.data.disclaimer}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <SoftCard className="px-6 py-6">
                                <p className="text-sm text-[var(--muted)]">
                                    No shared patterns available yet.
                                </p>
                            </SoftCard>
                        )}
                    </div>
                </section>

                {DEBUG && (
                    <section className="mt-10 border-t border-[var(--border)] pt-8">
                        <h2 className="text-base font-semibold text-[var(--fg)]">
                            Debug
                        </h2>

                        {insightsLoading ? (
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Loading…
                            </p>
                        ) : insightsError ? (
                            <SoftCard className="mt-2 px-5 py-4">
                                <p className="text-sm text-[var(--danger)]">
                                    {insightsError}
                                </p>
                            </SoftCard>
                        ) : (
                            <SoftCard className="mt-3 px-6 py-6">
                                {meta && (
                                    <p className="text-xs text-[var(--subtle)]">
                                        Range: {meta.range_days} days •{" "}
                                        {formatISODateShort(meta.date_from)} —{" "}
                                        {formatISODateShort(meta.date_to)}
                                    </p>
                                )}

                                <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--muted)]">
                                    {JSON.stringify(metrics, null, 2)}
                                </pre>
                            </SoftCard>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}
