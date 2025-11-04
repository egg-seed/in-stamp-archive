import { notFound } from "next/navigation";

import { GoshuinForm } from "@/components/goshuin/goshuin-form";
import GoshuinGalleryManager, {
  GoshuinImage,
} from "@/components/goshuin/goshuin-gallery-manager";
import { authenticatedFetch } from "@/lib/auth-fetch";
import { GoshuinRecord } from "@/lib/spots";
import { logger } from "@/lib/logger";

interface GoshuinDetailPageProps {
  params: Promise<{ recordId: string }>;
}

export default async function GoshuinDetailPage({
  params,
}: GoshuinDetailPageProps) {
  const { recordId } = await params;

  let record: GoshuinRecord | null = null;
  let images: GoshuinImage[] = [];

  try {
    record = (await authenticatedFetch(
      `/api/goshuin/${recordId}`,
    )) as GoshuinRecord;
    images = (await authenticatedFetch(
      `/api/goshuin/${recordId}/images`,
    )) as GoshuinImage[];
  } catch (error) {
    logger.error("Failed to load goshuin record", error, { recordId });
  }

  if (!record) {
    notFound();
  }

  const currentRecord = record as GoshuinRecord;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Goshuin Record Details</h1>
        <p className="text-muted-foreground">
          View and edit your goshuin record and manage associated images.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Record Information</h2>
        <GoshuinForm
          spotId={currentRecord.spot_id}
          recordId={currentRecord.id}
          defaultValues={{
            visit_date: currentRecord.visit_date,
            acquisition_method: currentRecord.acquisition_method,
            status: currentRecord.status,
            rating: currentRecord.rating?.toString(),
            cost: currentRecord.cost?.toString(),
            notes: currentRecord.notes || "",
          }}
        />
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Images</h2>
          <p className="text-sm text-muted-foreground">
            Manage images associated with this goshuin record.
          </p>
        </header>
        {images.length ? (
          <GoshuinGalleryManager recordId={recordId} images={images} />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No images have been uploaded for this goshuin record yet.
          </div>
        )}
      </section>
    </div>
  );
}
