import { GoshuinRecord } from "@/lib/spots";

interface SpotGoshuinGalleryProps {
  records: GoshuinRecord[];
}

export default function SpotGoshuinGallery({
  records,
}: SpotGoshuinGalleryProps) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No goshuin records have been linked to this spot yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((record) => (
        <article
          key={record.id}
          className="flex h-full flex-col rounded-xl border bg-background p-4 shadow-sm"
        >
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
            {record.notes ? (
              <div>
                <dt className="font-medium text-foreground">Notes</dt>
                <dd className="line-clamp-3 whitespace-pre-line">{record.notes}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
