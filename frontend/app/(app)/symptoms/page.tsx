"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listSymptomLogs, SymptomLog } from "@/lib/symptoms";
import { ApiException } from "@/lib/api";
import { Card } from "@/components/ui/Card";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function dateOnly(isoLike: string): string {
    return isoLike.slice(0, 10);
}

function ymKeyFromISO(isoDay: string): string {
    return isoDay.slice(0, 7);
}

function monthLabelFromYM(ym: string): string {
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
    day: number,
): number {
    const dt = new Date(Date.UTC(y, m1to12 - 1, day));
    return dt.getUTCDay();
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

    const hasAnyEntry =
        (pain !== null && pain > 0) ||
        tagsCount > 0 ||
        (typeof log.notes === "string" && log.notes.trim().length > 0) ||
        (typeof log.mood === "string" && log.mood.trim().length > 0) ||
        typeof log.sleep_quality === "number" ||
        typeof log.stress_level === "number" ||
        (log.energy_level !== null && log.energy_level !== undefined);

    const highSymptoms = (pain !== null && pain >= 6) || tagsCount >= 4;

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

type MarkKind = "high" | "mild" | "energy";

function markClass(kind: MarkKind, on?: boolean) {
    const baseOff = "h-1.5 w-1.5 rounded-full bg-transparent";

    if (!on) return baseOff;

    if (kind === "high") {
        return "h-1.5 w-1.5 rounded-full bg-[var(--mark-high)] ring-2 ring-[var(--mark-ring)] shadow-[var(--mark-shadow)]";
    }

    if (kind === "mild") {
        return "h-1.5 w-1.5 rounded-full bg-[var(--mark-mild)] ring-2 ring-[var(--mark-ring)] opacity-70";
    }

    return "h-1.5 w-1.5 rounded-full bg-[var(--mark-energy)] ring-2 ring-[var(--mark-ring)] opacity-75";
}

function Mark({ kind, on }: { kind: MarkKind; on?: boolean }) {
    return <span className={markClass(kind, on)} aria-hidden />;
}

function IconChevronLeft({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function IconChevronRight({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

export default function TimelinePage() {
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(todayISO());
    const [selectedMonthYM, setSelectedMonthYM] = useState<string>(() =>
        ymKeyFromISO(todayISO()),
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

    const logByDay = useMemo(() => {
        const map = new Map<string, SymptomLog>();
        for (const l of logs) map.set(dateOnly(l.log_date), l);
        return map;
    }, [logs]);

    const recentEntries = useMemo(() => {
        const sorted = [...logs].sort((a, b) =>
            dateOnly(b.log_date).localeCompare(dateOnly(a.log_date)),
        );
        return sorted.slice(0, 4);
    }, [logs]);

    const calendarCells = useMemo(() => {
        const [yy, mm] = selectedMonthYM.split("-").map(Number);
        const y = yy;
        const m = mm;

        const firstWeekday = weekdayIndexSundayFirst(y, m, 1);
        const totalDays = daysInMonth(y, m);

        const cells: Array<
            | { kind: "empty"; key: string }
            | { kind: "day"; key: string; isoDay: string; dayNumber: number }
        > = [];

        for (let i = 0; i < firstWeekday; i++)
            cells.push({ kind: "empty", key: `e-${i}` });

        for (let day = 1; day <= totalDays; day++) {
            const isoDay = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            cells.push({ kind: "day", key: isoDay, isoDay, dayNumber: day });
        }

        return cells;
    }, [selectedMonthYM]);

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-28 pt-8">
            <div className="mx-auto w-full max-w-md">
                <header className="flex items-start justify-between">
                    <button
                        type="button"
                        onClick={() => history.back()}
                        className="h-10 w-10 rounded-full text-[var(--muted)]"
                        aria-label="Back"
                        title="Back"
                    >
                        <IconChevronLeft className="h-6 w-6" />
                    </button>

                    <div className="text-center">
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
                            History
                        </div>
                        <div className="mt-1 text-base text-[var(--muted)]">
                            {monthLabelFromYM(selectedMonthYM)}
                        </div>
                    </div>

                    <div className="h-10 w-10" aria-hidden="true" />
                </header>

                <section className="mt-6">
                    <h1 className="font-serif text-4xl leading-tight text-[var(--fg)]">
                        Your symptom timeline
                    </h1>
                    <p className="mt-2 text-base text-[var(--muted)]">
                        A gentle overview of patterns and changes over time.
                    </p>
                </section>

                <section className="mt-8">
                    <Card className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedMonthYM((prev) =>
                                        addMonthsYM(prev, -1),
                                    )
                                }
                                className="h-10 w-10 rounded-full text-[var(--muted)]"
                                aria-label="Previous month"
                                title="Previous month"
                            >
                                <IconChevronLeft className="h-6 w-6" />
                            </button>

                            <div className="text-base text-[var(--fg)]">
                                {monthLabelFromYM(selectedMonthYM)}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedMonthYM((prev) =>
                                        addMonthsYM(prev, 1),
                                    )
                                }
                                className="h-10 w-10 rounded-full text-[var(--muted)]"
                                aria-label="Next month"
                                title="Next month"
                            >
                                <IconChevronRight className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface)] px-4 py-4">
                            <div className="grid grid-cols-7 text-center text-xs text-[var(--subtle)]">
                                <div>S</div>
                                <div>M</div>
                                <div>T</div>
                                <div>W</div>
                                <div>T</div>
                                <div>F</div>
                                <div>S</div>
                            </div>

                            <div className="mt-4 grid grid-cols-7">
                                {calendarCells.map((cell) => {
                                    if (cell.kind === "empty") {
                                        return (
                                            <div
                                                key={cell.key}
                                                className="h-10"
                                            />
                                        );
                                    }

                                    const isSelected =
                                        cell.isoDay === selectedDate;
                                    const log = logByDay.get(cell.isoDay);
                                    const markers = log
                                        ? markersForLog(log)
                                        : null;

                                    return (
                                        <button
                                            key={cell.key}
                                            type="button"
                                            onClick={() =>
                                                setSelectedDate(cell.isoDay)
                                            }
                                            className="h-10 w-10 place-self-center rounded-full"
                                            aria-label={`Select ${cell.isoDay}`}
                                            aria-pressed={isSelected}
                                        >
                                            <div className="relative grid h-10 w-10 place-items-center">
                                                {isSelected ? (
                                                    <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-55" />
                                                ) : null}

                                                <div className="relative z-10 text-xs text-[var(--muted)]">
                                                    {cell.dayNumber}
                                                </div>

                                                <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
                                                    <Mark
                                                        kind="high"
                                                        on={
                                                            !!markers?.highSymptoms
                                                        }
                                                    />
                                                    <Mark
                                                        kind="energy"
                                                        on={
                                                            !!markers?.lowEnergy
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    <div className="mt-5 flex items-center justify-center gap-8 text-xs text-[var(--subtle)]">
                        <div className="flex items-center gap-2">
                            <Mark kind="high" on />
                            <span>High symptoms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mark kind="energy" on />
                            <span>Low energy</span>
                        </div>
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="font-serif text-3xl leading-tight text-[var(--fg)]">
                        Recent entries
                    </h2>

                    {error ? (
                        <Card className="mt-4 px-6 py-5">
                            <div className="text-base text-[var(--muted)]">
                                {error}
                            </div>
                        </Card>
                    ) : null}

                    {loading ? (
                        <div className="mt-4 text-base text-[var(--muted)]">
                            Loading…
                        </div>
                    ) : recentEntries.length === 0 ? (
                        <Card className="mt-4 px-6 py-6">
                            <div className="text-base text-[var(--fg)]">
                                No entries yet.
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                Start by adding symptoms or a quick check-in.
                            </div>
                        </Card>
                    ) : (
                        <ul className="mt-5 space-y-4">
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
                                            href={`/symptoms/new?date=${encodeURIComponent(isoDay)}`}
                                            className="block"
                                        >
                                            <Card className="px-6 py-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-base text-[var(--fg)]">
                                                            {rel ??
                                                                formatShortDate(
                                                                    isoDay,
                                                                )}
                                                        </div>
                                                        <div className="mt-1 text-sm text-[var(--muted)]">
                                                            {formatLongDate(
                                                                isoDay,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        className="h-5 w-5 text-[var(--subtle)]"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M9 18l6-6-6-6" />
                                                    </svg>
                                                </div>

                                                <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                                                    {showPain !== null ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mark
                                                                kind="mild"
                                                                on
                                                            />
                                                            <span>
                                                                Pain level:{" "}
                                                                {showPain}
                                                            </span>
                                                        </div>
                                                    ) : null}

                                                    {tagsLine ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mark
                                                                kind="high"
                                                                on
                                                            />
                                                            <span>
                                                                {tagsLine}
                                                            </span>
                                                        </div>
                                                    ) : null}

                                                    {showEnergy ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mark
                                                                kind="energy"
                                                                on
                                                            />
                                                            <span>
                                                                Energy:{" "}
                                                                {showEnergy}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </Card>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="mt-10 flex flex-col gap-4">
                    <Link
                        href="/insights"
                        className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--primary)_55%,var(--border)_45%)] bg-[color-mix(in_oklch,var(--primary)_10%,white_90%)] px-6 text-base font-medium text-[color-mix(in_oklch,var(--primary)_55%,var(--fg)_45%)] hover:opacity-95"
                    >
                        View insights
                    </Link>

                    <Link
                        href={`/symptoms/new?date=${encodeURIComponent(selectedDate)}`}
                        className="inline-flex h-14 w-full items-center justify-center rounded-full
    bg-[var(--primary)]
    px-6
    text-base font-medium
    text-[var(--primary-fg)]
    shadow-sm
    hover:opacity-90"
                    >
                        Add symptoms
                    </Link>
                </section>
            </div>
        </main>
    );
}
