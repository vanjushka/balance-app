"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-20 pt-10 text-[var(--fg)]">
            <div className="mx-auto flex w-full max-w-md flex-col">
                {/* Hero / visual */}
                <div className="mx-auto mt-10 mb-12 flex h-20 w-20 items-center justify-center">
                    <div className="aura-circle relative h-20 w-20 rounded-full bg-[color-mix(in_oklch,var(--primary)_35%,white_65%)]" />
                </div>

                {/* Headline */}
                <h1 className="mt-12 text-center font-serif text-[2.4rem] leading-[1.08] tracking-tight text-[var(--fg)]">
                    Understand your body,
                    <br />
                    find your rhythm
                </h1>

                {/* Subline */}
                <p className="mx-auto mt-6 max-w-[36ch] text-center text-[15px] leading-6 text-[var(--subtle)]">
                    A gentle space to track symptoms, notice patterns, and
                    support your wellbeing with awareness and care.
                </p>

                {/* Value points */}
                <ul className="mt-12 space-y-8">
                    <li className="flex items-start gap-4">
                        <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_20%,transparent_80%)]">
                            <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                        </span>

                        <div>
                            <p className="text-[15px] font-medium text-[var(--fg)]">
                                Daily reflections
                            </p>
                            <p className="mt-1 text-[14px] leading-5 text-[var(--subtle)]">
                                Track pain, symptoms and mood in moments
                            </p>
                        </div>
                    </li>

                    <li className="flex items-start gap-4">
                        <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_20%,transparent_80%)]">
                            <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                        </span>

                        <div>
                            <p className="text-[15px] font-medium text-[var(--fg)]">
                                Gentle insights
                            </p>
                            <p className="mt-1 text-[14px] leading-5 text-[var(--subtle)]">
                                See patterns without judgment or pressure
                            </p>
                        </div>
                    </li>

                    <li className="flex items-start gap-4">
                        <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_20%,transparent_80%)]">
                            <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                        </span>

                        <div>
                            <p className="text-[15px] font-medium text-[var(--fg)]">
                                Your private space
                            </p>
                            <p className="mt-1 text-[14px] leading-5 text-[var(--subtle)]">
                                Safe, supportive and entirely yours
                            </p>
                        </div>
                    </li>
                </ul>

                {/* CTA */}
                <div className="mt-14">
                    <button
                        onClick={() => router.push("/register")}
                        className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 text-base font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90"
                    >
                        Get started
                    </button>

                    <p className="mt-8 text-center text-sm text-[var(--subtle)]">
                        I already have an account{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-[color-mix(in_oklch,var(--fg)_80%,var(--subtle)_20%)] hover:text-[var(--fg)]"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
