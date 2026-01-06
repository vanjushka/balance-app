"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiException } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const { refetch } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
            await refetch();
            router.replace("/dashboard");
        } catch (err) {
            if (err instanceof ApiException) {
                // Prefer field validation messages if available
                const firstFieldError = err.errors
                    ? Object.values(err.errors).flat()[0]
                    : null;

                setError(firstFieldError || err.message || "Login failed");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto w-full max-w-md px-6 py-10">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-0 focus:border-zinc-700"
                    />
                </label>

                <label className="grid gap-2 text-sm">
                    <span className="text-zinc-200">Password</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-0 focus:border-zinc-700"
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
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
}
