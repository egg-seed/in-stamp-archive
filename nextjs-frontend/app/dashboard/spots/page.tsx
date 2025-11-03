import { Suspense } from "react";

import { authenticatedFetch } from "@/lib/auth-fetch";
import { PaginatedResponse, Spot } from "@/lib/spots";
import SpotsInfiniteList from "@/components/spots/spots-infinite-list";
import SpotFilters from "@/components/spots/spot-filters";

interface SpotsPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    keyword?: string;
    prefecture?: string;
    spotType?: string;
  }>;
}

export default async function SpotsPage({ searchParams }: SpotsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 12;
  const keyword = params.keyword ?? "";
  const prefecture = params.prefecture ?? "";
  const spotType = params.spotType ?? "";

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

  const data = (await authenticatedFetch(
    `/api/spots/?${query.toString()}`,
  )) as PaginatedResponse<Spot>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Spots</h1>
        <p className="text-muted-foreground">
          Browse your registered shrine, temple, and museum spots. Scroll to
          load more or refine the results using filters.
        </p>
      </div>
      <Suspense
        fallback={<div className="rounded-lg border p-6">Loading filters...</div>}
      >
        <SpotFilters
          keyword={keyword}
          prefecture={prefecture}
          spotType={spotType}
          pageSize={size}
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
