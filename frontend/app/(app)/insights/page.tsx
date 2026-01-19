"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type InsightCard = {
    key: string;
    title: string;
    body: string;
    footnote: string;
    strength: "emerging" | "observed" | "consistent";
    tone: "sage" | "sand" | "rose" | "slate";
};

type ReportCreateResponse = {
    data: {
        id: number;
    };
};

const DEBUG = false; // true while dev, false before submit

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

function isLowEnergy(log: SymptomLog): boolean {
    return log.energy_level === "depleted" || log.energy_level === "low";
}

function isHighPain(log: SymptomLog): boolean {
    return typeof log.pain_intensity === "number" && log.pain_intensity >= 6;
}

function hasTag(log: SymptomLog, tag: string): boolean {
    const tags = Array.isArray(log.tags_json) ? log.tags_json : [];
    return tags.includes(tag);
}

function normalizeMood(m?: string | null): string | null {
    if (!m) return null;
    const s = m.trim().toLowerCase();
    return s.length ? s : null;
}

function getStressLevel(log: SymptomLog): number | null {
    const v = (log as Record<string, unknown>)["stress_level"];
    return typeof v === "number" ? v : null;
}

function labelStrength(
    occurrences: number,
    totalLoggedDays: number,
): { strength: InsightCard["strength"]; footnote: string } {
    const ratio = totalLoggedDays > 0 ? occurrences / totalLoggedDays : 0;

    if (occurrences >= 5 || ratio >= 0.3) {
        return { strength: "consistent", footnote: "Consistent pattern" };
    }
    if (occurrences >= 3) {
        return { strength: "observed", footnote: "Observed recently" };
    }
    return { strength: "emerging", footnote: "Emerging pattern" };
}

function dotsForStrength(strength: InsightCard["strength"]) {
    if (strength === "consistent") return 3;
    if (strength === "observed") return 2;
    return 1;
}

function toneClasses(tone: InsightCard["tone"]) {
    switch (tone) {
        case "sage":
            return { iconBg: "bg-emerald-100", dot: "bg-emerald-400" };
        case "sand":
            return { iconBg: "bg-amber-100", dot: "bg-amber-400" };
        case "rose":
            return { iconBg: "bg-rose-100", dot: "bg-rose-400" };
        default:
            return { iconBg: "bg-zinc-100", dot: "bg-zinc-400" };
    }
}

function formatISODateShort(iso: string) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function InsightsPage() {
    const [rangeDays, setRangeDays] = useState<RangeDays>(30);

    // logs (personal)
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    // backend insights metrics (for meta + logged_days, debug)
    const [insights, setInsights] = useState<InsightsResponse | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    // AI summary
    const [ai, setAi] = useState<InsightsSummaryResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Shared patterns (community)
    const [shared, setShared] = useState<SharedPatternsResponse | null>(null);
    const [sharedLoading, setSharedLoading] = useState(false);
    const [sharedError, setSharedError] = useState<string | null>(null);

    // PDF download
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

    // Fetch logs + metrics on range change
    useEffect(() => {
        const c = new AbortController();
        void loadLogs(c.signal);
        void loadInsights(c.signal);
        return () => c.abort();
    }, [loadLogs, loadInsights]);

    // Decide if AI should be fetched (enough check-ins)
    const loggedDays = useMemo(() => {
        return insights?.data?.counts?.logged_days ?? logs.length;
    }, [insights?.data?.counts?.logged_days, logs.length]);

    // Fetch AI summary when range changes AND we have enough data
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

    // Fetch Shared patterns when range changes AND we have enough local logs
    useEffect(() => {
        if (logs.length < 7) {
            setSharedError(null);
            setShared(null);
            setSharedLoading(false);
            return;
        }

        const c = new AbortController();
        void loadShared(c.signal);
        return () => c.abort();
    }, [rangeDays, logs.length, loadShared]);

    const cards = useMemo<InsightCard[]>(() => {
        const totalDays = logs.length;
        if (totalDays < 7) return [];

        const lowEnergyDays = logs.filter(isLowEnergy).length;
        const highPainDays = logs.filter(isHighPain).length;

        const painAndStressDays = logs.filter((l) => {
            const stress = getStressLevel(l);
            return isHighPain(l) && stress !== null && stress >= 7;
        }).length;

        const bloatingDays = logs.filter((l) => hasTag(l, "bloating")).length;
        const acneDays = logs.filter((l) => hasTag(l, "acne")).length;

        const moodPosDays = logs.filter((l) => {
            const m = normalizeMood(l.mood);
            return m === "calm" || m === "happy";
        }).length;

        const out: InsightCard[] = [];
        const minObserved = 3;

        const addIf = (
            key: string,
            title: string,
            body: string,
            occurrences: number,
            tone: InsightCard["tone"],
        ) => {
            if (occurrences < minObserved) return;
            const { strength, footnote } = labelStrength(
                occurrences,
                totalDays,
            );
            out.push({
                key,
                title,
                body,
                footnote: `${footnote} • Noted ${occurrences} time${
                    occurrences === 1 ? "" : "s"
                } in this period`,
                strength,
                tone,
            });
        };

        addIf(
            "pain_stress",
            "Pain often appears with stress",
            "Higher pain tends to appear on high-stress days.",
            painAndStressDays,
            "rose",
        );
        addIf(
            "energy_low",
            "Low energy days repeat",
            "Low energy shows up multiple times.",
            lowEnergyDays,
            "sage",
        );
        addIf(
            "pain_high",
            "Higher pain days show up",
            "Pain levels were elevated on several days.",
            highPainDays,
            "sand",
        );
        addIf(
            "bloating",
            "Bloating tends to cluster",
            "Bloating appears on multiple days.",
            bloatingDays,
            "sage",
        );
        addIf(
            "acne",
            "Skin flare-ups recur",
            "Acne or breakouts were logged multiple times.",
            acneDays,
            "rose",
        );
        addIf(
            "mood_positive",
            "Calmer mood days appear",
            "Calm or happy mood appears multiple times.",
            moodPosDays,
            "slate",
        );

        return out.slice(0, 5);
    }, [logs]);

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

            // backend origin so cookies apply
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

    return (
        <main className="min-h-[100dvh] bg-zinc-950 px-4 pb-24 pt-4 text-zinc-100">
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => history.back()}
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Back"
                        title="Back"
                    >
                        <span className="text-xl">‹</span>
                    </button>

                    <p className="text-sm text-zinc-300">Insights</p>

                    <span className="h-10 w-10" aria-hidden />
                </div>
            </header>

            <section className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
                    Patterns we’re noticing
                </h1>
                <p className="text-sm text-zinc-400">
                    These gentle observations are based on your recent
                    check-ins. They’re here to support awareness, not to
                    diagnose.
                </p>
            </section>

            <section className="mt-6 space-y-3">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setRangeDays(30)}
                        className={[
                            "h-10 rounded-full px-4 text-sm",
                            rangeDays === 30
                                ? "border border-zinc-300 bg-zinc-100 text-zinc-950"
                                : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700",
                        ].join(" ")}
                        aria-pressed={rangeDays === 30}
                    >
                        Last 30 days
                    </button>

                    <button
                        type="button"
                        onClick={() => setRangeDays(90)}
                        className={[
                            "h-10 rounded-full px-4 text-sm",
                            rangeDays === 90
                                ? "border border-zinc-300 bg-zinc-100 text-zinc-950"
                                : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700",
                        ].join(" ")}
                        aria-pressed={rangeDays === 90}
                    >
                        Last 90 days
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onDownload}
                    disabled={downloadLoading}
                    className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-60"
                >
                    <span aria-hidden>⇩</span>
                    <span>
                        {downloadLoading
                            ? "Preparing report…"
                            : "Download report (PDF)"}
                    </span>
                </button>

                {downloadError && (
                    <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {downloadError}
                    </div>
                )}
            </section>

            {/* AI Reflection */}
            <section className="mt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Reflection
                    </h2>

                    {loggedDays >= 7 && !aiLoading && (
                        <button
                            type="button"
                            onClick={onRetryAi}
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                            Regenerate
                        </button>
                    )}
                </div>

                {loggedDays < 7 ? (
                    <div className="mt-3 rounded-3xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm text-zinc-200">
                            Not enough recent check-ins yet.
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Add a few more days to unlock reflections.
                        </p>
                    </div>
                ) : aiLoading ? (
                    <div className="mt-3 rounded-3xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm text-zinc-400">Generating…</p>
                    </div>
                ) : aiError ? (
                    <div className="mt-3 rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {aiError}
                    </div>
                ) : ai ? (
                    <div className="mt-3 space-y-3 rounded-3xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm leading-relaxed text-zinc-200">
                            {ai.data.summary}
                        </p>

                        {Array.isArray(ai.data.bullets) &&
                            ai.data.bullets.length > 0 && (
                                <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
                                    {ai.data.bullets.slice(0, 3).map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            )}

                        <p className="text-xs text-zinc-500">
                            {ai.data.disclaimer}
                        </p>
                    </div>
                ) : (
                    <div className="mt-3 rounded-3xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm text-zinc-400">No AI response.</p>
                    </div>
                )}
            </section>

            {/* Personal patterns (local from logs) */}
            <section className="mt-6 space-y-4">
                {logsError && (
                    <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {logsError}
                    </div>
                )}

                {logsLoading ? (
                    <p className="text-sm text-zinc-400">Loading insights…</p>
                ) : logs.length < 7 ? (
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm text-zinc-200">
                            Not enough recent check-ins yet.
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Add a few more days of tracking to unlock insights.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/symptoms"
                                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-950 hover:bg-white"
                            >
                                Go to timeline
                            </Link>
                        </div>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
                        <p className="text-sm text-zinc-200">
                            No clear patterns yet.
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Keep tracking. Patterns often become clearer over
                            time.
                        </p>
                    </div>
                ) : (
                    cards.map((c) => {
                        const { iconBg, dot } = toneClasses(c.tone);
                        const dots = dotsForStrength(c.strength);

                        return (
                            <article
                                key={c.key}
                                className="rounded-3xl border border-zinc-900 bg-zinc-950 p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={[
                                            "mt-0.5 h-9 w-9 rounded-full",
                                            iconBg,
                                        ].join(" ")}
                                        aria-hidden
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-zinc-100">
                                            {c.title}
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                                            {c.body}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[11px] text-zinc-500">
                                        {c.footnote}
                                    </p>
                                    <span
                                        className="flex items-center gap-1"
                                        aria-label={c.strength}
                                    >
                                        {Array.from({ length: 3 }).map(
                                            (_, i) => (
                                                <span
                                                    key={i}
                                                    className={[
                                                        "h-1.5 w-1.5 rounded-full",
                                                        i < dots
                                                            ? dot
                                                            : "bg-zinc-800",
                                                    ].join(" ")}
                                                    aria-hidden
                                                />
                                            ),
                                        )}
                                    </span>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>

            {/* Shared patterns (community, anonymized) */}
            {logs.length >= 7 && (
                <section className="mt-10 space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
                        Shared patterns
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Based on anonymized patterns from users with similar
                        experiences.
                    </p>

                    <div className="mt-8 space-y-6">
                        {sharedLoading ? (
                            <div className="rounded-3xl border border-zinc-900 bg-zinc-950 px-6 py-7">
                                <p className="text-base leading-relaxed text-zinc-400">
                                    Loading shared patterns…
                                </p>
                            </div>
                        ) : sharedError ? (
                            <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                                {sharedError}
                            </div>
                        ) : shared ? (
                            <>
                                {shared.data.patterns.map((text, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-3xl border border-zinc-900 bg-zinc-950 px-6 py-7"
                                    >
                                        <p className="text-base leading-relaxed text-zinc-400">
                                            {text}
                                        </p>
                                    </div>
                                ))}

                                <p className="text-xs text-zinc-500">
                                    {shared.data.disclaimer}
                                </p>
                            </>
                        ) : (
                            <div className="rounded-3xl border border-zinc-900 bg-zinc-950 px-6 py-7">
                                <p className="text-base leading-relaxed text-zinc-400">
                                    No shared patterns available yet.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Debug (optional) */}
            {DEBUG && (
                <section className="mt-10 border-t border-zinc-900 pt-8">
                    <h2 className="text-base font-semibold text-zinc-100">
                        Debug
                    </h2>

                    {insightsLoading ? (
                        <p className="mt-2 text-sm text-zinc-400">Loading…</p>
                    ) : insightsError ? (
                        <div className="mt-2 rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                            {insightsError}
                        </div>
                    ) : (
                        <div className="mt-3 space-y-3 rounded-3xl border border-zinc-900 bg-zinc-950 p-5">
                            {meta && (
                                <p className="text-xs text-zinc-500">
                                    Range: {meta.range_days} days •{" "}
                                    {formatISODateShort(meta.date_from)} —{" "}
                                    {formatISODateShort(meta.date_to)}
                                </p>
                            )}

                            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-500">
                                {JSON.stringify(metrics, null, 2)}
                            </pre>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
