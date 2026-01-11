"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    createSymptomLog,
    listSymptomLogsForDate,
    updateSymptomLog,
    SymptomLog,
} from "@/lib/symptoms";
import { ApiException } from "@/lib/api";

type FieldErrors = Record<string, string[]>;

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function isConflict409(err: unknown): boolean {
    return err instanceof ApiException && err.status === 409;
}

const GROUPS: Array<{
    title: string;
    items: Array<{ key: string; label: string }>;
}> = [
    {
        title: "Physical",
        items: [
            { key: "cramps", label: "Cramps" },
            { key: "bloating", label: "Bloating" },
            { key: "fatigue", label: "Fatigue" },
            { key: "headache", label: "Headache" },
            { key: "back_pain", label: "Back pain" },
            { key: "joint_pain", label: "Joint pain" },
            { key: "breast_tenderness", label: "Breast tenderness" },
            { key: "nausea", label: "Nausea" },
            { key: "dizziness", label: "Dizziness" },
        ],
    },
    {
        title: "Skin & hair",
        items: [
            { key: "acne", label: "Acne" },
            { key: "oily_skin", label: "Oily skin" },
            { key: "dry_skin", label: "Dry skin" },
            { key: "hair_loss", label: "Hair loss" },
            { key: "excess_hair_growth", label: "Excess hair growth" },
        ],
    },
    {
        title: "Digestive",
        items: [
            { key: "constipation", label: "Constipation" },
            { key: "diarrhea", label: "Diarrhea" },
            { key: "gas", label: "Gas" },
            { key: "stomach_pain", label: "Stomach pain" },
        ],
    },
    {
        title: "Emotional",
        items: [
            { key: "anxious", label: "Anxious" },
            { key: "irritable", label: "Irritable" },
            { key: "low_mood", label: "Low mood" },
            { key: "brain_fog", label: "Brain fog" },
            { key: "mood_swings", label: "Mood swings" },
        ],
    },
    {
        title: "Sleep & rest",
        items: [
            { key: "insomnia", label: "Insomnia" },
            { key: "restless_sleep", label: "Restless sleep" },
            { key: "night_sweats", label: "Night sweats" },
        ],
    },
    {
        title: "Cycle irregularities",
        items: [
            { key: "heavy_flow", label: "Heavy flow" },
            { key: "light_flow", label: "Light flow" },
            { key: "spotting", label: "Spotting" },
            { key: "missed_period", label: "Missed period" },
            { key: "irregular_cycle", label: "Irregular cycle" },
            { key: "clotting", label: "Clotting" },
        ],
    },
];

function toggle(set: Set<string>, key: string): Set<string> {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
}

function normalizeErrors(err: unknown): {
    message: string;
    errors?: FieldErrors;
} {
    if (err instanceof ApiException) {
        return { message: err.message || "Request failed", errors: err.errors };
    }
    if (err instanceof Error) return { message: err.message };
    return { message: "Request failed" };
}

export default function NewSymptomPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialDate = useMemo(() => {
        const q = searchParams.get("date");
        return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : todayISO();
    }, [searchParams]);

    const [logDate, setLogDate] = useState(initialDate);

    const [selected, setSelected] = useState<Set<string>>(new Set());

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [info, setInfo] = useState<string | null>(null);

    const selectedCount = selected.size;

    async function loadExistingForDate(
        date: string
    ): Promise<SymptomLog | null> {
        const existing = await listSymptomLogsForDate(date);
        const first = existing[0] ?? null;
        return first;
    }

    async function saveTags() {
        setFormError(null);
        setFieldErrors({});
        setInfo(null);
        setSubmitting(true);

        const payload = {
            log_date: logDate,
            tags_json: Array.from(selected),
        };

        try {
            await createSymptomLog(payload);
            router.replace(`/symptoms?date=${encodeURIComponent(logDate)}`);
        } catch (err) {
            if (isConflict409(err)) {
                try {
                    const existing = await loadExistingForDate(logDate);
                    if (!existing) {
                        setFormError(
                            "A log for this date exists, but it could not be loaded."
                        );
                        return;
                    }

                    await updateSymptomLog(existing.id, {
                        tags_json: payload.tags_json,
                    });

                    router.replace(
                        `/symptoms?date=${encodeURIComponent(logDate)}`
                    );
                } catch (inner) {
                    const n = normalizeErrors(inner);
                    setFormError(n.message);
                    if (n.errors) setFieldErrors(n.errors);
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            const n = normalizeErrors(err);
            setFormError(n.message);
            if (n.errors) setFieldErrors(n.errors);
        } finally {
            setSubmitting(false);
        }
    }

    function clearAll() {
        setSelected(new Set());
        setInfo(null);
        setFormError(null);
        setFieldErrors({});
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-6 py-10">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                        Symptoms
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Select what applies for the day.
                    </p>
                </div>

                <Link
                    href={`/symptoms?date=${encodeURIComponent(logDate)}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm text-zinc-200 hover:border-zinc-700"
                >
                    Back
                </Link>
            </header>

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

            <section className="mt-6 rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-zinc-100">
                            Date
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">{logDate}</p>
                    </div>

                    <input
                        type="date"
                        value={logDate}
                        onChange={(e) => {
                            setLogDate(e.target.value);
                            setInfo(null);
                            setFormError(null);
                            setFieldErrors({});
                        }}
                        className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        required
                    />
                </div>

                {fieldErrors.log_date?.[0] && (
                    <p className="mt-3 text-xs text-red-200">
                        {fieldErrors.log_date[0]}
                    </p>
                )}
            </section>

            <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">
                    Selected:{" "}
                    <span className="text-zinc-100">{selectedCount}</span>
                </p>

                <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-zinc-300 underline underline-offset-4 hover:text-white"
                >
                    Clear all
                </button>
            </div>

            <div className="mt-6 space-y-6">
                {GROUPS.map((g) => (
                    <section key={g.title} className="space-y-3">
                        <h2 className="text-sm font-medium text-zinc-100">
                            {g.title}
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            {g.items.map((it) => {
                                const active = selected.has(it.key);
                                return (
                                    <button
                                        key={it.key}
                                        type="button"
                                        onClick={() =>
                                            setSelected((prev) =>
                                                toggle(prev, it.key)
                                            )
                                        }
                                        className={[
                                            "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition",
                                            active
                                                ? "border-zinc-100 bg-zinc-900 text-zinc-100"
                                                : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700",
                                        ].join(" ")}
                                        aria-pressed={active}
                                    >
                                        {it.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {fieldErrors.tags_json?.[0] && (
                <p className="mt-6 text-sm text-red-200">
                    {fieldErrors.tags_json[0]}
                </p>
            )}
            {fieldErrors["tags_json.*"]?.[0] && (
                <p className="mt-2 text-sm text-red-200">
                    {fieldErrors["tags_json.*"][0]}
                </p>
            )}

            <div className="mt-8 flex items-center justify-end gap-3">
                <Link
                    href={`/symptoms?date=${encodeURIComponent(logDate)}`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 px-4 text-sm text-zinc-200 hover:border-zinc-700"
                >
                    Cancel
                </Link>

                <button
                    type="button"
                    onClick={() => void saveTags()}
                    disabled={submitting}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Saving…" : "Save"}
                </button>
            </div>
        </main>
    );
}
