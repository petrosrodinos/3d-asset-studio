import { isAxiosError } from "axios";
import { axiosInstance } from "@/lib/axiosInstance";

export class InsufficientTokensError extends Error {
  required: number;
  balance: number;
  constructor(required: number, balance: number) {
    super("Insufficient tokens");
    this.required = required;
    this.balance = balance;
  }
}

function headersFromInit(h: RequestInit["headers"]): Record<string, string> | undefined {
  if (!h) return undefined;
  if (h instanceof Headers) {
    const o: Record<string, string> = {};
    h.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h);
  }
  return { ...h };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hdrs = headersFromInit(init?.headers);
  let data: unknown;

  if (init?.body !== undefined && init?.body !== null) {
    if (init.body instanceof FormData) {
      data = init.body;
      if (hdrs) delete hdrs["Content-Type"];
    } else if (typeof init.body === "string") {
      data = JSON.parse(init.body) as unknown;
    } else {
      data = init.body;
    }
  }

  try {
    const res = await axiosInstance.request<T>({
      url: path,
      method,
      headers: hdrs,
      data,
    });

    if (res.status === 204) return undefined as T;
    return res.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 402) {
      const d = e.response.data as { required: number; balance: number };
      throw new InsufficientTokensError(d.required, d.balance);
    }
    if (isAxiosError(e) && e.response?.data !== undefined) {
      const d = e.response.data as { error?: string };
      const msg =
        typeof d === "object" && d && "error" in d && typeof d.error === "string"
          ? d.error
          : `HTTP ${e.response.status}`;
      throw new Error(msg);
    }
    throw e;
  }
}

export function jsonInit(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
