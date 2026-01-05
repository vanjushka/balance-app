const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiError = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class ApiException extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(
        message: string,
        status: number,
        errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = "ApiException";
        this.status = status;
        this.errors = errors;
    }
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (res.status === 204) return undefined as T;

    const text = await res.text();

    let data: unknown = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!res.ok) {
        const errorData: ApiError = data || { message: "Request failed" };
        throw new ApiException(
            errorData.message || `HTTP ${res.status}`,
            res.status,
            errorData.errors
        );
    }

    return data as T;
}

export const api = {
    get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
    post: <T>(path: string, body: unknown) =>
        apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
        apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
        apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
