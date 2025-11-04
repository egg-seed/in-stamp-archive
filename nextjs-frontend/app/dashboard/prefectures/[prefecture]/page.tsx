import { notFound } from "next/navigation";

import { PrefectureContent } from "./page-with-map";
import { authenticatedFetch } from "@/lib/auth-fetch";
import { PaginatedResponse, Spot } from "@/lib/spots";
import { logger } from "@/lib/logger";

interface PrefectureDetailPageProps {
  params: Promise<{ prefecture: string }>;
  searchParams: Promise<{ category?: string; city?: string; search?: string }>;
}

export default async function PrefectureDetailPage({
  params,
  searchParams,
}: PrefectureDetailPageProps) {
  const { prefecture } = await params;
  const filters = await searchParams;
  const decodedPrefecture = decodeURIComponent(prefecture);

  let spots: PaginatedResponse<Spot> | null = null;
  let uniqueCities: string[] = [];

  try {
    // Build query string with filters
    const queryParams = new URLSearchParams({
      prefecture: decodedPrefecture,
      page: "1",
      size: "50",
    });

    if (filters.category) {
      queryParams.set("category", filters.category);
    }
    if (filters.city) {
      queryParams.set("city", filters.city);
    }
    if (filters.search) {
      queryParams.set("search", filters.search);
    }

    spots = (await authenticatedFetch(
      `/api/spots?${queryParams.toString()}`
    )) as PaginatedResponse<Spot>;

    // Extract unique cities from the spots
    if (spots?.items) {
      const cities = spots.items
        .map((spot) => spot.city)
        .filter((city): city is string => Boolean(city));
      uniqueCities = Array.from(new Set(cities)).sort();
    }
  } catch (error) {
    logger.error("Failed to load prefecture spots", error, { prefecture: decodedPrefecture });
  }

  if (!spots) {
    notFound();
  }

  const spotList = spots.items || [];

  return (
    <PrefectureContent
      prefecture={decodedPrefecture}
      spots={spotList}
      uniqueCities={uniqueCities}
      filters={filters}
    />
  );
}
