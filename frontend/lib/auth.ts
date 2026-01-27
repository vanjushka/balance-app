import { api, csrfCookie } from "@/lib/api";

export type RegisterPayload = {
    profile?: {
        display_name?: string;
    };
    email: string;
    password: string;
    password_confirmation: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type MeResponse<User = unknown> = {
    user: User;
};

export async function register(payload: RegisterPayload) {
    await csrfCookie();
    return api.post("/api/user", payload);
}

export async function login(payload: LoginPayload) {
    await csrfCookie();
    return api.post("/api/auth/login", payload);
}

export async function logout() {
    return api.post("/api/auth/logout");
}

export async function fetchMe<User = unknown>() {
    return api.get<{ user: User }>("/api/auth/me");
}
