"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiException } from "@/lib/api";
import {
    createSymptomLog,
    listSymptomLogsForDate,
    updateSymptomLog,
    type CreateSymptomLogPayload,
    type EnergyLevel,
} from "@/lib/symptoms";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function formatHeaderDate(isoDay: string) {
    const d = new Date(`${isoDay}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
}

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}

const ENERGY_OPTIONS: Array<{ label: string; value: EnergyLevel }> = [
    { label: "Depleted", value: "depleted" },
    { label: "Low", value: "low" },
    { label: "Moderate", value: "moderate" },
    { label: "Good", value: "good" },
    { label: "Energized", value: "energized" },
];

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const today = useMemo(() => todayISO(), []);

    const [pain, setPain] = useState<number | null>(null);
    const [energy, setEnergy] = useState<EnergyLevel | null>(null);
    const [note, setNote] = useState("");

    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    if (loading) {
        return (
            <main>
                <p className="text-sm text-zinc-400">Loading…</p>
            </main>
        );
    }

    if (!user) return null;

    async function saveCheckIn() {
        setSaveError(null);
        setSaveSuccess(null);

        if (pain === null) {
            setSaveError("Please select a pain level (1–10).");
            return;
        }

        setSaveLoading(true);

        const payload: CreateSymptomLogPayload = {
            log_date: today,
            pain_intensity: pain,
            energy_level: energy ?? null,
            notes: note.trim() ? note.trim() : null,
        };

        try {
            await createSymptomLog(payload);
            setSaveSuccess("Saved.");
        } catch (err) {
            if (err instanceof ApiException && err.status === 409) {
                try {
                    const existing = await listSymptomLogsForDate(today);
                    const target = existing[0];
                    if (!target) throw err;

                    await updateSymptomLog(target.id, payload);
                    setSaveSuccess("Updated.");
                } catch (inner) {
                    setSaveError(
                        errorMessage(inner, "Failed to update check-in")
                    );
                } finally {
                    setSaveLoading(false);
                }
                return;
            }

            setSaveError(errorMessage(err, "Failed to save check-in"));
        } finally {
            setSaveLoading(false);
        }
    }

    function skipToday() {
        setPain(null);
        setEnergy(null);
        setNote("");
        setSaveError(null);
        setSaveSuccess(null);
    }

    return (
        <main className="space-y-6">
            <header className="pt-1">
                <div className="flex items-start justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Back"
                        title="Back"
                    >
                        <span className="text-xl">‹</span>
                    </button>

                    <div className="text-right">
                        <p className="text-[11px] tracking-widest text-zinc-500">
                            TODAY
                        </p>
                        <p className="text-sm text-zinc-300">
                            {formatHeaderDate(today)}
                        </p>
                    </div>
                </div>
            </header>

            <section className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
                    How are you feeling today?
                </h1>
                <p className="text-sm text-zinc-400">
                    A quick check-in. No pressure.
                </p>
            </section>

            <section className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-zinc-100">
                        Pain level
                    </p>
                    <p className="text-xs text-zinc-400">
                        How intense was any discomfort?
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
                    <div className="text-center">
                        <div className="text-4xl font-semibold text-zinc-500">
                            {pain ?? "—"}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                            (n) => {
                                const active = pain === n;
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setPain(n)}
                                        className={[
                                            "h-2.5 w-2.5 rounded-full transition",
                                            active
                                                ? "bg-zinc-100"
                                                : "bg-zinc-800 hover:bg-zinc-700",
                                        ].join(" ")}
                                        aria-label={`Pain ${n}`}
                                        aria-pressed={active}
                                    />
                                );
                            }
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>None</span>
                        <span>Severe</span>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-zinc-100">Energy</p>
                    <p className="text-xs text-zinc-400">
                        How are you feeling overall?
                    </p>
                </div>

                <div className="space-y-2">
                    {ENERGY_OPTIONS.map((opt) => {
                        const active = energy === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                    setEnergy((prev) =>
                                        prev === opt.value ? null : opt.value
                                    )
                                }
                                className={[
                                    "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                                    active
                                        ? "border-zinc-100 bg-zinc-900 text-zinc-100"
                                        : "border-zinc-900 bg-zinc-950 text-zinc-200 hover:border-zinc-800",
                                ].join(" ")}
                                aria-pressed={active}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-2">
                <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium text-zinc-100">Note</p>
                    <p className="text-xs text-zinc-500">(optional)</p>
                </div>

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-zinc-900 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                    placeholder="Write here if you’d like…"
                />
            </section>

            {saveError && (
                <div className="rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {saveError}
                </div>
            )}
            {saveSuccess && (
                <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
                    {saveSuccess}
                </div>
            )}

            <div className="space-y-3 pt-2">
                <button
                    type="button"
                    onClick={() => void saveCheckIn()}
                    disabled={saveLoading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {saveLoading ? "Saving…" : "Save check-in"}
                </button>

                <Link
                    href={`/symptoms/new?date=${today}`}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-sm font-medium text-zinc-200 hover:border-zinc-700"
                >
                    Add symptoms
                </Link>

                <button
                    type="button"
                    onClick={skipToday}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                >
                    Skip for today
                </button>
            </div>
        </main>
    );
}
