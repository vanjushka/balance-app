// lib/symptoms.ts
import { api } from "@/lib/api";

// ===== TYPES =====
export type Symptom = {
    id: number;
    name: string;
    severity: number;
    note?: string;
    created_at: string;
    updated_at?: string; // falls Backend das zurückgibt
};

export type CreateSymptomPayload = {
    name: string;
    severity: number;
    note?: string;
};

export type UpdateSymptomPayload = Partial<{
    name: string;
    severity: number;
    note: string;
}>;

export type SymptomStats = {
    total: number;
    average_severity: number;
    most_common?: string;
    //  weitere Stats je nach Backend
};

// ===== API FUNCTIONS =====
export async function listSymptoms(): Promise<Symptom[]> {
    return api.get<Symptom[]>("/symptoms");
}

export async function getSymptom(id: number): Promise<Symptom> {
    return api.get<Symptom>(`/symptoms/${id}`);
}

export async function createSymptom(
    payload: CreateSymptomPayload
): Promise<Symptom> {
    return api.post<Symptom>("/symptoms", payload);
}

export async function updateSymptom(
    id: number,
    payload: UpdateSymptomPayload
): Promise<Symptom> {
    return api.put<Symptom>(`/symptoms/${id}`, payload);
}

export async function deleteSymptom(id: number): Promise<void> {
    return api.delete<void>(`/symptoms/${id}`);
}

export async function getSymptomStats(): Promise<SymptomStats> {
    return api.get<SymptomStats>("/symptoms/stats");
}
