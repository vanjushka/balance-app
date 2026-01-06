"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { ApiException } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await register({
                name: name.trim() || undefined,
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
        <main className="mx-auto w-full max-w-md px-6 py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                Create account
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
                Create your profile, then log in.
            </p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Name (optional)</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none focus:border-zinc-700"
                    />
                </label>

                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none focus:border-zinc-700"
                    />
                </label>

                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Password</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none focus:border-zinc-700"
                    />
                </label>

                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Confirm password</span>
                    <input
                        type="password"
                        required
                        value={passwordConfirmation}
                        onChange={(e) =>
                            setPasswordConfirmation(e.target.value)
                        }
                        autoComplete="new-password"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none focus:border-zinc-700"
                    />
                </label>

                {error && (
                    <p className="rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Creating..." : "Create account"}
                </button>

                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-200 hover:border-zinc-700"
                >
                    Back to login
                </button>
            </form>
        </main>
    );
}
