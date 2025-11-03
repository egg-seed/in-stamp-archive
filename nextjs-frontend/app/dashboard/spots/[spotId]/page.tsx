import { notFound } from "next/navigation";

import SpotDetailOverview from "@/components/spots/spot-detail-overview";
import { authenticatedFetch } from "@/lib/auth-fetch";
import { GoshuinRecord, PaginatedResponse, Spot, SpotImage } from "@/lib/spots";

interface SpotDetailPageProps {
  params: Promise<{ spotId: string }>;
}

export default async function SpotDetailPage({
  params,
}: SpotDetailPageProps) {
  const { spotId } = await params;

  let spot: Spot | null = null;
  let images: SpotImage[] = [];
  let goshuin: PaginatedResponse<GoshuinRecord> | null = null;

  try {
    spot = (await authenticatedFetch(`/api/spots/${spotId}`)) as Spot;
    images = (await authenticatedFetch(`/api/spots/${spotId}/images`)) as SpotImage[];
    goshuin = (await authenticatedFetch(
      `/api/goshuin?spot_id=${spotId}&page=1&size=12`,
    )) as PaginatedResponse<GoshuinRecord>;
  } catch (error) {
    console.error("Failed to load spot detail", error);
  }

  if (!spot) {
    notFound();
  }

  const currentSpot = spot as Spot;
  const goshuinRecords = goshuin?.items ?? [];

  return (
    <SpotDetailOverview
      spot={currentSpot}
      images={images}
      goshuin={goshuinRecords}
    />
  );
}
