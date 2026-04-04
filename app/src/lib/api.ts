import { axiosInstance } from "@/lib/axiosInstance";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const hdrs =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers
        ? { ...(headers as Record<string, string>) }
        : undefined;

  const res = await axiosInstance.request<T>({
    url: endpoint,
    method: (rest.method as string | undefined)?.toUpperCase() ?? "GET",
    headers: hdrs,
    data: body,
  });

  if (res.status === 204) return undefined as T;
  return res.data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "POST", body, ...options }),

  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "PUT", body, ...options }),

  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "PATCH", body, ...options }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};
