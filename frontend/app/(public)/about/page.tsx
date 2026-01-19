"use client";

export default function AboutPage() {
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

                    <p className="text-sm text-zinc-300">About</p>

                    <span className="h-10 w-10" aria-hidden />
                </div>
            </header>

            <section className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6">
                <h1 className="text-3xl font-semibold tracking-tight">About</h1>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    Balance is a gentle symptom tracking app for noticing
                    patterns over time. It’s built for self-awareness and
                    support — not diagnosis.
                </p>

                <p className="mt-4 text-xs text-zinc-500">
                    Educational purpose only. Not medical advice.
                </p>
            </section>
        </main>
    );
}
