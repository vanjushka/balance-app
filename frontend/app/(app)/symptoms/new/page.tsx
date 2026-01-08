"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    createSymptomLog,
    listSymptomLogs,
    updateSymptomLog,
    SymptomLog,
} from "@/lib/symptoms";
import { ApiException } from "@/lib/api";

type FieldErrors = Record<string, string[]>;

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function normalizeErrors(err: unknown): {
    message: string;
    errors?: FieldErrors;
} {
    if (err instanceof ApiException) {
        return { message: err.message || "Request failed", errors: err.errors };
    }
    if (err instanceof Error) {
        return { message: err.message };
    }
    return { message: "Request failed" };
}

function isConflict409(err: unknown): boolean {
    if (!(err instanceof ApiException)) return false;

    if ("status" in err && typeof err.status === "number") {
        return err.status === 409;
    }

    if ("statusCode" in err && typeof err.statusCode === "number") {
        return err.statusCode === 409;
    }

    if ("code" in err && typeof err.code === "number") {
        return err.code === 409;
    }

    return false;
}

export default function NewSymptomPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialDate = useMemo(() => {
        const q = searchParams.get("date");
        return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : todayISO();
    }, [searchParams]);

    const [logDate, setLogDate] = useState(initialDate);

    const [painIntensity, setPainIntensity] = useState(5);
    const [sleepQuality, setSleepQuality] = useState(5);
    const [stressLevel, setStressLevel] = useState(5);

    const [mood, setMood] = useState<string>("");
    const [energyLevel, setEnergyLevel] = useState<string>("");

    const [notes, setNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // ✅ Edit mode state
    const [editId, setEditId] = useState<number | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    function fillFormFromLog(log: SymptomLog) {
        setEditId(log.id);
        setLogDate(log.log_date);

        setPainIntensity(Number(log.pain_intensity ?? 5));
        setSleepQuality(Number(log.sleep_quality ?? 5));
        setStressLevel(Number(log.stress_level ?? 5));

        setMood(log.mood ?? "");
        setEnergyLevel(log.energy_level ?? "");

        setNotes(log.notes ?? "");
    }

    async function loadExistingForDate(date: string) {
        const all = await listSymptomLogs();
        const existing = all.find((l) => l.log_date === date);

        if (!existing) {
            setFormError(
                "A log already exists for this date, but it could not be loaded."
            );
            return;
        }

        fillFormFromLog(existing);
        setInfo("Existing log loaded. You are now editing it.");
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setFieldErrors({});
        setInfo(null);
        setSubmitting(true);

        const payload = {
            log_date: logDate,
            pain_intensity: painIntensity,
            sleep_quality: sleepQuality,
            stress_level: stressLevel,
            mood: mood || undefined,
            energy_level: energyLevel || undefined,
            notes: notes.trim() || undefined,
        };

        try {
            if (editId) {
                await updateSymptomLog(editId, payload);
            } else {
                await createSymptomLog(payload);
            }

            router.replace("/symptoms");
        } catch (err) {
            // ✅ 409 => switch to edit mode instead of showing an error
            if (!editId && isConflict409(err)) {
                try {
                    await loadExistingForDate(logDate);
                } catch (loadErr) {
                    const normalized = normalizeErrors(loadErr);
                    setFormError(normalized.message);
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            const normalized = normalizeErrors(err);
            setFormError(normalized.message);
            if (normalized.errors) setFieldErrors(normalized.errors);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-6 py-10">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                        {editId ? "Edit symptoms" : "Log symptoms"}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Track how you feel for a specific day.
                    </p>
                </div>

                <Link
                    href="/symptoms"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-200 hover:border-zinc-700"
                >
                    Back
                </Link>
            </div>

            {info && (
                <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                    {info}
                </div>
            )}

            {formError && (
                <div className="mt-6 rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    {formError}
                </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-6">
                <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <h2 className="text-sm font-medium text-zinc-100">Date</h2>
                    <div className="mt-3">
                        <label className="block text-xs text-zinc-400">
                            Log date
                        </label>
                        <input
                            type="date"
                            value={logDate}
                            onChange={(e) => {
                                setLogDate(e.target.value);
                                // If user changes date manually, reset edit mode (we don't know the id for new date)
                                setEditId(null);
                                setInfo(null);
                            }}
                            className="mt-2 h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                            required
                        />
                        {fieldErrors.log_date?.[0] && (
                            <p className="mt-2 text-xs text-red-200">
                                {fieldErrors.log_date[0]}
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <h2 className="text-sm font-medium text-zinc-100">
                        Today overview
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                        Use sliders for quick logging. You can refine later.
                    </p>

                    <div className="mt-5 grid gap-5">
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-zinc-200">
                                    Pain intensity
                                </label>
                                <span className="text-sm text-zinc-100">
                                    {painIntensity}/10
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={painIntensity}
                                onChange={(e) =>
                                    setPainIntensity(Number(e.target.value))
                                }
                                className="mt-3 w-full"
                            />
                            {fieldErrors.pain_intensity?.[0] && (
                                <p className="mt-2 text-xs text-red-200">
                                    {fieldErrors.pain_intensity[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-zinc-200">
                                    Sleep quality
                                </label>
                                <span className="text-sm text-zinc-100">
                                    {sleepQuality}/10
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={sleepQuality}
                                onChange={(e) =>
                                    setSleepQuality(Number(e.target.value))
                                }
                                className="mt-3 w-full"
                            />
                            {fieldErrors.sleep_quality?.[0] && (
                                <p className="mt-2 text-xs text-red-200">
                                    {fieldErrors.sleep_quality[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-zinc-200">
                                    Stress level
                                </label>
                                <span className="text-sm text-zinc-100">
                                    {stressLevel}/10
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={stressLevel}
                                onChange={(e) =>
                                    setStressLevel(Number(e.target.value))
                                }
                                className="mt-3 w-full"
                            />
                            {fieldErrors.stress_level?.[0] && (
                                <p className="mt-2 text-xs text-red-200">
                                    {fieldErrors.stress_level[0]}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm text-zinc-200">
                                    Mood
                                </label>
                                <select
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                    className="mt-2 h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                                >
                                    <option value="">Select…</option>
                                    <option value="calm">Calm</option>
                                    <option value="stressed">Stressed</option>
                                    <option value="sad">Sad</option>
                                    <option value="happy">Happy</option>
                                </select>
                                {fieldErrors.mood?.[0] && (
                                    <p className="mt-2 text-xs text-red-200">
                                        {fieldErrors.mood[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-200">
                                    Energy level
                                </label>
                                <select
                                    value={energyLevel}
                                    onChange={(e) =>
                                        setEnergyLevel(e.target.value)
                                    }
                                    className="mt-2 h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                                >
                                    <option value="">Select…</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                {fieldErrors.energy_level?.[0] && (
                                    <p className="mt-2 text-xs text-red-200">
                                        {fieldErrors.energy_level[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                    <h2 className="text-sm font-medium text-zinc-100">Notes</h2>
                    <div className="mt-3">
                        <label className="block text-xs text-zinc-400">
                            Optional
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="mt-2 w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                            placeholder="Anything notable about today?"
                        />
                        {fieldErrors.notes?.[0] && (
                            <p className="mt-2 text-xs text-red-200">
                                {fieldErrors.notes[0]}
                            </p>
                        )}
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/symptoms"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 px-4 text-sm text-zinc-200 hover:border-zinc-700"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : editId ? "Update" : "Save"}
                    </button>
                </div>
            </form>
        </main>
    );
}
