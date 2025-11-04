"use client";

import { useState } from "react";

interface PrefectureData {
  prefecture: string;
  spot_count: number;
  goshuin_count: number;
}

interface JapanMapProps {
  prefectures: PrefectureData[];
  onPrefectureClick?: (prefecture: string) => void;
  className?: string;
}

// Simplified prefecture coordinates for SVG map
// Format: [prefecture_name, x, y, width, height]
const PREFECTURE_REGIONS = {
  // Hokkaido
  "北海道": { x: 350, y: 10, width: 120, height: 100 },

  // Tohoku
  "青森県": { x: 380, y: 130, width: 40, height: 40 },
  "岩手県": { x: 390, y: 175, width: 40, height: 45 },
  "宮城県": { x: 385, y: 225, width: 35, height: 30 },
  "秋田県": { x: 340, y: 155, width: 40, height: 50 },
  "山形県": { x: 345, y: 210, width: 35, height: 40 },
  "福島県": { x: 360, y: 255, width: 50, height: 45 },

  // Kanto
  "茨城県": { x: 390, y: 305, width: 40, height: 35 },
  "栃木県": { x: 370, y: 300, width: 35, height: 30 },
  "群馬県": { x: 345, y: 295, width: 35, height: 30 },
  "埼玉県": { x: 355, y: 330, width: 30, height: 25 },
  "千葉県": { x: 400, y: 340, width: 40, height: 30 },
  "東京都": { x: 370, y: 345, width: 25, height: 20 },
  "神奈川県": { x: 360, y: 368, width: 35, height: 22 },

  // Chubu
  "新潟県": { x: 320, y: 255, width: 45, height: 60 },
  "富山県": { x: 295, y: 310, width: 35, height: 25 },
  "石川県": { x: 285, y: 285, width: 30, height: 40 },
  "福井県": { x: 275, y: 330, width: 30, height: 30 },
  "山梨県": { x: 335, y: 335, width: 30, height: 25 },
  "長野県": { x: 310, y: 320, width: 40, height: 50 },
  "岐阜県": { x: 290, y: 350, width: 40, height: 35 },
  "静岡県": { x: 320, y: 370, width: 50, height: 30 },
  "愛知県": { x: 285, y: 390, width: 40, height: 30 },

  // Kansai
  "三重県": { x: 280, y: 420, width: 35, height: 45 },
  "滋賀県": { x: 265, y: 385, width: 25, height: 30 },
  "京都府": { x: 255, y: 360, width: 30, height: 35 },
  "大阪府": { x: 245, y: 400, width: 25, height: 20 },
  "兵庫県": { x: 220, y: 375, width: 45, height: 40 },
  "奈良県": { x: 255, y: 415, width: 25, height: 25 },
  "和歌山県": { x: 240, y: 440, width: 30, height: 40 },

  // Chugoku
  "鳥取県": { x: 205, y: 355, width: 35, height: 20 },
  "島根県": { x: 165, y: 350, width: 50, height: 25 },
  "岡山県": { x: 210, y: 395, width: 35, height: 25 },
  "広島県": { x: 175, y: 385, width: 50, height: 30 },
  "山口県": { x: 140, y: 405, width: 55, height: 25 },

  // Shikoku
  "徳島県": { x: 215, y: 430, width: 35, height: 25 },
  "香川県": { x: 200, y: 420, width: 30, height: 20 },
  "愛媛県": { x: 155, y: 425, width: 50, height: 30 },
  "高知県": { x: 180, y: 455, width: 55, height: 25 },

  // Kyushu
  "福岡県": { x: 110, y: 420, width: 35, height: 30 },
  "佐賀県": { x: 95, y: 435, width: 25, height: 20 },
  "長崎県": { x: 60, y: 430, width: 40, height: 45 },
  "熊本県": { x: 100, y: 455, width: 35, height: 35 },
  "大分県": { x: 130, y: 445, width: 35, height: 30 },
  "宮崎県": { x: 135, y: 475, width: 30, height: 40 },
  "鹿児島県": { x: 100, y: 490, width: 45, height: 55 },

  // Okinawa
  "沖縄県": { x: 80, y: 575, width: 60, height: 25 },
};

export default function JapanMap({
  prefectures,
  onPrefectureClick,
  className = "",
}: JapanMapProps) {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // Create a map of prefecture data for quick lookup
  const prefectureMap = new Map(
    prefectures.map((p) => [p.prefecture, p])
  );

  // Calculate color intensity based on visit count
  const getColorIntensity = (prefecture: string): string => {
    const data = prefectureMap.get(prefecture);
    if (!data || (data.spot_count === 0 && data.goshuin_count === 0)) {
      return "fill-gray-100 hover:fill-gray-200";
    }

    const totalActivity = data.spot_count + data.goshuin_count;
    if (totalActivity >= 20) return "fill-blue-600 hover:fill-blue-700";
    if (totalActivity >= 10) return "fill-blue-500 hover:fill-blue-600";
    if (totalActivity >= 5) return "fill-blue-400 hover:fill-blue-500";
    if (totalActivity >= 2) return "fill-blue-300 hover:fill-blue-400";
    return "fill-blue-200 hover:fill-blue-300";
  };

  const handlePrefectureClick = (prefecture: string) => {
    if (onPrefectureClick) {
      onPrefectureClick(prefecture);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 500 620"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(PREFECTURE_REGIONS).map(([prefecture, coords]) => {
          const fillClass = getColorIntensity(prefecture);
          const data = prefectureMap.get(prefecture);
          const isHovered = hoveredPrefecture === prefecture;

          return (
            <g key={prefecture}>
              <rect
                x={coords.x}
                y={coords.y}
                width={coords.width}
                height={coords.height}
                className={`${fillClass} stroke-white stroke-2 cursor-pointer transition-all duration-200 ${
                  isHovered ? "stroke-blue-800 stroke-[3]" : ""
                }`}
                rx="2"
                onMouseEnter={() => setHoveredPrefecture(prefecture)}
                onMouseLeave={() => setHoveredPrefecture(null)}
                onClick={() => handlePrefectureClick(prefecture)}
              />
              {/* Prefecture name label */}
              <text
                x={coords.x + coords.width / 2}
                y={coords.y + coords.height / 2}
                className="text-[8px] fill-gray-700 pointer-events-none select-none"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {prefecture.replace("県", "").replace("府", "").replace("都", "").replace("道", "")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPrefecture && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10 pointer-events-none">
          <h3 className="font-semibold text-lg mb-2">{hoveredPrefecture}</h3>
          {prefectureMap.get(hoveredPrefecture) ? (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">スポット:</dt>
                <dd className="font-medium">{prefectureMap.get(hoveredPrefecture)!.spot_count}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">御朱印:</dt>
                <dd className="font-medium">{prefectureMap.get(hoveredPrefecture)!.goshuin_count}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">データなし</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <span className="text-gray-600">訪問数:</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded" />
          <span className="text-xs">0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-200 border border-gray-300 rounded" />
          <span className="text-xs">1-2</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-300 border border-gray-300 rounded" />
          <span className="text-xs">2-5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-400 border border-gray-300 rounded" />
          <span className="text-xs">5-10</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 border border-gray-300 rounded" />
          <span className="text-xs">10-20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 border border-gray-300 rounded" />
          <span className="text-xs">20+</span>
        </div>
      </div>
    </div>
  );
}
