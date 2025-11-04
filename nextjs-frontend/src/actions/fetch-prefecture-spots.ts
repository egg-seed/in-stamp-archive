"use server";

import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export type Spot = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  spot_type: string;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  website_url: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PaginatedSpotsResponse = {
  items: Spot[];
  total: number;
  page: number;
  size: number;
};

export type FetchPrefectureSpotsParams = {
  prefecture: string;
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
};

export type FetchPrefectureSpotsResult =
  | {
      data: PaginatedSpotsResponse;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

const DEFAULT_PAGE_SIZE = 12;

export async function fetchPrefectureSpots(
  params: FetchPrefectureSpotsParams,
): Promise<FetchPrefectureSpotsResult> {
  const { prefecture, page = 1, size = DEFAULT_PAGE_SIZE, category, keyword } = params;
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return {
      data: null,
      error: "認証情報が見つかりません。ログインし直してください。",
    };
  }

  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return {
      data: null,
      error: "API の接続設定が完了していません。",
    };
  }

  const endpoint = new URL("/api/spots/", baseUrl);
  const searchParams = endpoint.searchParams;
  searchParams.set("prefecture", prefecture);
  searchParams.set("page", page.toString());
  searchParams.set("size", size.toString());

  if (category) {
    searchParams.set("category", category);
  }

  if (keyword) {
    searchParams.set("keyword", keyword);
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        data: null,
        error: `スポット情報の取得に失敗しました (${response.status}): ${errorBody}`,
      };
    }

    const data = (await response.json()) as PaginatedSpotsResponse;
    return { data, error: null };
  } catch (error) {
    logger.error("Failed to fetch prefecture spots", error, {
      prefecture,
      page,
      size,
      category,
      keyword,
    });
    return {
      data: null,
      error: "スポット情報の取得中に予期しないエラーが発生しました。",
    };
  }
}
