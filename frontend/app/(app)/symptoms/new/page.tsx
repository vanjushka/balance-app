"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function isToday(isoDay: string): boolean {
    return isoDay === todayISO();
}

function formatHeaderDate(isoDay: string): string {
    const d = new Date(`${isoDay}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
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

const GROUP_HELPER: Record<string, string> = {
    Physical: "Common body sensations",
    "Skin & hair": "Changes you’re noticing",
    Digestive: "Gut and digestion",
    Emotional: "How you’re feeling",
    "Sleep & rest": "Quality of rest",
    "Cycle irregularities": "Patterns you’re tracking",
};

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

    const [loadingExisting, setLoadingExisting] = useState(false);

    const selectedCount = selected.size;

    async function loadExistingForDate(
        date: string,
    ): Promise<SymptomLog | null> {
        const existing = await listSymptomLogsForDate(date);
        const first = existing[0] ?? null;
        return first;
    }

    useEffect(() => {
        let alive = true;

        async function hydrateFromExisting(date: string) {
            setLoadingExisting(true);
            setFormError(null);
            setFieldErrors({});

            try {
                const existing = await loadExistingForDate(date);
                if (!alive) return;

                if (existing && Array.isArray(existing.tags_json)) {
                    setSelected(new Set(existing.tags_json));
                    setInfo("Loaded existing entry for this date.");
                } else {
                    setSelected(new Set());
                    setInfo(null);
                }
            } catch (e) {
                if (!alive) return;
                setSelected(new Set());
                setInfo(null);
            } finally {
                if (alive) setLoadingExisting(false);
            }
        }

        void hydrateFromExisting(logDate);

        return () => {
            alive = false;
        };
    }, [logDate]);

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
            routerReplace(`/symptoms?date=${encodeURIComponent(logDate)}`);
        } catch (err) {
            if (isConflict409(err)) {
                try {
                    const existing = await loadExistingForDate(logDate);
                    if (!existing) {
                        setFormError(
                            "A log for this date exists, but it could not be loaded.",
                        );
                        return;
                    }

                    await updateSymptomLog(existing.id, {
                        tags_json: payload.tags_json,
                    });

                    routerReplace(
                        `/symptoms?date=${encodeURIComponent(logDate)}`,
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

    function routerReplace(href: string) {
        window.location.href = href;
    }

    function clearAll() {
        setSelected(new Set());
        setInfo(null);
        setFormError(null);
        setFieldErrors({});
    }

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-32 pt-6">
            <div className="mx-auto w-full max-w-md">
                <header className="flex items-start justify-between">
                    <Link
                        href={`/symptoms?date=${encodeURIComponent(logDate)}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]"
                        aria-label="Back"
                        title="Back"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </Link>

                    <div className="text-center">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                            {isToday(logDate) ? "Today" : "Date"}
                        </div>
                        <div className="mt-1 text-sm text-[var(--muted)]">
                            {formatHeaderDate(logDate)}
                        </div>
                    </div>

                    <div className="h-10 w-10" aria-hidden="true" />
                </header>

                <section className="mt-8">
                    <h1 className="font-serif text-[2.65rem] leading-[1.03] tracking-tight text-[var(--fg)]">
                        What are you noticing today?
                    </h1>
                    <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
                        Select any symptoms you are experiencing. Tap to add or
                        remove.
                    </p>
                </section>

                {loadingExisting ? (
                    <div className="mt-6 text-sm text-[var(--muted)]">
                        Loading entry…
                    </div>
                ) : null}

                {info && (
                    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted)]">
                        {info}
                    </div>
                )}

                {formError && (
                    <div className="mt-6 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {formError}
                    </div>
                )}

                <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                                Date
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                                {logDate}
                            </p>
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
                            className="h-9 rounded-full border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                            required
                        />
                    </div>

                    {fieldErrors.log_date?.[0] && (
                        <p className="mt-3 text-xs text-red-600">
                            {fieldErrors.log_date[0]}
                        </p>
                    )}
                </section>

                <div className="mt-10 space-y-10">
                    {GROUPS.map((g) => (
                        <section key={g.title} className="space-y-4">
                            <div>
                                <h2 className="!font-sans text-[15px] font-medium leading-tight text-[var(--fg)]">
                                    {g.title}
                                </h2>

                                {GROUP_HELPER[g.title] ? (
                                    <p className="mt-1 text-xs text-[var(--subtle)]">
                                        {GROUP_HELPER[g.title]}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {g.items.map((it) => {
                                    const active = selected.has(it.key);

                                    return (
                                        <button
                                            key={it.key}
                                            type="button"
                                            onClick={() =>
                                                setSelected((prev) =>
                                                    toggle(prev, it.key),
                                                )
                                            }
                                            className={[
                                                "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition",
                                                "font-sans",
                                                "active:scale-[0.99]",
                                                active
                                                    ? [
                                                          "border-[color-mix(in_oklch,var(--primary)_78%,var(--border)_22%)]",
                                                          "bg-[color-mix(in_oklch,var(--primary)_26%,white_74%)]",
                                                          "text-[color-mix(in_oklch,var(--primary)_62%,var(--fg)_38%)]",
                                                      ].join(" ")
                                                    : [
                                                          "border-[var(--border)]",
                                                          "bg-[var(--surface)]",
                                                          "text-[var(--muted)]",
                                                          "hover:border-[color-mix(in_oklch,var(--primary)_45%,var(--border)_55%)]",
                                                      ].join(" "),
                                            ].join(" ")}
                                            aria-pressed={active}
                                        >
                                            <span>{it.label}</span>

                                            {active ? (
                                                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center">
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        className="h-4 w-4 text-[color-mix(in_oklch,var(--primary)_78%,var(--fg)_22%)]"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.4"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {fieldErrors.tags_json?.[0] && (
                    <p className="mt-6 text-sm text-red-600">
                        {fieldErrors.tags_json[0]}
                    </p>
                )}
                {fieldErrors["tags_json.*"]?.[0] && (
                    <p className="mt-2 text-sm text-red-600">
                        {fieldErrors["tags_json.*"][0]}
                    </p>
                )}

                <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_88%,var(--bg)_12%)] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                                Selected symptoms
                            </div>
                            <div className="mt-2 text-2xl text-[var(--primary)]">
                                {selectedCount}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs text-[var(--muted)] underline underline-offset-4 hover:text-[var(--fg)]"
                        >
                            Clear all
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => void saveTags()}
                        disabled={submitting}
                        className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-base font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
                    >
                        {submitting ? "Saving…" : "Save"}
                    </button>

                    <Link
                        href={`/symptoms?date=${encodeURIComponent(logDate)}`}
                        className="text-center text-sm text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                        Cancel
                    </Link>
                </div>
            </div>
        </main>
    );
}
