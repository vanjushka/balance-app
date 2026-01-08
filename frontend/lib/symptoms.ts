// lib/symptoms.ts
import { api } from "@/lib/api";

export type SymptomLog = {
    id: number;
    user_id: number;
    log_date: string; // YYYY-MM-DD (or ISO datetime string, depending on backend serialization)
    pain_intensity: number;
    energy_level?: string | null;
    mood?: string | null;
    sleep_quality?: number | null;
    stress_level?: number | null;
    notes?: string | null;
    tags_json?: string[] | null;
    created_at: string;
    updated_at: string;
};

export type CreateSymptomLogPayload = {
    log_date: string; // YYYY-MM-DD
    pain_intensity: number;
    energy_level?: string;
    mood?: string;
    sleep_quality?: number;
    stress_level?: number;
    notes?: string;
    tags_json?: string[];
};

export type UpdateSymptomLogPayload = Partial<CreateSymptomLogPayload>;

export type SymptomStats = {
    total: number;
    average_severity?: number;
    most_common?: string;
};

function unwrapListResponse(res: unknown): SymptomLog[] {
    if (Array.isArray(res)) return res as SymptomLog[];

    const maybe = res as { data?: unknown; symptoms?: unknown };

    if (Array.isArray(maybe.data)) return maybe.data as SymptomLog[];
    if (Array.isArray(maybe.symptoms)) return maybe.symptoms as SymptomLog[];

    return [];
}

export async function listSymptomLogs(): Promise<SymptomLog[]> {
    const res = await api.get<unknown>("/api/symptoms");
    return unwrapListResponse(res);
}

/** GET /api/symptoms?date=YYYY-MM-DD */
export async function listSymptomLogsForDate(
    date: string
): Promise<SymptomLog[]> {
    const res = await api.get<unknown>(
        `/api/symptoms?date=${encodeURIComponent(date)}`
    );
    return unwrapListResponse(res);
}

/** Convenience for Dashboard: true if at least one log exists for that date */
export async function hasSymptomLogForDate(date: string): Promise<boolean> {
    const logs = await listSymptomLogsForDate(date);
    return logs.length > 0;
}

export async function getSymptomLog(id: number): Promise<SymptomLog> {
    return api.get<SymptomLog>(`/api/symptoms/${id}`);
}

export async function createSymptomLog(
    payload: CreateSymptomLogPayload
): Promise<SymptomLog> {
    return api.post<SymptomLog>("/api/symptoms", payload);
}

export async function updateSymptomLog(
    id: number,
    payload: UpdateSymptomLogPayload
): Promise<SymptomLog> {
    return api.patch<SymptomLog>(`/api/symptoms/${id}`, payload);
}

export async function deleteSymptomLog(id: number): Promise<void> {
    return api.delete<void>(`/api/symptoms/${id}`);
}

export async function getSymptomStats(): Promise<SymptomStats> {
    return api.get<SymptomStats>("/api/symptoms/stats");
}
