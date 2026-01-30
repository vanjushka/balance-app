import { api } from "@/lib/api";

export type Report = {
    id: number;
    user_id: number;
    period_start: string;
    period_end: string;
    file_path: string;
    generated_at: string;
    created_at: string;
    updated_at: string;
};

export type CreateReportPayload = {
    period_start: string;
    period_end: string;
};

type CreateReportResponse = {
    data: Report;
};

export async function createReport(
    payload: CreateReportPayload,
): Promise<Report> {
    const res = await api.post<CreateReportResponse>("/api/reports", payload);
    return res.data;
}
