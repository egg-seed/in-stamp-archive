export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "in-stamp-archive/1.0 (+https://example.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) {
    return null;
  }

  const [result] = data;
  return {
    latitude: Number.parseFloat(result.lat),
    longitude: Number.parseFloat(result.lon),
    displayName: result.display_name,
  };
}
