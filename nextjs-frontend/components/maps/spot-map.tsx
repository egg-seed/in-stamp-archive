"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import type { Spot } from "@/lib/spots";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  MAP_TILE_LAYER,
  getMarkerIcon,
  calculateBounds,
  isValidCoordinates,
  getCurrentLocation,
} from "@/lib/map-utils";

// Dynamic imports to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const useMap = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMap),
  { ssr: false }
);

interface SpotMapProps {
  spots: Spot[];
  selectedSpotId?: string;
  onSpotClick?: (spot: Spot) => void;
  className?: string;
}

/**
 * Component to handle map bounds and center updates
 */
function MapController({
  spots,
  selectedSpotId,
}: {
  spots: Spot[];
  selectedSpotId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (spots.length === 0) return;

    // Get valid coordinates
    const validCoords = spots
      .filter((spot) => isValidCoordinates(spot.latitude, spot.longitude))
      .map((spot) => [spot.latitude!, spot.longitude!] as [number, number]);

    if (validCoords.length === 0) return;

    // If a spot is selected, center on it
    if (selectedSpotId) {
      const selectedSpot = spots.find((s) => s.id === selectedSpotId);
      if (
        selectedSpot &&
        isValidCoordinates(selectedSpot.latitude, selectedSpot.longitude)
      ) {
        map.setView([selectedSpot.latitude!, selectedSpot.longitude!], 15);
        return;
      }
    }

    // Otherwise, fit bounds to show all spots
    const bounds = calculateBounds(validCoords);
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots, selectedSpotId, map]);

  return null;
}

/**
 * Spot popup content component
 */
function SpotPopupContent({ spot }: { spot: Spot }) {
  return (
    <div className="min-w-[200px] space-y-2">
      <h3 className="font-semibold text-lg">{spot.name}</h3>
      <div className="space-y-1 text-sm text-gray-600">
        {spot.spot_type && (
          <p className="capitalize">
            <span className="font-medium">タイプ:</span>{" "}
            {spot.spot_type === "shrine" && "神社"}
            {spot.spot_type === "temple" && "寺院"}
            {spot.spot_type === "museum" && "博物館"}
            {spot.spot_type === "other" && "その他"}
          </p>
        )}
        {spot.prefecture && (
          <p>
            <span className="font-medium">所在地:</span> {spot.prefecture}
            {spot.city && ` ${spot.city}`}
          </p>
        )}
        {spot.address && (
          <p className="text-xs">
            <span className="font-medium">住所:</span> {spot.address}
          </p>
        )}
      </div>
      <a
        href={`/dashboard/spots/${spot.id}`}
        className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
      >
        詳細を見る
      </a>
    </div>
  );
}

export default function SpotMap({
  spots,
  selectedSpotId,
  onSpotClick,
  className = "",
}: SpotMapProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(
    null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "現在地の取得に失敗しました"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Filter spots with valid coordinates
  const validSpots = spots.filter((spot) =>
    isValidCoordinates(spot.latitude, spot.longitude)
  );

  if (!isMounted) {
    return (
      <div className={`h-[500px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">地図を読み込み中...</p>
      </div>
    );
  }

  if (validSpots.length === 0) {
    return (
      <div className={`h-[500px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-gray-500">
            座標情報を持つスポットがありません
          </p>
          <p className="text-sm text-gray-400">
            スポットに緯度・経度を追加すると地図に表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Location Button */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          variant="secondary"
          size="sm"
          className="bg-white shadow-md hover:bg-gray-50"
        >
          {isLoadingLocation ? "取得中..." : "📍 現在地"}
        </Button>
        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-600 max-w-[200px]">
            {locationError}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            url={MAP_TILE_LAYER.url}
            attribution={MAP_TILE_LAYER.attribution}
            maxZoom={MAP_TILE_LAYER.maxZoom}
          />

          <MapController spots={validSpots} selectedSpotId={selectedSpotId} />

          {/* Spot Markers */}
          {validSpots.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.latitude!, spot.longitude!]}
              icon={getMarkerIcon(spot.spot_type)}
              eventHandlers={{
                click: () => onSpotClick?.(spot),
              }}
            >
              <Popup>
                <SpotPopupContent spot={spot} />
              </Popup>
            </Marker>
          ))}

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={L.divIcon({
                html: `
                  <div style="
                    background-color: #3b82f6;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                `,
                className: "current-location-marker",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">現在地</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" />
          <span>神社</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow" />
          <span>寺院</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
          <span>博物館</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow" />
          <span>その他</span>
        </div>
      </div>
    </div>
  );
}
