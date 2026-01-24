import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";

function cx(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(" ");
}

type Props = {
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

export function ConfirmModal({
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
}: Props) {
    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onCancel();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* overlay */}
            <button
                type="button"
                aria-label="Close"
                onClick={onCancel}
                disabled={loading}
                className="absolute inset-0 bg-[var(--fg)]/20 sm:bg-[var(--fg)]/16"
            />

            {/* panel */}
            <div className="relative w-full max-w-md rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--fg)]">
                <div className="text-lg font-medium">{title}</div>

                <div className="mt-2 text-base leading-relaxed text-[var(--muted)]">
                    {body}
                </div>

                {error && (
                    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onCancel}
                        disabled={loading}
                        className="sm:flex-1"
                    >
                        {cancelLabel}
                    </Button>

                    <Button
                        type="button"
                        variant={danger ? "danger" : "primary"}
                        size="md"
                        onClick={onConfirm}
                        isLoading={loading}
                        className={cx(
                            "sm:flex-1",
                            danger ? "w-full" : undefined,
                        )}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
