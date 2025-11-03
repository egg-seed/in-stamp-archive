import { cookies } from "next/headers";

export class ApiRequestError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const getBaseUrl = () => {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }
  return baseUrl;
};

const getAccessToken = async () => {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) {
    throw new ApiRequestError("Authentication token missing", 401);
  }
  return token;
};

export const authedFetch = async (path: string, init: RequestInit = {}) => {
  const [token, baseUrl] = await Promise.all([getAccessToken(), getBaseUrl()]);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
};

export const fetchJson = async <T>(path: string, init: RequestInit = {}) => {
  const response = await authedFetch(path, init);

  if (!response.ok) {
    let detail: unknown = undefined;
    let message = `Request to ${path} failed`;
    try {
      const payload = await response.json();
      detail = payload;
      if (typeof payload?.detail === "string") {
        message = payload.detail;
      } else if (typeof payload?.message === "string") {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse errors and use default message
    }

    throw new ApiRequestError(message, response.status, detail);
  }

  return (await response.json()) as T;
};

export const parseErrorResponse = async (response: Response) => {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") {
      return payload.detail;
    }
    if (typeof payload?.message === "string") {
      return payload.message;
    }
  } catch {
    // Ignore parsing issues
  }
  return response.statusText || "Unknown server error";
};
