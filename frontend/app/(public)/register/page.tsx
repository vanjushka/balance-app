"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { ApiException } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await register({
                profile: name.trim()
                    ? { display_name: name.trim() }
                    : undefined,
                email: email.trim().toLowerCase(),
                password,
                password_confirmation: passwordConfirmation,
            });

            router.replace("/login");
        } catch (err) {
            if (err instanceof ApiException) {
                const firstFieldError = err.errors
                    ? Object.values(err.errors).flat()[0]
                    : null;

                setError(firstFieldError || err.message || "Register failed");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Register failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-[100dvh] bg-[var(--bg)] px-6 pb-20 pt-8 text-[var(--fg)]">
            <div className="mx-auto w-full max-w-md">
                <header className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
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

                    <span className="h-11 w-11" aria-hidden />
                </header>

                <section className="mt-10 space-y-4">
                    <h1 className="font-serif text-[2.35rem] leading-[1.08] tracking-tight text-[var(--fg)]">
                        Create your personal space
                    </h1>

                    <p className="max-w-[34ch] text-[17px] leading-7 text-[var(--subtle)]">
                        A private space to track your body with awareness and
                        care.
                    </p>
                </section>

                <form onSubmit={onSubmit} className="mt-12 space-y-8">
                    <label className="block">
                        <span className="block text-sm font-medium text-[var(--fg)]">
                            Name
                        </span>

                        <div className="mt-3 flex h-14 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                placeholder="Your name"
                                className="w-full bg-transparent text-[15px] leading-5 text-[var(--fg)] outline-none placeholder:text-[color-mix(in_oklch,var(--muted)_70%,transparent_30%)]"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="block text-sm font-medium text-[var(--fg)]">
                            Email
                        </span>

                        <div className="mt-3 flex h-14 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="you@email.com"
                                className="w-full bg-transparent text-[15px] leading-5 text-[var(--fg)] outline-none placeholder:text-[color-mix(in_oklch,var(--muted)_70%,transparent_30%)]"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="block text-sm font-medium text-[var(--fg)]">
                            Password
                        </span>

                        <div className="mt-3 flex h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                            <input
                                type={showPw ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                className="min-w-0 flex-1 bg-transparent text-[15px] leading-5 text-[var(--fg)] outline-none placeholder:text-[color-mix(in_oklch,var(--muted)_70%,transparent_30%)]"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]"
                                aria-label={
                                    showPw ? "Hide password" : "Show password"
                                }
                                title={
                                    showPw ? "Hide password" : "Show password"
                                }
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
                                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                </svg>
                            </button>
                        </div>
                    </label>

                    <label className="block">
                        <span className="block text-sm font-medium text-[var(--fg)]">
                            Confirm password
                        </span>

                        <div className="mt-3 flex h-14 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                            <input
                                type={showPw ? "text" : "password"}
                                required
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                className="w-full bg-transparent text-[15px] leading-5 text-[var(--fg)] outline-none placeholder:text-[color-mix(in_oklch,var(--muted)_70%,transparent_30%)]"
                            />
                        </div>
                    </label>

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="pt-10">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 text-base font-medium text-[var(--primary-fg)] shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating…" : "Create account"}
                        </button>

                        <p className="mt-10 text-center text-sm text-[var(--subtle)]">
                            I already have an account{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-[color-mix(in_oklch,var(--fg)_80%,var(--subtle)_20%)] hover:text-[var(--fg)]"
                            >
                                → Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
