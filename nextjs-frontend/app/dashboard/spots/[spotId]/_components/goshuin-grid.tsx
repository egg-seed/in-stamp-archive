import { deleteGoshuinRecord, updateGoshuinRecord } from "@/components/actions/goshuin-actions";
import { GoshuinRecord } from "@/lib/goshuin";
import { GoshuinCard } from "./goshuin-card";

interface GoshuinGridProps {
  records: GoshuinRecord[];
  spotId: string;
}

export const GoshuinGrid = ({ records, spotId }: GoshuinGridProps) => {
  if (!records.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-muted-foreground dark:border-gray-700">
        No goshuin records found. Use the form above to add your first entry.
      </p>
    );
  }

  const sortedRecords = [...records].sort((a, b) => {
    const left = new Date(a.visit_date).getTime();
    const right = new Date(b.visit_date).getTime();
    return right - left;
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {sortedRecords.map((record) => (
        <GoshuinCard
          key={record.id}
          record={record}
          updateAction={updateGoshuinRecord.bind(null, spotId, record.id)}
          deleteAction={deleteGoshuinRecord.bind(null, spotId, record.id)}
        />
      ))}
    </div>
  );
};
