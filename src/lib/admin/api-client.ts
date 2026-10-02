import type { ApiResponse } from "@/lib/api/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit };

/** Fetches an admin API route and unwraps the `{ success, data }` envelope. */
export async function api<T>(url: string, { json, headers, ...init }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : init.body,
    });
  } catch {
    throw new ApiClientError("Network error. Check your connection and try again.", 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (res.status === 401 && typeof window !== "undefined") {
    const callbackUrl = encodeURIComponent(window.location.pathname);
    window.location.assign(`/admin/login?callbackUrl=${callbackUrl}`);
  }

  if (!res.ok || !payload || !payload.success) {
    const failure = payload && !payload.success ? payload : null;
    throw new ApiClientError(failure?.message ?? `Request failed (${res.status})`, res.status, failure?.errors);
  }
  return payload.data;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
