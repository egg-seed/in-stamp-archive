import Link from "next/link";

import { Spot, SPOT_TYPE_LABELS } from "@/lib/spots";

interface SpotCardProps {
  spot: Spot;
}

export default function SpotCard({ spot }: SpotCardProps) {
  const initials = spot.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <Link
      href={`/dashboard/spots/${spot.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-40 items-center justify-center bg-muted text-3xl font-semibold text-muted-foreground">
        <span className="rounded-full bg-background px-6 py-3 shadow group-hover:bg-primary group-hover:text-primary-foreground">
          {initials || spot.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="line-clamp-1 text-lg font-semibold text-foreground">
            {spot.name}
          </h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type}
          </p>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          {spot.prefecture ? (
            <p>
              {spot.prefecture}
              {spot.city ? ` · ${spot.city}` : ""}
            </p>
          ) : null}
          {spot.address ? <p className="line-clamp-2">{spot.address}</p> : null}
          {spot.website_url ? (
            <p className="truncate text-xs text-blue-600 underline">
              {spot.website_url}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
