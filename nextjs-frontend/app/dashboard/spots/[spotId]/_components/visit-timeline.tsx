import { GoshuinRecord, goshuinAcquisitionMethodLabels, goshuinStatusLabels } from "@/lib/goshuin";

interface VisitTimelineProps {
  records: GoshuinRecord[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const formatNotesPreview = (notes: string | null) => {
  if (!notes) {
    return null;
  }
  const trimmed = notes.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

export const VisitTimeline = ({ records }: VisitTimelineProps) => {
  if (!records.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-muted-foreground dark:border-gray-700">
        No goshuin visits have been recorded for this spot yet.
      </p>
    );
  }

  const sortedRecords = [...records].sort((a, b) => {
    const left = new Date(a.visit_date).getTime();
    const right = new Date(b.visit_date).getTime();
    return left - right;
  });

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-6">
        {sortedRecords.map((record) => {
          const formattedDate = dateFormatter.format(new Date(record.visit_date));
          const preview = formatNotesPreview(record.notes);
          return (
            <div key={record.id} className="relative">
              <span className="absolute -left-[9px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow ring-4 ring-blue-500/20" />
              <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {formattedDate}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                    {goshuinStatusLabels[record.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Acquired via {goshuinAcquisitionMethodLabels[record.acquisition_method]}
                  {record.rating ? ` · Rated ${record.rating}/5` : ""}
                </p>
                {preview && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {preview}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
