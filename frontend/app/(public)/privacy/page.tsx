"use client";

export default function PrivacyPage() {
    return (
        <main className="min-h-[100dvh] bg-zinc-950 px-4 pb-24 pt-4 text-zinc-100">
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => history.back()}
                        className="h-10 w-10 rounded-full border border-zinc-800 text-zinc-200 hover:border-zinc-700"
                        aria-label="Back"
                        title="Back"
                    >
                        <span className="text-xl">‹</span>
                    </button>

                    <p className="text-sm text-zinc-300">Privacy</p>

                    <span className="h-10 w-10" aria-hidden />
                </div>
            </header>

            <section className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Privacy Policy
                </h1>

                <p className="text-sm leading-relaxed text-zinc-400">
                    Your data belongs to you. Balance stores only the
                    information required to provide insights and does not sell
                    or share personal health data.
                </p>

                <p className="text-sm leading-relaxed text-zinc-400">
                    All community patterns are anonymized and aggregated.
                </p>

                <p className="text-xs text-zinc-500">
                    This app is for educational purposes only.
                </p>
            </section>
        </main>
    );
}
