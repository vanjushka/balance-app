import { api } from "@/lib/api";

export type MeResponse = {
    user: {
        id: number;
        email: string;
        is_admin: boolean;
        profile?: {
            tz?: string;
            goal?: string;
            name?: string;
            diagnosis?: string;
        } | null;
        created_at: string;
        updated_at: string;
    };
};

export type ProfileSummaryResponse = {
    data: {
        tracking_since: string | null; // YYYY-MM-DD
        days_tracked: number;
        cycles_recorded: number | null;
        patterns_discovered: number | null;
    };
};

export async function getMe(): Promise<MeResponse> {
    return api.get<MeResponse>("/api/auth/me");
}

export async function logout(): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/auth/logout");
}

export async function getProfileSummary(): Promise<ProfileSummaryResponse> {
    return api.get<ProfileSummaryResponse>("/api/profile/summary");
}

export async function deleteAccount(): Promise<void> {
    await api.delete("/api/user");
}
