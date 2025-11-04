/**
 * Map utility functions for Leaflet integration
 */

import L from "leaflet";

/**
 * Default map center (Tokyo, Japan)
 */
export const DEFAULT_MAP_CENTER: [number, number] = [35.6762, 139.6503];

/**
 * Default zoom level
 */
export const DEFAULT_ZOOM = 5;

/**
 * Map tile layer configuration
 */
export const MAP_TILE_LAYER = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

/**
 * Spot type to marker color mapping
 */
export const SPOT_TYPE_COLORS = {
  shrine: "#ef4444", // red-500
  temple: "#f59e0b", // amber-500
  museum: "#3b82f6", // blue-500
  other: "#6b7280", // gray-500
} as const;

/**
 * Create a custom marker icon for a spot type
 */
export function createSpotMarkerIcon(spotType: keyof typeof SPOT_TYPE_COLORS): L.DivIcon {
  const color = SPOT_TYPE_COLORS[spotType] || SPOT_TYPE_COLORS.other;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
        ">
          ${spotType === "shrine" ? "⛩" : spotType === "temple" ? "🏯" : "📍"}
        </div>
      </div>
    `,
    className: "custom-spot-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

/**
 * Get marker icon based on spot type
 */
export function getMarkerIcon(spotType: string): L.DivIcon {
  const validType = (
    ["shrine", "temple", "museum", "other"] as const
  ).includes(spotType as any)
    ? (spotType as keyof typeof SPOT_TYPE_COLORS)
    : "other";

  return createSpotMarkerIcon(validType);
}

/**
 * Calculate bounds for a list of coordinates
 */
export function calculateBounds(
  coordinates: Array<[number, number]>
): L.LatLngBoundsExpression | null {
  if (coordinates.length === 0) return null;

  const lats = coordinates.map(([lat]) => lat);
  const lngs = coordinates.map(([, lng]) => lng);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ] as L.LatLngBoundsExpression;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat?: number | null, lng?: number | null): boolean {
  return (
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get current user location using Geolocation API
 */
export function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}
