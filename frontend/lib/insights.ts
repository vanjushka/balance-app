import { api } from "@/lib/api";

export type InsightsRange = 30 | 90;

export type EnergyLevel =
    | "depleted"
    | "low"
    | "moderate"
    | "good"
    | "energized";
export type Mood = "calm" | "stressed" | "sad" | "happy";

export type InsightsMetrics = {
    counts: { logged_days: number; range_days: number };
    pain: { avg: number | null; max: number | null; high_days: number };
    energy: {
        low_days: number;
        distribution: Record<EnergyLevel, number>;
    };
    mood: {
        distribution: Partial<Record<Mood, number>> & Record<string, number>;
    };
    stress: { avg: number | null; high_days: number };
    sleep: { avg: number | null };
    tags: { top: Array<{ tag: string; count: number }> };
};

export type InsightsMeta = {
    range_days: number;
    date_from: string;
    date_to: string;
    timezone: string;
    generated_at: string;
};

export type InsightsResponse = {
    data: InsightsMetrics;
    meta: InsightsMeta;
};

export async function getInsights(
    range: InsightsRange,
): Promise<InsightsResponse> {
    return api.get<InsightsResponse>(`/api/insights?range=${range}`);
}

export type InsightsSummaryResponse = {
    data: {
        summary: string;
        bullets: string[];
        disclaimer: string;
    };
    meta: InsightsMeta;
};

export async function getInsightsSummary(
    range: InsightsRange,
): Promise<InsightsSummaryResponse> {
    return api.post<InsightsSummaryResponse>("/api/insights/summary", {
        range,
    });
}

export type SharedPatternsResponse = {
    data: {
        patterns: string[];
        disclaimer: string;
    };
    meta: InsightsMeta & {
        cached?: boolean;
        cohort_size?: number | null;
    };
};

export async function getSharedPatterns(
    range: InsightsRange,
): Promise<SharedPatternsResponse> {
    return api.get<SharedPatternsResponse>(
        `/api/community/patterns?range=${range}`,
    );
}
