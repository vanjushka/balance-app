import { api } from "@/lib/api";

export type Report = {
    id: number;
    user_id: number;
    period_start: string; // ISO datetime from backend
    period_end: string; // ISO datetime from backend
    file_path: string;
    generated_at: string;
    created_at: string;
    updated_at: string;
};

export type CreateReportPayload = {
    period_start: string; // YYYY-MM-DD
    period_end: string; // YYYY-MM-DD
};

type CreateReportResponse = {
    data: Report;
};

export async function createReport(
    payload: CreateReportPayload
): Promise<Report> {
    const res = await api.post<CreateReportResponse>("/api/reports", payload);
    return res.data;
}
