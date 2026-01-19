// lib/symptoms.ts
import { api } from "@/lib/api";
import type { CanonicalSymptomTag } from "@/lib/symptomTags";
export type SymptomTag = CanonicalSymptomTag | string;

export type EnergyLevel =
    | "depleted"
    | "low"
    | "moderate"
    | "good"
    | "energized";

export type Mood = "calm" | "stressed" | "sad" | "happy";

export type SymptomLog = {
    id: number;
    user_id: number;

    // casted in Laravel as date:Y-m-d
    log_date: string;

    pain_intensity: number | null;
    energy_level: EnergyLevel | null;
    mood: Mood | null;

    sleep_quality: number | null;
    stress_level: number | null;

    notes: string | null;
    tags_json: SymptomTag[] | null;

    created_at: string;
    updated_at: string;
};

export type CreateSymptomLogPayload = {
    log_date: string;
    pain_intensity?: number | null;
    energy_level?: EnergyLevel | null;
    mood?: Mood | null;
    sleep_quality?: number | null;
    stress_level?: number | null;
    notes?: string | null;
    tags_json?: SymptomTag[] | null;
};

export type UpdateSymptomLogPayload = Partial<CreateSymptomLogPayload>;

export type SymptomStats = {
    average_pain: number;
    mood_distribution: Array<{ mood: string; count: number }>;
    energy_distribution: Array<{ energy_level: string; count: number }>;
    pain_trend: Array<{ date: string; average_pain: number }>;
    count: number;
};

type Meta = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type PaginatedResponse<T> = {
    data: T[];
    meta: Meta;
};

type ListResponse<T> =
    | T[]
    | PaginatedResponse<T>
    | { data: T[] }
    | { symptoms: T[] };

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function unwrapListResponse(res: unknown): SymptomLog[] {
    if (Array.isArray(res)) return res as SymptomLog[];

    if (!isObject(res)) return [];

    const data = res["data"];
    if (Array.isArray(data)) return data as SymptomLog[];

    const symptoms = res["symptoms"];
    if (Array.isArray(symptoms)) return symptoms as SymptomLog[];

    return [];
}

function unwrapPaginatedResponse(res: unknown): PaginatedResponse<SymptomLog> {
    if (!isObject(res)) {
        return {
            data: [],
            meta: { total: 0, per_page: 0, current_page: 1, last_page: 1 },
        };
    }

    const dataRaw = res["data"];
    const metaRaw = res["meta"];

    const data = Array.isArray(dataRaw) ? (dataRaw as SymptomLog[]) : [];

    const meta: Meta = isObject(metaRaw)
        ? {
              total:
                  typeof metaRaw["total"] === "number" ? metaRaw["total"] : 0,
              per_page:
                  typeof metaRaw["per_page"] === "number"
                      ? metaRaw["per_page"]
                      : 0,
              current_page:
                  typeof metaRaw["current_page"] === "number"
                      ? metaRaw["current_page"]
                      : 1,
              last_page:
                  typeof metaRaw["last_page"] === "number"
                      ? metaRaw["last_page"]
                      : 1,
          }
        : { total: 0, per_page: 0, current_page: 1, last_page: 1 };

    return { data, meta };
}

export async function listSymptomLogs(): Promise<SymptomLog[]> {
    const res = await api.get<ListResponse<SymptomLog>>("/api/symptoms");
    return unwrapListResponse(res);
}

export async function listSymptomLogsForDate(
    date: string,
): Promise<SymptomLog[]> {
    const res = await api.get<ListResponse<SymptomLog>>(
        `/api/symptoms?date=${encodeURIComponent(date)}`,
    );
    return unwrapListResponse(res);
}

export async function hasSymptomLogForDate(date: string): Promise<boolean> {
    const logs = await listSymptomLogsForDate(date);
    return logs.length > 0;
}

export async function listSymptomLogsRange(params: {
    from: string;
    to: string;
    per_page?: number;
}): Promise<SymptomLog[]> {
    const perPage = params.per_page ?? 100;

    const first = await api.get<PaginatedResponse<SymptomLog>>(
        `/api/symptoms?from=${encodeURIComponent(
            params.from,
        )}&to=${encodeURIComponent(params.to)}&per_page=${perPage}`,
    );

    const page1 = unwrapPaginatedResponse(first);
    if (page1.meta.last_page <= 1) return page1.data;

    const rest = await Promise.all(
        Array.from({ length: page1.meta.last_page - 1 }, (_, i) => {
            const page = i + 2;
            return api.get<PaginatedResponse<SymptomLog>>(
                `/api/symptoms?from=${encodeURIComponent(
                    params.from,
                )}&to=${encodeURIComponent(
                    params.to,
                )}&per_page=${perPage}&page=${page}`,
            );
        }),
    );

    const other = rest.flatMap((r) => unwrapPaginatedResponse(r).data);
    return [...page1.data, ...other];
}

export async function getSymptomLog(id: number): Promise<SymptomLog> {
    const res = await api.get<{ data: SymptomLog }>(`/api/symptoms/${id}`);
    return res.data;
}

export async function createSymptomLog(
    payload: CreateSymptomLogPayload,
): Promise<SymptomLog> {
    const res = await api.post<{ data: SymptomLog }>("/api/symptoms", payload);
    return res.data;
}

export async function updateSymptomLog(
    id: number,
    payload: UpdateSymptomLogPayload,
): Promise<SymptomLog> {
    const res = await api.patch<{ data: SymptomLog }>(
        `/api/symptoms/${id}`,
        payload,
    );
    return res.data;
}

export async function deleteSymptomLog(id: number): Promise<void> {
    await api.delete<void>(`/api/symptoms/${id}`);
}

export async function getSymptomStats(params?: {
    from?: string;
    to?: string;
}): Promise<SymptomStats> {
    const qs =
        params?.from && params?.to
            ? `?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(
                  params.to,
              )}`
            : "";

    return api.get<SymptomStats>(`/api/symptoms/stats${qs}`);
}
