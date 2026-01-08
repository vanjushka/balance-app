"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listSymptomLogs, deleteSymptomLog, SymptomLog } from "@/lib/symptoms";
import { ApiException } from "@/lib/api";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function dateOnly(isoLike: string): string {
    return isoLike.slice(0, 10);
}

function formatDate(isoDay: string) {
    const d = new Date(`${isoDay}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function capitalize(s?: string | null) {
    if (!s) return "—";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function show(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return "—";
    return String(value);
}

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
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

export default function SymptomsPage() {
    const [logs, setLogs] = useState<SymptomLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(todayISO());

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

    const logsForSelectedDate = useMemo(() => {
        return logs
            .filter((l) => dateOnly(l.log_date) === selectedDate)
            .sort((a, b) => b.id - a.id);
    }, [logs, selectedDate]);

    const onDelete = useCallback(
        async (id: number) => {
            setError(null);
            try {
                await deleteSymptomLog(id);
                setConfirmDeleteId(null);
                await load();
            } catch (err) {
                setError(errorMessage(err, "Failed to delete log"));
            }
        },
        [load]
    );

    const hasAnyLogs = logs.length > 0;

    return (
        <main className="space-y-6">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                        Timeline
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Track your daily log over time.
                    </p>
                </div>

                <Link
                    href={`/symptoms/new?date=${selectedDate}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 px-3 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                    Add
                </Link>
            </header>

            <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-zinc-100">
                            Selected day
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                            {formatDate(selectedDate)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedDate((prev) => addDaysISO(prev, -1))
                            }
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-700"
                        >
                            Prev
                        </button>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedDate((prev) => addDaysISO(prev, 1))
                            }
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-700"
                        >
                            Next
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelectedDate(todayISO())}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-700"
                    >
                        Today
                    </button>
                </div>
            </section>

            {error && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text-sm text-zinc-400">Loading…</p>
            ) : !hasAnyLogs ? (
                <p className="text-sm text-zinc-400">
                    No logs yet. Start by adding one.
                </p>
            ) : logsForSelectedDate.length === 0 ? (
                <p className="text-sm text-zinc-400">
                    No logs for this day. Add one to start tracking.
                </p>
            ) : (
                <ul className="space-y-3">
                    {logsForSelectedDate.map((l) => (
                        <li
                            key={l.id}
                            className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-100">
                                        {formatDate(dateOnly(l.log_date))}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Mood: {capitalize(l.mood)} · Energy:{" "}
                                        {show(l.energy_level)}
                                    </p>
                                </div>

                                {confirmDeleteId === l.id ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => void onDelete(l.id)}
                                            className="inline-flex h-8 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() =>
                                                setConfirmDeleteId(null)
                                            }
                                            className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-800 px-3 text-xs text-zinc-200 hover:border-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteId(l.id)}
                                        className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-800 px-3 text-xs text-zinc-200 hover:border-zinc-700"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-zinc-900 bg-black/20 px-3 py-2">
                                    <p className="text-[11px] text-zinc-400">
                                        Pain
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-100">
                                        {show(l.pain_intensity)}/10
                                    </p>
                                </div>
                                <div className="rounded-xl border border-zinc-900 bg-black/20 px-3 py-2">
                                    <p className="text-[11px] text-zinc-400">
                                        Sleep
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-100">
                                        {show(l.sleep_quality)}/10
                                    </p>
                                </div>
                                <div className="rounded-xl border border-zinc-900 bg-black/20 px-3 py-2">
                                    <p className="text-[11px] text-zinc-400">
                                        Stress
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-100">
                                        {show(l.stress_level)}/10
                                    </p>
                                </div>
                            </div>

                            {l.notes ? (
                                <p className="mt-4 text-sm text-zinc-200/90">
                                    {l.notes}
                                </p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
