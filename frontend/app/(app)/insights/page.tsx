"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listSymptomLogsRange, SymptomLog } from "@/lib/symptoms";
import { api, ApiException } from "@/lib/api";

type RangeDays = 30 | 90;

type InsightCard = {
    key: string;
    title: string;
    body: string;
    footnote: string;
    strength: "emerging" | "observed" | "consistent";
    tone: "sage" | "sand" | "rose" | "slate";
};

type SharedPatternItem = {
    id: number;
    text: string;
};

type ReportCreateResponse = {
    data: {
        id: number;
    };
};

type ReportsListItem = {
    id: number;
    title?: string | null;
    text?: string | null;
    content?: string | null;
};

type ReportsListResponse = {
    data?: ReportsListItem[];
};

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

function labelStrength(
    occurrences: number,
    totalLoggedDays: number
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

function unwrapSharedPatterns(
    res: ReportsListResponse | ReportsListItem[]
): SharedPatternItem[] {
    const list: ReportsListItem[] = Array.isArray(res) ? res : res.data ?? [];

    return list
        .map((x) => {
            const text =
                (typeof x.text === "string" && x.text) ||
                (typeof x.content === "string" && x.content) ||
                (typeof x.title === "string" && x.title) ||
                "";

            return { id: x.id, text };
        })
        .filter((x) => x.text.trim().length > 0);
}

export default function InsightsPage() {
    const [rangeDays, setRangeDays] = useState<RangeDays>(30);

    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    const [shared, setShared] = useState<SharedPatternItem[]>([]);
    const [sharedLoading, setSharedLoading] = useState(true);
    const [sharedError, setSharedError] = useState<string | null>(null);

    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

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

                const sorted = [...data].sort((a, b) =>
                    dateOnly(b.log_date).localeCompare(dateOnly(a.log_date))
                );

                setLogs(sorted);
            } catch (err) {
                if (signal?.aborted) return;
                setLogsError(errorMessage(err, "Failed to load insights data"));
                setLogs([]);
            } finally {
                if (!signal?.aborted) setLogsLoading(false);
            }
        },
        [rangeDays]
    );

    const loadShared = useCallback(async (signal?: AbortSignal) => {
        setSharedError(null);
        setSharedLoading(true);

        try {
            const res = await api.get<ReportsListResponse>("/api/reports");
            if (signal?.aborted) return;
            setShared(unwrapSharedPatterns(res));
        } catch (err) {
            if (signal?.aborted) return;
            setSharedError(errorMessage(err, "Failed to load shared patterns"));
            setShared([]);
        } finally {
            if (!signal?.aborted) setSharedLoading(false);
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        void loadLogs(c.signal);
        void loadShared(c.signal);
        return () => c.abort();
    }, [loadLogs, loadShared]);

    const cards = useMemo<InsightCard[]>(() => {
        const totalDays = logs.length;
        if (totalDays < 7) return [];

        const lowEnergyDays = logs.filter(isLowEnergy).length;
        const highPainDays = logs.filter(isHighPain).length;

        const painAndStressDays = logs.filter(
            (l) =>
                isHighPain(l) &&
                typeof l.stress_level === "number" &&
                l.stress_level >= 7
        ).length;

        const bloatingDays = logs.filter((l) => hasTag(l, "bloating")).length;

        const acneDays = logs.filter((l) => hasTag(l, "acne")).length;

        const moodPosDays = logs.filter((l) => {
            const m = normalizeMood(l.mood);
            return m === "calm" || m === "happy";
        }).length;

        const out: InsightCard[] = [];

        const addIf = (
            key: string,
            title: string,
            body: string,
            occurrences: number,
            minOccurrences: number,
            tone: InsightCard["tone"]
        ) => {
            if (occurrences < minOccurrences) return;
            const { strength, footnote } = labelStrength(
                occurrences,
                totalDays
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

        const minObserved = 3;

        addIf(
            "pain_stress_same_day",
            "Pain often appears with stress",
            "You’ve logged higher pain on days where stress was also high. This is not a diagnosis, just a gentle signal to watch.",
            painAndStressDays,
            minObserved,
            "rose"
        );

        addIf(
            "energy_low",
            "Low energy days repeat",
            "You’ve logged low energy on multiple days. This can be a normal fluctuation, and it may help to pace yourself when it happens.",
            lowEnergyDays,
            minObserved,
            "sage"
        );

        addIf(
            "pain_high",
            "Higher pain days show up",
            "Your pain levels were elevated on several days. Noting what supports you can help you spot gentle patterns over time.",
            highPainDays,
            minObserved,
            "sand"
        );

        addIf(
            "bloating_cluster",
            "Bloating tends to cluster",
            "Bloating was logged multiple times in this period. Tracking meals, hydration, and rest may help you notice what supports you best.",
            bloatingDays,
            minObserved,
            "sage"
        );

        addIf(
            "skin_acne",
            "Skin flare-ups recur",
            "You’ve logged acne or breakouts on multiple days. If you want, you can notice whether it appears alongside stress or sleep changes.",
            acneDays,
            minObserved,
            "rose"
        );

        if (moodPosDays >= minObserved) {
            addIf(
                "mood_positive",
                "Calmer mood days appear",
                "You’ve logged calm or happy mood on multiple days. Notice what routines or environments tend to support this.",
                moodPosDays,
                minObserved,
                "slate"
            );
        }

        const order = [
            "pain_stress_same_day",
            "energy_low",
            "pain_high",
            "bloating_cluster",
            "skin_acne",
            "mood_positive",
        ];

        out.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
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
                }
            );

            const reportId = created.data.id;
            window.location.href = `/api/reports/${reportId}/download`;
        } catch (err) {
            setDownloadError(
                errorMessage(err, "Could not generate your PDF report.")
            );
        } finally {
            setDownloadLoading(false);
        }
    }

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
                    check-ins. They’re here to support your awareness, not to
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

            <section className="mt-4 space-y-4">
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
                                            )
                                        )}
                                    </span>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>

            <section className="mt-10 border-t border-zinc-900 pt-8">
                <h2 className="text-base font-semibold text-zinc-100">
                    Shared patterns
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                    Based on anonymized patterns from users with similar
                    experiences.
                </p>

                <div className="mt-4 space-y-3">
                    {sharedError && (
                        <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                            {sharedError}
                        </div>
                    )}

                    {sharedLoading ? (
                        <p className="text-sm text-zinc-400">
                            Loading shared patterns…
                        </p>
                    ) : shared.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                            <p className="text-sm text-zinc-200">
                                No shared patterns yet.
                            </p>
                        </div>
                    ) : (
                        shared.slice(0, 3).map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
                            >
                                <p className="text-sm text-zinc-200">
                                    {item.text}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                    <div className="flex items-start gap-3">
                        <span
                            className="mt-0.5 h-6 w-6 rounded-full bg-emerald-100"
                            aria-hidden
                        />
                        <p className="text-xs leading-relaxed text-zinc-500">
                            These insights are gentle reflections, not medical
                            advice. Always consult with a healthcare provider
                            for concerns about your health.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
