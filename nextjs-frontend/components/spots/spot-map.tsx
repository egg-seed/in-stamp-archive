"use client";

interface SpotMapProps {
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
}

export default function SpotMap({ latitude, longitude, address }: SpotMapProps) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Location coordinates are not available for this spot.
      </div>
    );
  }

  const delta = 0.01;
  const south = latitude - delta;
  const north = latitude + delta;
  const west = longitude - delta;
  const east = longitude + delta;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const viewUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
        <iframe
          title="Spot location map"
          className="h-full w-full"
          src={embedUrl}
          loading="lazy"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {address ? <p className="truncate">{address}</p> : null}
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View on OpenStreetMap
        </a>
      </div>
    </div>
  );
}
