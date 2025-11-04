import Link from "next/link";

import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/auth-fetch";
import { GoshuinRecord, PaginatedResponse } from "@/lib/spots";
import { logger } from "@/lib/logger";

export default async function GoshuinListPage() {
  let goshuin: PaginatedResponse<GoshuinRecord> | null = null;

  try {
    goshuin = (await authenticatedFetch(
      "/api/goshuin?page=1&size=50&sort_order=desc",
    )) as PaginatedResponse<GoshuinRecord>;
  } catch (error) {
    logger.error("Failed to load goshuin records", error);
  }

  const records = goshuin?.items ?? [];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Goshuin Collection</h1>
          <p className="text-muted-foreground">
            View and manage all your goshuin records.
          </p>
        </div>
      </header>

      {records.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Link
              key={record.id}
              href={`/dashboard/goshuin/${record.id}`}
              className="group overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <article className="flex h-full flex-col p-4">
                <header className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {new Date(record.visit_date).toLocaleDateString()}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wide">
                    {record.status.replace(/_/g, " ")}
                  </span>
                </header>
                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div>
                    <dt className="font-medium text-foreground">Acquisition</dt>
                    <dd className="capitalize">
                      {record.acquisition_method.replace(/_/g, " ")}
                    </dd>
                  </div>
                  {record.rating ? (
                    <div>
                      <dt className="font-medium text-foreground">Rating</dt>
                      <dd>{record.rating} / 5</dd>
                    </div>
                  ) : null}
                  {record.cost ? (
                    <div>
                      <dt className="font-medium text-foreground">Cost</dt>
                      <dd>¥{record.cost}</dd>
                    </div>
                  ) : null}
                  {record.notes ? (
                    <div>
                      <dt className="font-medium text-foreground">Notes</dt>
                      <dd className="line-clamp-3 whitespace-pre-line">
                        {record.notes}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">No goshuin records yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start collecting goshuin by visiting spots and creating records.
          </p>
          <Button asChild>
            <Link href="/dashboard/spots">Explore Spots</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
