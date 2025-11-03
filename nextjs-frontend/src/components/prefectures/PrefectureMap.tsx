"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PREFECTURE_REGION_LABELS,
  PREFECTURE_REGIONS,
  type PrefectureMetadata,
  type PrefectureRegion,
  getPrefectureByCode,
  prefectures,
} from "@/src/data/prefectures";
import { cn } from "@/lib/utils";

const REGION_COLORS: Record<PrefectureRegion, string> = {
  Hokkaido: "fill-sky-200",
  Tohoku: "fill-emerald-200",
  Kanto: "fill-blue-200",
  Chubu: "fill-lime-200",
  Kansai: "fill-amber-200",
  Chugoku: "fill-rose-200",
  Shikoku: "fill-purple-200",
  "Kyushu & Okinawa": "fill-orange-200",
};

const REGION_LEGEND_COLORS: Record<PrefectureRegion, string> = {
  Hokkaido: "bg-sky-200",
  Tohoku: "bg-emerald-200",
  Kanto: "bg-blue-200",
  Chubu: "bg-lime-200",
  Kansai: "bg-amber-200",
  Chugoku: "bg-rose-200",
  Shikoku: "bg-purple-200",
  "Kyushu & Okinawa": "bg-orange-200",
};

const TILE_SIZE = 36;
const HALF_TILE = TILE_SIZE / 2;

export type PrefectureMapProps = {
  selectedCode?: string;
  hrefBase?: string;
  onSelect?: (prefecture: PrefectureMetadata) => void;
  className?: string;
  showLegend?: boolean;
};

export function PrefectureMap({
  selectedCode,
  hrefBase = "/dashboard/prefecture",
  onSelect,
  className,
  showLegend = true,
}: PrefectureMapProps) {
  const router = useRouter();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const orderedPrefectures = useMemo(
    () =>
      [...prefectures].sort((a, b) => {
        if (a.mapPosition.y === b.mapPosition.y) {
          return a.mapPosition.x - b.mapPosition.x;
        }
        return a.mapPosition.y - b.mapPosition.y;
      }),
    [],
  );

  const handleSelection = (pref: PrefectureMetadata) => {
    onSelect?.(pref);
    if (hrefBase) {
      router.push(`${hrefBase}/${pref.code}`);
    }
  };

  const selectedPrefecture = selectedCode
    ? getPrefectureByCode(selectedCode)
    : undefined;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <svg
          className="h-auto w-full"
          role="group"
          viewBox="0 0 360 560"
          aria-label="Prefecture selection map"
        >

          {orderedPrefectures.map((prefecture) => {
            const isSelected = prefecture.code === selectedCode;
            const isHovered = prefecture.code === hoveredCode;
            const isDimmed =
              !!selectedPrefecture &&
              selectedPrefecture.region !== prefecture.region &&
              !isSelected;

            const fillClass = isSelected
              ? "fill-blue-500"
              : isHovered
                ? "fill-blue-300"
                : REGION_COLORS[prefecture.region];

            return (
              <g
                key={prefecture.code}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${prefecture.ja} (${prefecture.name})`}
                transform={`translate(${prefecture.mapPosition.x - HALF_TILE}, ${prefecture.mapPosition.y - HALF_TILE})`}
                className={cn(
                  "cursor-pointer outline-none",
                  isDimmed && "opacity-30",
                )}
                onClick={() => handleSelection(prefecture)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelection(prefecture);
                  }
                }}
                onFocus={() => setHoveredCode(prefecture.code)}
                onBlur={() => setHoveredCode((current) => (current === prefecture.code ? null : current))}
                onMouseEnter={() => setHoveredCode(prefecture.code)}
                onMouseLeave={() => setHoveredCode((current) => (current === prefecture.code ? null : current))}
              >
                <rect
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  rx={10}
                  className={cn(
                    "stroke-[1.5] transition-all duration-200 ease-out",
                    isSelected ? "stroke-blue-600" : "stroke-slate-400",
                    fillClass,
                    (isHovered || isSelected) && "scale-105",
                  )}
                />
                <text
                  x={TILE_SIZE / 2}
                  y={TILE_SIZE / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className={cn(
                    "select-none text-[11px] font-semibold",
                    isSelected || isHovered ? "fill-white" : "fill-slate-700",
                  )}
                >
                  {prefecture.ja.replace("県", "").replace("府", "").replace("都", "")}
                </text>
                <title>{`${prefecture.ja} (${prefecture.name})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {PREFECTURE_REGIONS.map((region) => (
            <div key={region} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-sm",
                  REGION_LEGEND_COLORS[region as PrefectureRegion],
                )}
              />
              <span>{PREFECTURE_REGION_LABELS[region as PrefectureRegion]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
