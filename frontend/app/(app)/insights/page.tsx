"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listSymptomLogsRange, SymptomLog } from "@/lib/symptoms";
import { api, ApiException } from "@/lib/api";
import { getInsights, InsightsResponse } from "@/lib/insights";

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

    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    const [insights, setInsights] = useState<InsightsResponse | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [insightsError, setInsightsError] = useState<string | null>(null);

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
                        dateOnly(b.log_date).localeCompare(dateOnly(a.log_date))
                    )
                );
            } catch (err) {
                if (!signal?.aborted) {
                    setLogsError(
                        errorMessage(err, "Failed to load insights data")
                    );
                    setLogs([]);
                }
            } finally {
                if (!signal?.aborted) setLogsLoading(false);
            }
        },
        [rangeDays]
    );

    const loadInsights = useCallback(
        async (signal?: AbortSignal) => {
            setInsightsError(null);
            setInsightsLoading(true);

            try {
                const res = await getInsights(rangeDays);
                if (!signal?.aborted) setInsights(res);
            } catch (err) {
                if (!signal?.aborted) {
                    setInsightsError(
                        errorMessage(err, "Failed to load insights")
                    );
                    setInsights(null);
                }
            } finally {
                if (!signal?.aborted) setInsightsLoading(false);
            }
        },
        [rangeDays]
    );

    useEffect(() => {
        const c = new AbortController();
        void loadLogs(c.signal);
        void loadInsights(c.signal);
        return () => c.abort();
    }, [loadLogs, loadInsights]);

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
            tone: InsightCard["tone"]
        ) => {
            if (occurrences < minObserved) return;
            const { strength, footnote } = labelStrength(
                occurrences,
                totalDays
            );
            out.push({
                key,
                title,
                body,
                footnote: `${footnote} • Noted ${occurrences} times`,
                strength,
                tone,
            });
        };

        addIf(
            "pain_stress",
            "Pain often appears with stress",
            "Higher pain tends to appear on high-stress days.",
            painAndStressDays,
            "rose"
        );
        addIf(
            "energy_low",
            "Low energy days repeat",
            "Low energy shows up multiple times.",
            lowEnergyDays,
            "sage"
        );
        addIf(
            "pain_high",
            "Higher pain days show up",
            "Pain levels were elevated on several days.",
            highPainDays,
            "sand"
        );
        addIf(
            "bloating",
            "Bloating tends to cluster",
            "Bloating appears on multiple days.",
            bloatingDays,
            "sage"
        );
        addIf(
            "acne",
            "Skin flare-ups recur",
            "Acne or breakouts were logged multiple times.",
            acneDays,
            "rose"
        );
        addIf(
            "mood_positive",
            "Calmer mood days appear",
            "Calm or happy mood appears multiple times.",
            moodPosDays,
            "slate"
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
                }
            );

            if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

            window.location.href = `${API_URL}/api/reports/${created.data.id}/download`;
        } catch (err) {
            setDownloadError(
                errorMessage(err, "Could not generate PDF report")
            );
        } finally {
            setDownloadLoading(false);
        }
    }

    const metrics = insights?.data;

    return (
        <main className="min-h-[100dvh] bg-zinc-950 px-4 pb-24 pt-4 text-zinc-100">
            {/* UI unchanged from here */}
            {/* … */}
        </main>
    );
}
