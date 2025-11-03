import { cookies } from "next/headers";

import { client } from "./generated/sdk.gen";

const baseUrl =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

client.setConfig({
  ...client.getConfig(),
  baseUrl,
  credentials: "include",
});

client.interceptors.request.use(async (request) => {
  if (typeof window !== "undefined") {
    return request;
  }

  const headers = new Headers(request.headers);
  if (headers.has("Authorization")) {
    return new Request(request, {
      headers,
      credentials: request.credentials ?? "include",
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return request;
  }

  headers.set("Authorization", `Bearer ${token}`);

  return new Request(request, {
    headers,
    credentials: request.credentials ?? "include",
  });
});

export const apiClient = client;

export function withApiClient<T extends Record<string, unknown> | undefined>(
  options?: T,
) {
  return {
    ...(options ?? {}),
    client: apiClient,
  } as (T extends undefined ? { client: typeof apiClient } : T & {
    client: typeof apiClient;
  });
}

export * from "./generated";
