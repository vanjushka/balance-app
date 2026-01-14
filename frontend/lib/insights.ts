// lib/insights.ts
import { api } from "@/lib/api";

/**
 * ---- Core response types ----
 */

export type InsightCounts = {
    logged_days: number;
    range_days: number;
};

export type InsightPain = {
    avg: number | null;
    max: number | null;
    high_days: number;
};

export type InsightEnergy = {
    low_days: number;
    distribution: Record<
        "depleted" | "low" | "moderate" | "good" | "energized",
        number
    >;
};

export type InsightMood = {
    distribution: Record<"calm" | "stressed" | "sad" | "happy", number>;
};

export type InsightStress = {
    avg: number | null;
    high_days: number;
};

export type InsightSleep = {
    avg: number | null;
};

export type InsightTag = {
    tag: string;
    count: number;
};

export type InsightTags = {
    top: InsightTag[];
};

/**
 * ---- Main data payload ----
 */

export type InsightsData = {
    counts: InsightCounts;
    pain: InsightPain;
    energy: InsightEnergy;
    mood: InsightMood;
    stress: InsightStress;
    sleep: InsightSleep;
    tags: InsightTags;
};

/**
 * ---- Meta ----
 */

export type InsightsMeta = {
    range_days: number;
    date_from: string;
    date_to: string;
    timezone: string;
    generated_at: string;
};

/**
 * ---- Full API response ----
 */

export type InsightsResponse = {
    data: InsightsData;
    meta: InsightsMeta;
};

/**
 * ---- API call ----
 */

export async function getInsights(range: 30 | 90): Promise<InsightsResponse> {
    return api.get<InsightsResponse>(`/api/insights?range=${range}`);
}
