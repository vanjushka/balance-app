const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiError = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class ApiException extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(
        message: string,
        status: number,
        errors?: Record<string, string[]>,
    ) {
        super(message);
        this.name = "ApiException";
        this.status = status;
        this.errors = errors;
    }
}

const DEFAULT_FETCH_OPTIONS: RequestInit = {
    credentials: "include",
};

function safeJsonParse(text: string): unknown {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length < 2) return null;

    return parts.pop()!.split(";").shift() ?? null;
}

function getXsrfToken(): string | null {
    const token = getCookie("XSRF-TOKEN");
    if (!token) return null;

    try {
        return decodeURIComponent(token);
    } catch {
        return token;
    }
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");
    if (!path.startsWith("/"))
        throw new Error(`API path must start with "/": ${path}`);

    const method = (options.method ?? "GET").toUpperCase();
    const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(method);

    const xsrf = isStateChanging ? getXsrfToken() : null;

    const res = await fetch(`${API_URL}${path}`, {
        ...DEFAULT_FETCH_OPTIONS,
        ...options,
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
            ...options.headers,
        },
    });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = safeJsonParse(text);

    if (!res.ok) {
        const errorData = (data as ApiError) || { message: "Request failed" };
        throw new ApiException(
            errorData.message || `HTTP ${res.status}`,
            res.status,
            errorData.errors,
        );
    }

    return data as T;
}

export async function csrfCookie(): Promise<void> {
    if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
    });
}

export const api = {
    get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),

    post: <T>(path: string, body?: unknown) =>
        apiFetch<T>(path, {
            method: "POST",
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }),

    put: <T>(path: string, body: unknown) =>
        apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),

    patch: <T>(path: string, body: unknown) =>
        apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

    delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
