import {
  createGoshuinRecord,
  fetchGoshuinRecordsForSpot,
  fetchSpotDetail,
} from "@/components/actions/goshuin-actions";
import { GoshuinForm } from "./_components/goshuin-form";
import { VisitTimeline } from "./_components/visit-timeline";
import { GoshuinGrid } from "./_components/goshuin-grid";

interface SpotDetailPageProps {
  params: Promise<{ spotId: string }>;
}

const formatLocation = (
  prefecture: string | null,
  city: string | null,
  address: string | null,
) => {
  const parts = [prefecture, city, address].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No address information";
};

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  const { spotId } = await params;
  const [spot, goshuinPage] = await Promise.all([
    fetchSpotDetail(spotId),
    fetchGoshuinRecordsForSpot(spotId),
  ]);

  const createAction = createGoshuinRecord.bind(null, spotId);
  const records = goshuinPage.items;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {spot.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {formatLocation(spot.prefecture, spot.city, spot.address)}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {spot.spot_type}
            </span>
            {spot.website_url && (
              <a
                className="text-blue-600 underline hover:text-blue-700"
                href={spot.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official site
              </a>
            )}
            {spot.phone_number && <span>Tel: {spot.phone_number}</span>}
          </div>
          {spot.description && (
            <p className="text-gray-700 dark:text-gray-200 max-w-3xl">
              {spot.description}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Log a goshuin visit</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track visit status, acquisition method, and notes for this spot.
          </p>
        </div>
        <GoshuinForm
          action={createAction}
          submitLabel="Create goshuin record"
          enableImageUpload
        />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Visit timeline</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Chronological overview of your goshuin activity, including visit
            status and acquisition method.
          </p>
        </div>
        <VisitTimeline records={records} />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Goshuin records</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your goshuin entries. Edit or remove records as your
            collection evolves.
          </p>
        </div>
        <GoshuinGrid records={records} spotId={spotId} />
      </section>
    </div>
  );
}
