"use client";

export default function PrivacyPage() {
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

                    <p className="text-sm text-[var(--subtle)]">Privacy</p>

                    <span className="h-11 w-11" aria-hidden />
                </header>

                {/* Content */}
                <section className="mt-12">
                    <h1 className="font-serif text-[2.1rem] leading-[1.1] tracking-tight text-[var(--fg)]">
                        Privacy Policy
                    </h1>

                    {/* divider under title */}
                    <div className="mt-4 h-px w-full bg-[color-mix(in_oklch,var(--border)_65%,transparent_35%)]" />

                    <p className="mt-6 text-[15px] leading-6 text-[var(--subtle)]">
                        Your privacy matters. This Privacy Policy explains how
                        Balance collects, uses, and protects personal data.
                        Balance is currently developed as a student project
                        based in Zurich, Switzerland, and is available to an
                        international audience.
                    </p>

                    {/* Data collection */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <h2 className="privacy-h2 mt-6 text-sm font-medium text-[var(--fg)]">
                        Data we collect
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Balance collects only the information necessary to
                        provide its core functionality. This may include:
                    </p>

                    <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-6 text-[var(--subtle)]">
                        <li>Account information such as email address</li>
                        <li>
                            User-provided entries related to symptoms, moods, or
                            personal observations
                        </li>
                        <li>Technical data required for basic app operation</li>
                    </ul>

                    {/* Health data */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <h2 className="privacy-h2 mt-6 text-sm font-medium text-[var(--fg)]">
                        Health-related data
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Any health-related information entered into Balance is
                        provided voluntarily by the user. This data is used
                        solely for personal tracking, reflection, and pattern
                        recognition within the app.
                    </p>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Balance does not analyze data for medical diagnosis,
                        treatment, or clinical decision-making.
                    </p>

                    {/* Data usage */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <h2 className="privacy-h2 mt-6 text-sm font-medium text-[var(--fg)]">
                        How data is used
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Personal data is used exclusively to operate and improve
                        the app experience. Balance does not sell, rent, or
                        trade personal data to third parties.
                    </p>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Any community or pattern-based insights are anonymized
                        and aggregated so that individual users cannot be
                        identified.
                    </p>

                    {/* Data storage & security */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <h2 className="privacy-h2 mt-6 text-sm font-medium text-[var(--fg)]">
                        Data storage and security
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Reasonable technical and organizational measures are
                        used to protect stored data against unauthorized access,
                        loss, or misuse. However, no digital system can be
                        guaranteed to be completely secure.
                    </p>

                    {/* User rights */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <h2 className="privacy-h2 mt-6 text-sm font-medium text-[var(--fg)]">
                        Your rights
                    </h2>

                    <p className="mt-3 text-[15px] leading-6 text-[var(--subtle)]">
                        Depending on your location, you may have the right to
                        access, correct, or delete your personal data. You may
                        also request information about how your data is stored
                        and used.
                    </p>

                    {/* Scope */}
                    <div className="mt-8 h-px w-full bg-[color-mix(in_oklch,var(--border)_50%,transparent_50%)]" />

                    <p className="mt-6 text-xs leading-5 text-[color-mix(in_oklch,var(--subtle)_80%,transparent_20%)]">
                        Balance is provided for educational and informational
                        purposes only and is not a medical product.
                    </p>

                    <p className="mt-3 text-xs leading-5 text-[color-mix(in_oklch,var(--subtle)_80%,transparent_20%)]">
                        This Privacy Policy may be updated as the app evolves.
                        Continued use of Balance implies acceptance of the
                        current version.
                    </p>
                </section>
            </div>
        </main>
    );
}
