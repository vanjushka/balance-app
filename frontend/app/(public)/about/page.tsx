"use client";

import Link from "next/link";

export default function AboutPage() {
    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-20 pt-8 text-[var(--fg)]">
            <div className="mx-auto w-full max-w-md">
                {/* Top bar */}
                <header className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => history.back()}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_85%,var(--bg)_15%)] text-[var(--muted)] shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:text-[var(--fg)]"
                        aria-label="Back"
                        title="Back"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <p className="text-sm text-[var(--subtle)]">About</p>

                    <span className="h-11 w-11" aria-hidden />
                </header>

                {/* Content */}
                <section className="mt-12">
                    <h1 className="font-serif text-[2.1rem] leading-[1.1] tracking-tight text-[var(--fg)]">
                        About Balance
                    </h1>

                    {/* divider under title */}
                    <div className="mt-4 h-px w-full bg-[color-mix(in_oklch,var(--border)_65%,transparent_35%)]" />

                    <p className="mt-6 text-[15px] leading-6 text-[var(--subtle)]">
                        Balance is a gentle symptom tracking app designed to
                        help people notice patterns in their bodies over time.
                        It focuses on self-awareness, reflection, and personal
                        understanding — not on diagnosis or treatment.
                    </p>

                    <p className="mt-4 text-[15px] leading-6 text-[var(--subtle)]">
                        The app is intended as a supportive tool for everyday
                        awareness. It does not provide medical diagnoses,
                        treatment, or professional healthcare advice, and it
                        should never replace consultation with a qualified
                        healthcare professional.
                    </p>

                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <p className="mt-6 text-[15px] leading-6 text-[var(--subtle)]">
                        Balance is currently developed as a student project
                        based in Zurich, Switzerland, and is available to an
                        international audience. The app is free to use during
                        development, with optional paid features planned for the
                        future.
                    </p>

                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <p className="mt-6 text-xs leading-5 text-[color-mix(in_oklch,var(--subtle)_80%,transparent_20%)]">
                        Educational and informational purposes only. Balance is
                        not a medical product.
                    </p>

                    <p className="mt-3 text-xs leading-5 text-[color-mix(in_oklch,var(--subtle)_80%,transparent_20%)]">
                        For information about data handling and privacy, please
                        refer to the{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-2 hover:text-[var(--fg)]"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </main>
    );
}
