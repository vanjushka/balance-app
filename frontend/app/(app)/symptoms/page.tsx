"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listSymptomLogs, SymptomLog } from "@/lib/symptoms";
import { ApiException } from "@/lib/api";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function dateOnly(isoLike: string): string {
    return isoLike.slice(0, 10);
}

function ymKeyFromISO(isoDay: string): string {
    return isoDay.slice(0, 7); // YYYY-MM
}

function monthLabelFromYM(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function headerMonthLabelFromYM(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatLongDate(isoDay: string): string {
    const d = new Date(`${isoDay}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

function formatShortDate(isoDay: string): string {
    const d = new Date(`${isoDay}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}

function addMonthsYM(ym: string, delta: number): string {
    const [y, m] = ym.split("-").map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
    dt.setUTCMonth(dt.getUTCMonth() + delta);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    return `${yy}-${mm}`;
}

function daysInMonth(y: number, m1to12: number): number {
    return new Date(Date.UTC(y, m1to12, 0)).getUTCDate();
}

function weekdayIndexSundayFirst(
    y: number,
    m1to12: number,
    day: number
): number {
    const dt = new Date(Date.UTC(y, m1to12 - 1, day));
    return dt.getUTCDay(); // 0=Sun..6=Sat
}

function relativeLabel(isoDay: string): string | null {
    const t = todayISO();
    if (isoDay === t) return "Today";

    const [y, m, d] = t.split("-").map(Number);
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() - 1);
    const y2 = base.getUTCFullYear();
    const m2 = String(base.getUTCMonth() + 1).padStart(2, "0");
    const d2 = String(base.getUTCDate()).padStart(2, "0");
    const yesterday = `${y2}-${m2}-${d2}`;

    if (isoDay === yesterday) return "Yesterday";
    return null;
}

function markersForLog(log: SymptomLog): {
    highSymptoms: boolean;
    mildSymptoms: boolean;
    lowEnergy: boolean;
} {
    const pain =
        typeof log.pain_intensity === "number" ? log.pain_intensity : null;

    const tagsCount = Array.isArray(log.tags_json) ? log.tags_json.length : 0;

    const lowEnergy =
        log.energy_level === "depleted" || log.energy_level === "low";

    // Entry exists if *any* tracked field has a value.
    // (Used for edge-case: note-only day should still show mild.)
    const hasAnyEntry =
        (pain !== null && pain > 0) ||
        tagsCount > 0 ||
        (typeof log.notes === "string" && log.notes.trim().length > 0) ||
        (typeof log.mood === "string" && log.mood.trim().length > 0) ||
        typeof log.sleep_quality === "number" ||
        typeof log.stress_level === "number" ||
        (log.energy_level !== null && log.energy_level !== undefined);

    // High = pain >= 6 OR tags >= 4
    const highSymptoms = (pain !== null && pain >= 6) || tagsCount >= 4;

    // Mild = only if not high, and either
    // - pain 1..5 OR tags 1..3 OR (edge-case) entry exists (e.g. note-only day)
    const mildSymptoms =
        !highSymptoms &&
        ((pain !== null && pain >= 1 && pain <= 5) ||
            (tagsCount >= 1 && tagsCount <= 3) ||
            (tagsCount === 0 && (pain === null || pain === 0) && hasAnyEntry));

    return { highSymptoms, mildSymptoms, lowEnergy };
}

function summarizeTags(tags?: string[] | null): string | null {
    if (!tags || tags.length === 0) return null;
    return tags
        .slice(0, 3)
        .map((t) => t.replace(/_/g, " "))
        .join(", ");
}

export default function SymptomsPage() {
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(todayISO());
    const [selectedMonthYM, setSelectedMonthYM] = useState<string>(() =>
        ymKeyFromISO(todayISO())
    );

    const load = useCallback(async (signal?: AbortSignal) => {
        setError(null);
        setLoading(true);

        try {
            const data = await listSymptomLogs();
            if (signal?.aborted) return;
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            if (signal?.aborted) return;
            setError(errorMessage(err, "Failed to load logs"));
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    // Map: YYYY-MM-DD -> log
    const logByDay = useMemo(() => {
        const map = new Map<string, SymptomLog>();
        for (const l of logs) {
            map.set(dateOnly(l.log_date), l);
        }
        return map;
    }, [logs]);

    const recentEntries = useMemo(() => {
        const sorted = [...logs].sort((a, b) => {
            const da = dateOnly(a.log_date);
            const db = dateOnly(b.log_date);
            return db.localeCompare(da);
        });
        return sorted.slice(0, 4);
    }, [logs]);

    // Calendar days for selected month
    const calendarCells = useMemo(() => {
        const [yy, mm] = selectedMonthYM.split("-").map(Number);
        const y = yy;
        const m = mm;

        const firstWeekday = weekdayIndexSundayFirst(y, m, 1); // 0..6
        const totalDays = daysInMonth(y, m);

        const cells: Array<
            | { kind: "empty"; key: string }
            | { kind: "day"; key: string; isoDay: string; dayNumber: number }
        > = [];

        for (let i = 0; i < firstWeekday; i++) {
            cells.push({ kind: "empty", key: `e-${i}` });
        }

        for (let day = 1; day <= totalDays; day++) {
            const isoDay = `${y}-${String(m).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;
            cells.push({ kind: "day", key: isoDay, isoDay, dayNumber: day });
        }

        return cells;
    }, [selectedMonthYM]);

    return (
        <main className="space-y-6">
            {/* Header */}
            <header className="pt-1">
                <div className="flex items-start justify-between">
                    <button
                        type="button"
                        onClick={() => history.back()}
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Back"
                        title="Back"
                    >
                        <span className="text-xl">‹</span>
                    </button>

                    <div className="text-center">
                        <p className="text-[11px] tracking-widest text-zinc-500">
                            HISTORY
                        </p>
                        <p className="text-sm text-zinc-300">
                            {headerMonthLabelFromYM(selectedMonthYM)}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="More"
                        title="More"
                    >
                        <span className="text-xl">⋯</span>
                    </button>
                </div>
            </header>

            <section className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
                    Your symptom timeline
                </h1>
                <p className="text-sm text-zinc-400">
                    A gentle overview of patterns and changes over time.
                </p>
            </section>

            {/* Month selector pill */}
            <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() =>
                            setSelectedMonthYM((prev) => addMonthsYM(prev, -1))
                        }
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Previous month"
                        title="Previous month"
                    >
                        ‹
                    </button>

                    <p className="text-sm font-medium text-zinc-100">
                        {monthLabelFromYM(selectedMonthYM)}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setSelectedMonthYM((prev) => addMonthsYM(prev, 1))
                        }
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Next month"
                        title="Next month"
                    >
                        ›
                    </button>
                </div>

                {/* Calendar */}
                <div className="mt-4 rounded-2xl border border-zinc-900 bg-black/20 p-4">
                    <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-zinc-500">
                        <div>S</div>
                        <div>M</div>
                        <div>T</div>
                        <div>W</div>
                        <div>T</div>
                        <div>F</div>
                        <div>S</div>
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-2">
                        {calendarCells.map((cell) => {
                            if (cell.kind === "empty") {
                                return <div key={cell.key} className="h-10" />;
                            }

                            const isSelected = cell.isoDay === selectedDate;
                            const log = logByDay.get(cell.isoDay);
                            const markers = log ? markersForLog(log) : null;

                            return (
                                <button
                                    key={cell.key}
                                    type="button"
                                    onClick={() => setSelectedDate(cell.isoDay)}
                                    className={[
                                        "h-10 rounded-xl border text-sm transition",
                                        isSelected
                                            ? "border-zinc-100 bg-zinc-900 text-zinc-100"
                                            : "border-zinc-900 bg-zinc-950 text-zinc-200 hover:border-zinc-800",
                                    ].join(" ")}
                                    aria-label={`Select ${cell.isoDay}`}
                                    aria-pressed={isSelected}
                                >
                                    <div className="flex h-full flex-col items-center justify-center gap-1">
                                        <span className="leading-none">
                                            {cell.dayNumber}
                                        </span>

                                        {/* marker row (up to 3 dots) */}
                                        <span className="flex items-center gap-1">
                                            <span
                                                className={[
                                                    "h-1.5 w-1.5 rounded-full",
                                                    markers?.highSymptoms
                                                        ? "bg-zinc-200"
                                                        : "bg-transparent",
                                                ].join(" ")}
                                                aria-hidden
                                            />
                                            <span
                                                className={[
                                                    "h-1.5 w-1.5 rounded-full",
                                                    markers?.mildSymptoms
                                                        ? "bg-zinc-500"
                                                        : "bg-transparent",
                                                ].join(" ")}
                                                aria-hidden
                                            />
                                            <span
                                                className={[
                                                    "h-1.5 w-1.5 rounded-full",
                                                    markers?.lowEnergy
                                                        ? "bg-zinc-400"
                                                        : "bg-transparent",
                                                ].join(" ")}
                                                aria-hidden
                                            />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Legend */}
            <section className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-zinc-200" />
                    <span>High symptoms</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-zinc-500" />
                    <span>Mild symptoms</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    <span>Low energy</span>
                </div>
            </section>

            {/* Recent entries */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-zinc-100">
                    Recent entries
                </h2>

                {error && (
                    <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-sm text-zinc-400">Loading…</p>
                ) : recentEntries.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                        <p className="text-sm text-zinc-300">No entries yet.</p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Start by adding symptoms or a quick check-in.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {recentEntries.map((l) => {
                            const isoDay = dateOnly(l.log_date);
                            const rel = relativeLabel(isoDay);

                            const tagsLine = summarizeTags(l.tags_json);
                            const showPain =
                                typeof l.pain_intensity === "number"
                                    ? l.pain_intensity
                                    : null;

                            const showEnergy =
                                typeof l.energy_level === "string" &&
                                l.energy_level
                                    ? l.energy_level
                                    : null;

                            return (
                                <li key={l.id}>
                                    <Link
                                        href={`/symptoms/new?date=${encodeURIComponent(
                                            isoDay
                                        )}`}
                                        className="block rounded-2xl border border-zinc-900 bg-zinc-950 p-4 hover:border-zinc-800"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-100">
                                                    {rel ??
                                                        formatShortDate(isoDay)}
                                                </p>
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {formatLongDate(isoDay)}
                                                </p>
                                            </div>
                                            <span className="text-zinc-400">
                                                ›
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2 text-sm text-zinc-200">
                                            {showPain !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                                                    <span>
                                                        Pain level: {showPain}
                                                    </span>
                                                </div>
                                            ) : null}

                                            {tagsLine ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-zinc-500" />
                                                    <span>{tagsLine}</span>
                                                </div>
                                            ) : null}

                                            {showEnergy ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-zinc-300" />
                                                    <span>
                                                        Energy: {showEnergy}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* CTAs */}
            <section className="space-y-3 pt-2">
                <Link
                    href="/insights"
                    className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-sm font-medium text-zinc-200 hover:border-zinc-700"
                >
                    View insights
                </Link>

                <Link
                    href={`/symptoms/new?date=${encodeURIComponent(
                        selectedDate
                    )}`}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                    Add symptoms
                </Link>
            </section>
        </main>
    );
}
