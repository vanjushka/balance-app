"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiException, api } from "@/lib/api";
import { getMe, getProfileSummary, logout } from "@/lib/profile";

function errorMessage(err: unknown, fallback: string) {
    if (err instanceof ApiException) return err.message || fallback;
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}

function formatMonthYear(isoDate: string | null): string {
    if (!isoDate) return "—";
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
}

type RowProps = {
    label: string;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
    external?: boolean;
};

function Row({ label, onClick, href, danger, external }: RowProps) {
    const base = [
        "flex w-full items-center justify-between px-5 py-4 text-left",
        "hover:bg-zinc-50/60",
        danger ? "text-red-600" : "text-zinc-900",
    ].join(" ");

    if (href) {
        return (
            <a
                href={href}
                className={base}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
            >
                <span className="text-sm">{label}</span>
                <span className="text-zinc-400" aria-hidden>
                    ›
                </span>
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={base}>
            <span className="text-sm">{label}</span>
            <span className="text-zinc-400" aria-hidden>
                ›
            </span>
        </button>
    );
}

type ConfirmModalProps = {
    open: boolean;
    title: string;
    body: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
};

function ConfirmModal({
    open,
    title,
    body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger,
    loading,
    error,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {body}
                </p>

                {error && (
                    <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-11 flex-1 rounded-full border border-zinc-800 bg-zinc-950 text-sm text-zinc-200 hover:border-zinc-700 disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={[
                            "h-11 flex-1 rounded-full text-sm font-medium",
                            danger
                                ? "bg-red-600 text-white hover:bg-red-500"
                                : "bg-zinc-100 text-zinc-950 hover:bg-white",
                            loading ? "opacity-70" : "",
                        ].join(" ")}
                    >
                        {loading ? "Please wait…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [name, setName] = useState<string>("—");
    const [trackingSince, setTrackingSince] = useState<string | null>(null);
    const [daysTracked, setDaysTracked] = useState<number>(0);
    const [cyclesRecorded, setCyclesRecorded] = useState<number | null>(null);
    const [patternsDiscovered, setPatternsDiscovered] = useState<number | null>(
        null,
    );

    const [signOutLoading, setSignOutLoading] = useState(false);

    // Delete modal state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        async function load() {
            setErr(null);
            setLoading(true);

            try {
                const [me, summary] = await Promise.all([
                    getMe(),
                    getProfileSummary(),
                ]);

                if (!alive) return;

                const displayName =
                    me.user.profile?.name?.trim() || me.user.email;
                setName(displayName);

                setTrackingSince(summary.data.tracking_since);
                setDaysTracked(summary.data.days_tracked);
                setCyclesRecorded(summary.data.cycles_recorded);
                setPatternsDiscovered(summary.data.patterns_discovered);
            } catch (e) {
                if (!alive) return;
                setErr(errorMessage(e, "Failed to load profile."));
            } finally {
                if (alive) setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
    }, []);

    const trackingLabel = useMemo(() => {
        return `Tracking since ${formatMonthYear(trackingSince)}`;
    }, [trackingSince]);

    async function onSignOut() {
        setSignOutLoading(true);
        try {
            await logout();
            window.location.href = "/login";
        } catch (e) {
            setErr(errorMessage(e, "Sign out failed."));
        } finally {
            setSignOutLoading(false);
        }
    }

    function openDelete() {
        setDeleteError(null);
        setDeleteOpen(true);
    }

    function closeDelete() {
        if (deleteLoading) return;
        setDeleteOpen(false);
        setDeleteError(null);
    }

    async function onConfirmDelete() {
        setDeleteError(null);
        setDeleteLoading(true);

        try {
            // 1) delete account
            await api.delete("/api/user");

            // 2) make sure session is cleaned up (best effort)
            try {
                await logout();
            } catch {
                // ignore
            }

            // 3) redirect to public entry
            window.location.href = "/login";
        } catch (e) {
            setDeleteError(errorMessage(e, "Delete failed."));
        } finally {
            setDeleteLoading(false);
        }
    }

    const supportEmail = "support@balance.test"; // you can change later
    const helpCenterHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
        "Balance — Help Center",
    )}`;
    const feedbackHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
        "Balance — Feedback",
    )}`;

    return (
        <main className="min-h-[100dvh] bg-zinc-950 px-4 pb-28 pt-4 text-zinc-100">
            <header className="mb-6">
                <p className="text-sm text-zinc-400">Profile</p>
            </header>

            <section className="rounded-3xl bg-zinc-50 px-6 py-7 text-zinc-900">
                <h1 className="font-serif text-4xl tracking-tight">
                    Your space
                </h1>

                {err && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {err}
                    </div>
                )}

                <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                        {initials(name === "—" ? "User" : name)}
                    </div>

                    <div className="min-w-0">
                        <p className="text-base font-medium">{name}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                            {loading ? "Loading…" : trackingLabel}
                        </p>
                    </div>
                </div>

                {/* Your Journey */}
                <div className="mt-8 rounded-3xl bg-white px-5 py-5">
                    <p className="text-xs tracking-widest text-zinc-400">
                        YOUR JOURNEY
                    </p>

                    <div className="mt-5 space-y-6">
                        <div>
                            <p className="text-3xl font-medium">
                                {loading ? "—" : daysTracked}
                            </p>
                            <p className="text-sm text-zinc-500">
                                Days tracked
                            </p>
                        </div>

                        <div className="h-px bg-zinc-100" />

                        <div>
                            <p className="text-3xl font-medium">
                                {loading
                                    ? "—"
                                    : cyclesRecorded === null
                                      ? "—"
                                      : cyclesRecorded}
                            </p>
                            <p className="text-sm text-zinc-500">
                                Cycles recorded
                            </p>
                        </div>

                        <div className="h-px bg-zinc-100" />

                        <div>
                            <p className="text-3xl font-medium">
                                {loading
                                    ? "—"
                                    : patternsDiscovered === null
                                      ? "—"
                                      : patternsDiscovered}
                            </p>
                            <p className="text-sm text-zinc-500">
                                Patterns discovered
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="mt-6 overflow-hidden rounded-3xl bg-white">
                    <div className="px-5 pt-5">
                        <p className="text-xs tracking-widest text-zinc-400">
                            SETTINGS
                        </p>
                    </div>

                    <div className="mt-2 divide-y divide-zinc-100">
                        <Row
                            label="Notifications"
                            onClick={() => alert("Notifications (coming soon)")}
                        />
                        <Row
                            label="Delete Account"
                            danger
                            onClick={openDelete}
                        />
                        <Row label="Privacy" href="/privacy" />
                    </div>
                </div>

                {/* Support */}
                <div className="mt-6 overflow-hidden rounded-3xl bg-white">
                    <div className="px-5 pt-5">
                        <p className="text-xs tracking-widest text-zinc-400">
                            SUPPORT
                        </p>
                    </div>

                    <div className="mt-2 divide-y divide-zinc-100">
                        <Row label="Help center" href={helpCenterHref} />
                        <Row label="Send feedback" href={feedbackHref} />
                        <Row label="About" href="/about" />
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        type="button"
                        onClick={onSignOut}
                        disabled={signOutLoading}
                        className="text-sm text-zinc-400 hover:text-zinc-700 disabled:opacity-60"
                    >
                        {signOutLoading ? "Signing out…" : "Sign out"}
                    </button>
                </div>
            </section>

            <ConfirmModal
                open={deleteOpen}
                title="Delete account?"
                body="This will permanently delete your account and all associated data. This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                danger
                loading={deleteLoading}
                error={deleteError}
                onCancel={closeDelete}
                onConfirm={onConfirmDelete}
            />
        </main>
    );
}
