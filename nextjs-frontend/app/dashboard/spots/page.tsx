import { Suspense } from "react";

import { authenticatedFetch } from "@/lib/auth-fetch";
import { PaginatedResponse, Spot } from "@/lib/spots";
import { PrefectureStatsResponse } from "@/lib/prefectures";
import SpotsInfiniteList from "@/components/spots/spots-infinite-list";
import AdvancedSearch from "@/components/search/advanced-search";

interface SpotsPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    keyword?: string;
    prefecture?: string;
    spotType?: string;
    city?: string;
  }>;
}

export default async function SpotsPage({ searchParams }: SpotsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 12;
  const keyword = params.keyword ?? "";
  const prefecture = params.prefecture ?? "";
  const spotType = params.spotType ?? "";
  const city = params.city ?? "";

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  if (keyword) {
    query.set("keyword", keyword);
  }
  if (prefecture) {
    query.set("prefecture", prefecture);
  }
  if (spotType) {
    query.set("category", spotType);
  }
  if (city) {
    query.set("city", city);
  }

  // Fetch spots data
  const data = (await authenticatedFetch(
    `/api/spots/?${query.toString()}`,
  )) as PaginatedResponse<Spot>;

  // Fetch available prefectures for filter
  let availablePrefectures: string[] = [];
  try {
    const prefectureStats = (await authenticatedFetch(
      "/api/prefectures/stats"
    )) as PrefectureStatsResponse;
    availablePrefectures = prefectureStats.by_prefecture.map(
      (stat) => stat.prefecture
    );
  } catch (error) {
    console.error("Failed to load prefecture options:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Spots</h1>
        <p className="text-muted-foreground">
          Browse your registered shrine, temple, and museum spots. Use the
          advanced search to refine results by multiple criteria.
        </p>
      </div>
      <Suspense
        fallback={<div className="rounded-lg border p-6">Loading search...</div>}
      >
        <AdvancedSearch
          keyword={keyword}
          prefectures={prefecture ? [prefecture] : []}
          categories={spotType ? [spotType] : []}
          city={city}
          pageSize={size}
          availablePrefectures={availablePrefectures}
        />
      </Suspense>
      <SpotsInfiniteList
        initialData={data}
        pageSize={size}
        initialFilters={{ keyword, prefecture, spotType }}
      />
    </div>
  );
}
