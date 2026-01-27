"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiException, api } from "@/lib/api";
import { getMe, getProfileSummary, logout } from "@/lib/profile";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { ConfirmModal } from "@/components/ui/Modal";

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

function JourneyRow({
    value,
    label,
}: {
    value: React.ReactNode;
    label: string;
}) {
    return (
        <div className="px-6 py-6">
            <div className="text-3xl leading-none text-[var(--fg)]">
                {value}
            </div>
            <div className="mt-2 text-base text-[var(--muted)]">{label}</div>
        </div>
    );
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [name, setName] = useState("—");
    const [trackingSince, setTrackingSince] = useState<string | null>(null);
    const [daysTracked, setDaysTracked] = useState<number>(0);
    const [cyclesRecorded, setCyclesRecorded] = useState<number | null>(null);
    const [patternsDiscovered, setPatternsDiscovered] = useState<number | null>(
        null,
    );

    const [signOutLoading, setSignOutLoading] = useState(false);
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
                    me.user.profile?.display_name?.trim() || me.user.email;

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

    async function onConfirmDelete() {
        setDeleteError(null);
        setDeleteLoading(true);
        try {
            await api.delete("/api/user");
            try {
                await logout();
            } catch {}
            window.location.href = "/login";
        } catch (e) {
            setDeleteError(errorMessage(e, "Delete failed."));
        } finally {
            setDeleteLoading(false);
        }
    }

    const supportEmail = "support@balance.test";
    const helpCenterHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
        "Balance — Help Center",
    )}`;
    const feedbackHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
        "Balance — Feedback",
    )}`;

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-28 pt-10">
            <div className="mx-auto w-full max-w-md">
                <h1 className="font-serif text-4xl leading-tight text-[var(--fg)]">
                    Your space
                </h1>

                {err && (
                    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted)]">
                        {err}
                    </div>
                )}

                <div className="mt-10 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-medium text-[var(--muted)]">
                        {initials(name === "—" ? "User" : name)}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-lg text-[var(--fg)]">
                            {name}
                        </div>
                        <div className="mt-1 text-base text-[var(--muted)]">
                            {loading ? "Loading…" : trackingLabel}
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-6">
                    <Card className="overflow-hidden">
                        <div className="px-6 pt-6">
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
                                Your journey
                            </div>
                        </div>
                        <JourneyRow
                            value={loading ? "—" : daysTracked}
                            label="Days tracked"
                        />
                        <div className="h-px bg-[var(--border)] mx-6" />
                        <JourneyRow
                            value={loading ? "—" : (cyclesRecorded ?? "—")}
                            label="Cycles recorded"
                        />
                        <div className="h-px bg-[var(--border)] mx-6" />
                        <JourneyRow
                            value={loading ? "—" : (patternsDiscovered ?? "—")}
                            label="Patterns discovered"
                        />
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="px-6 pt-6">
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
                                Settings
                            </div>
                        </div>
                        <div className="mt-2">
                            <ListItem
                                label="Notifications"
                                onClick={() =>
                                    alert("Notifications (coming soon)")
                                }
                            />
                            <div className="h-px bg-[var(--border)] mx-6" />
                            <ListItem
                                label="Delete Account"
                                tone="danger"
                                onClick={() => setDeleteOpen(true)}
                            />
                            <div className="h-px bg-[var(--border)] mx-6" />
                            <ListItem label="Privacy" href="/privacy" />
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="px-6 pt-6">
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
                                Support
                            </div>
                        </div>
                        <div className="mt-2">
                            <ListItem
                                label="Help center"
                                href={helpCenterHref}
                                external
                            />
                            <div className="h-px bg-[var(--border)] mx-6" />
                            <ListItem
                                label="Send feedback"
                                href={feedbackHref}
                                external
                            />
                            <div className="h-px bg-[var(--border)] mx-6" />
                            <ListItem label="About" href="/about" />
                        </div>
                    </Card>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onSignOut}
                            disabled={signOutLoading}
                            className="mx-auto block text-base text-[var(--subtle)] disabled:opacity-60"
                        >
                            {signOutLoading ? "Signing out…" : "Sign out"}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={deleteOpen}
                title="Delete account?"
                body="This will permanently delete your account and all associated data. This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                danger
                loading={deleteLoading}
                error={deleteError}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={onConfirmDelete}
            />
        </main>
    );
}
