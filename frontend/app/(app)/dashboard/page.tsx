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

    const displayName = user.profile?.display_name?.trim() || "";

    async function saveCheckIn() {
        setSaveError(null);
        setSaveSuccess(null);

        if (pain === null) {
            setSaveError("Please select a pain level (1–10).");
            return;
        }

        if (energy === null) {
            setSaveError("Please select an energy level.");
            return;
        }

        setSaveLoading(true);

        const payload: CreateSymptomLogPayload = {
            log_date: today,
            pain_intensity: pain,
            energy_level: energy,
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
                        errorMessage(inner, "Failed to update check-in"),
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

        router.replace("/symptoms");
    }

    return (
        <main className="space-y-10">
            <header className="pt-1">
                <div className="flex items-start justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]"
                        aria-label="Back"
                        title="Back"
                    >
                        <span className="text-2xl leading-none">‹</span>
                    </button>

                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                            TODAY
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {formatHeaderDate(today)}
                        </p>
                    </div>

                    <span className="h-10 w-10" aria-hidden />
                </div>
            </header>

            <section className="space-y-3">
                <h1 className="font-serif text-[2.65rem] leading-[1.03] tracking-tight text-[var(--fg)]">
                    How are you feeling today
                    {displayName ? `, ${displayName}` : ""}?
                </h1>
                <p className="text-[15px] leading-relaxed text-[var(--muted)]">
                    A gentle moment to acknowledge what you are noticing.
                </p>
            </section>

            <section className="space-y-4">
                <div>
                    <p className="text-[15px] font-medium text-[var(--fg)]">
                        Pain level
                    </p>
                    <p className="mt-1 text-xs text-[var(--subtle)]">
                        How intense was any discomfort?
                    </p>
                </div>

                <div className="rounded-[var(--radius-card)] border border-transparent bg-[var(--surface)] px-6 py-7 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                    <div className="text-center">
                        <div className="text-4xl font-medium text-[color-mix(in_oklch,var(--primary)_55%,var(--fg)_45%)]">
                            {pain ?? "—"}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-end justify-between">
                            <p className="text-xs text-[var(--subtle)]">None</p>
                            <p className="text-xs text-[var(--subtle)]">
                                Severe
                            </p>
                        </div>

                        <div className="mt-3">
                            <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={pain ?? 1}
                                onChange={(e) =>
                                    setPain(Number(e.target.value))
                                }
                                aria-label="Pain level"
                                className="pain-slider w-full"
                                style={
                                    {
                                        ["--p" as never]: String(
                                            ((pain ?? 1) - 1) / 9,
                                        ),
                                    } as React.CSSProperties
                                }
                            />

                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--subtle)]">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--subtle)]">
                        <span>None</span>
                        <span>Severe</span>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <p className="text-[15px] font-medium text-[var(--fg)]">
                        Energy
                    </p>
                    <p className="mt-1 text-xs text-[var(--subtle)]">
                        How are you feeling overall?
                    </p>
                </div>

                <div className="space-y-3">
                    {ENERGY_OPTIONS.map((opt) => {
                        const active = energy === opt.value;

                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                    setEnergy((prev) =>
                                        prev === opt.value ? null : opt.value,
                                    )
                                }
                                className={[
                                    "w-full rounded-[22px] border px-5 py-4 text-left text-sm transition",
                                    active
                                        ? [
                                              "border-[color-mix(in_oklch,var(--primary)_60%,var(--border)_40%)]",
                                              "bg-[color-mix(in_oklch,var(--primary)_10%,white_90%)]",
                                              "text-[var(--fg)]",
                                          ].join(" ")
                                        : [
                                              "border-[var(--border)]",
                                              "bg-[var(--surface)]",
                                              "text-[var(--muted)]",
                                              "hover:border-[color-mix(in_oklch,var(--primary)_35%,var(--border)_65%)]",
                                          ].join(" "),
                                ].join(" ")}
                                aria-pressed={active}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-baseline gap-2">
                    <p className="text-[15px] font-medium text-[var(--fg)]">
                        Note
                    </p>
                    <p className="text-xs text-[var(--subtle)]">(optional)</p>
                </div>

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="w-full rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--fg)] outline-none focus:border-[color-mix(in_oklch,var(--primary)_45%,var(--border)_55%)]"
                    placeholder="Write here if you’d like…"
                />
            </section>

            {saveError && (
                <div className="rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {saveError}
                </div>
            )}

            {saveSuccess && (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                    {saveSuccess}
                </div>
            )}

            <div className="space-y-3 pt-2">
                <button
                    type="button"
                    onClick={() => void saveCheckIn()}
                    disabled={saveLoading}
                    className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 text-base font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saveLoading ? "Saving…" : "Save check-in"}
                </button>

                <Link
                    href={`/symptoms/new?date=${today}`}
                    className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--primary)_55%,var(--border)_45%)] bg-[color-mix(in_oklch,var(--primary)_10%,white_90%)] px-6 text-base font-medium text-[color-mix(in_oklch,var(--primary)_55%,var(--fg)_45%)] hover:opacity-95"
                >
                    Add symptoms
                </Link>

                <button
                    type="button"
                    onClick={skipToday}
                    className="w-full text-center text-xs text-[var(--subtle)] hover:text-[var(--muted)]"
                >
                    Skip for today
                </button>
            </div>
        </main>
    );
}
