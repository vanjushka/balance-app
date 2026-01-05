"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
    const router = useRouter();
    const { refetch } = useAuth();

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
            const res = await register({
                name: name.trim() || undefined,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            localStorage.setItem("token", res.token);
            await refetch();
            router.replace("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Register failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ padding: 24, maxWidth: 420 }}>
            <h1>Register</h1>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                <label>
                    Name (optional)
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                    />
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </label>

                <label>
                    Confirm password
                    <input
                        type="password"
                        required
                        value={passwordConfirmation}
                        onChange={(e) =>
                            setPasswordConfirmation(e.target.value)
                        }
                        autoComplete="new-password"
                    />
                </label>

                {error && <p style={{ color: "crimson" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>
        </main>
    );
}
