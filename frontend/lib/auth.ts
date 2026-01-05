import { api } from "@/lib/api";

export type User = {
    id: number | string;
    email: string;
    name?: string;
};

export type AuthResponse = {
    token: string;
    user?: User;
};

export async function login(email: string, password: string) {
    return api.post<AuthResponse>("/auth/login", {
        email,
        password,
    });
}

export async function register(payload: {
    name?: string;
    email: string;
    password: string;
    password_confirmation?: string;
}) {
    return api.post<AuthResponse>("/auth/register", payload);
}

export async function fetchMe() {
    return api.get<User>("/user/me");
}

export async function logout() {
    return api.post<void>("/auth/logout", {});
}

export async function updateMe(payload: Partial<User>) {
    return api.patch<User>("/user/update", payload);
}

export async function deleteMe() {
    return api.delete<void>("/user/delete");
}
