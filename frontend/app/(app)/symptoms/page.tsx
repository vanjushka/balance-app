"use client";

import { useEffect, useState } from "react";
import { listSymptoms, deleteSymptom, Symptom } from "@/lib/symptoms";

export default function SymptomsPage() {
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const data = await listSymptoms();
        setSymptoms(data);
        setLoading(false);
    }

    async function onDelete(id: number) {
        await deleteSymptom(id);
        load();
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) return <p>Loading…</p>;

    return (
        <main style={{ padding: 24 }}>
            <h1>Symptoms</h1>

            <a href="/dashboard/symptoms/new">Add symptom</a>

            <ul>
                {symptoms.map((s) => (
                    <li key={s.id}>
                        <strong>{s.name}</strong> – severity {s.severity}
                        <button onClick={() => onDelete(s.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </main>
    );
}
