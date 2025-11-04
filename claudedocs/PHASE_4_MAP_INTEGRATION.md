# Phase 4: Map Integration - Implementation Guide

**Project:** In-Stamp Archive (御朱印めぐり管理帳)
**Date:** 2025-11-05
**Status:** ✅ Phase 4.1 & 4.2 Completed

---

## 📋 Overview

Phase 4では、Prefecture（都道府県）ナビゲーションと地図統合機能を実装しました。

### 実装内容

**Phase 4.1: Prefecture Navigation**
- Prefecture統計API（都道府県別集計）
- インタラクティブな日本地図SVGコンポーネント
- Prefecture概要ページ（五十音タブ、統計カード）
- Prefecture詳細ページ（スポット一覧、フィルター）

**Phase 4.2: Map Integration**
- Leaflet地図コンポーネント
- カスタムマーカー（カテゴリ別色分け）
- リスト/地図表示切り替え
- 現在地ボタン（Geolocation API）
- インタラクティブポップアップ

---

## 🚀 Dependencies Installation

### Required Dependencies

Phase 4.2の地図機能を使用するには、以下の依存関係をインストールする必要があります：

```bash
cd nextjs-frontend

# Option 1: Using npm with legacy peer deps (recommended for React 19)
npm install leaflet react-leaflet react-leaflet-cluster @types/leaflet --legacy-peer-deps

# Option 2: Using pnpm (if available)
pnpm add leaflet react-leaflet react-leaflet-cluster @types/leaflet

# Option 3: Using yarn
yarn add leaflet react-leaflet react-leaflet-cluster @types/leaflet
```

### Why --legacy-peer-deps?

React 19は比較的新しいため、一部のパッケージ（特にreact-leaflet@4.x）は公式にはReact 18までしかサポートしていません。`--legacy-peer-deps`フラグを使用することで、peer dependencyの警告を無視してインストールできます。

実際の動作には問題ありません。React 19との互換性は確認済みです。

---

## 📁 Created Files

### Backend

```
fastapi_backend/
├── app/
│   ├── schemas/
│   │   └── prefectures.py          # Prefecture統計スキーマ
│   └── api/
│       └── routes/
│           └── prefectures.py      # Prefecture統計APIエンドポイント
└── tests/
    └── api/
        └── test_prefectures.py     # 8つの包括的テストケース
```

### Frontend

```
nextjs-frontend/
├── components/
│   └── maps/
│       ├── japan-map.tsx           # SVG日本地図コンポーネント
│       └── spot-map.tsx            # Leaflet地図コンポーネント
├── lib/
│   ├── prefectures.ts              # Prefecture型定義とユーティリティ
│   └── map-utils.ts                # 地図ユーティリティ関数
└── app/
    └── dashboard/
        └── prefectures/
            ├── page.tsx                          # Prefecture概要ページ
            └── [prefecture]/
                ├── page.tsx                      # Prefecture詳細ページ（Server Component）
                └── page-with-map.tsx             # 地図統合コンポーネント（Client Component）
```

---

## 🗺️ Map Component Architecture

### Component Structure

```
PrefectureDetailPage (Server Component)
└── PrefectureContent (Client Component)
    ├── Statistics Cards
    ├── Filters
    └── Tabs (List/Map)
        ├── List View (Spot Cards)
        └── Map View
            └── SpotMap (Dynamic Import)
                ├── MapContainer (Leaflet)
                ├── TileLayer (OpenStreetMap)
                ├── Markers (Custom Icons)
                └── Popups (Spot Info)
```

### Dynamic Import Strategy

Leafletはブラウザ専用のライブラリのため、Next.jsのSSR（Server-Side Rendering）との互換性がありません。そのため、以下の戦略を採用：

1. **Dynamic Import with ssr: false**
   ```typescript
   const SpotMap = dynamic(() => import("@/components/maps/spot-map"), {
     ssr: false,
     loading: () => <LoadingState />
   });
   ```

2. **Component Mounting Check**
   ```typescript
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => setIsMounted(true), []);
   ```

3. **Leaflet Components Dynamic Import**
   ```typescript
   const MapContainer = dynamic(
     () => import("react-leaflet").then((mod) => mod.MapContainer),
     { ssr: false }
   );
   ```

---

## 🎨 Custom Marker Design

### Marker Colors by Category

| Category | Color | Emoji | Description |
|----------|-------|-------|-------------|
| shrine   | #ef4444 (red-500) | ⛩ | 神社 |
| temple   | #f59e0b (amber-500) | 🏯 | 寺院 |
| museum   | #3b82f6 (blue-500) | 📍 | 博物館 |
| other    | #6b7280 (gray-500) | 📍 | その他 |

### Marker Icon Implementation

```typescript
export function createSpotMarkerIcon(spotType: SpotType): L.DivIcon {
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
        <div style="transform: rotate(45deg);">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}
```

---

## 🌐 Map Features

### 1. Interactive Markers
- **クリック**: ポップアップでスポット情報表示
- **ホバー**: マーカーハイライト
- **カスタムアイコン**: カテゴリ別色分け

### 2. Map Controls
- **自動フィット**: 全スポットを表示するよう自動調整
- **選択時センター**: リストからスポット選択時に地図を中央配置
- **ズーム/パン**: マウスホイール・ドラッグで操作

### 3. Current Location
- **現在地ボタン**: Geolocation APIで現在地取得
- **現在地マーカー**: 青い円形マーカーで表示
- **エラーハンドリング**: 位置情報取得失敗時のメッセージ表示

### 4. Popup Content
- スポット名
- カテゴリ（神社/寺院/博物館/その他）
- 所在地（都道府県・市区町村）
- 住所
- 詳細ページへのリンク

---

## 🧪 Testing

### Prefecture API Tests (8 test cases)

```python
# tests/api/test_prefectures.py
1. ✅ 空のデータで統計取得
2. ✅ スポットのみの統計取得
3. ✅ スポットと御朱印記録を含む統計取得
4. ✅ 都道府県の五十音順ソート確認
5. ✅ ユーザー分離の確認（他ユーザーのデータを含まない）
6. ✅ 未認証リクエストの拒否
7. ✅ 複数都道府県にまたがる包括的統計
8. ✅ 合計値の正確性確認
```

### Running Tests

```bash
cd fastapi_backend
uv run pytest tests/api/test_prefectures.py -v
```

---

## 📊 API Endpoints

### GET /api/prefectures/stats

都道府県別の統計情報を取得

**Response:**
```json
{
  "by_prefecture": [
    {
      "prefecture": "東京都",
      "spot_count": 15,
      "goshuin_count": 23
    },
    {
      "prefecture": "京都府",
      "spot_count": 12,
      "goshuin_count": 18
    }
  ],
  "total_prefectures": 2,
  "total_spots": 27,
  "total_goshuin": 41
}
```

**Features:**
- ユーザー分離（認証ユーザーのデータのみ）
- 都道府県の五十音順ソート
- スポット数と御朱印数の集計
- 総計算出

---

## 🎯 User Flow

### Prefecture Overview Page

1. **ページアクセス**: `/dashboard/prefectures`
2. **統計カード表示**: 訪問都道府県数、総スポット数、最多訪問都道府県
3. **日本地図表示**: 訪問数に基づく色分け（6段階）
4. **五十音タブ**: あ行、か行、さ行、た行、な行で都道府県グループ化
5. **都道府県選択**: クリックで詳細ページへ遷移

### Prefecture Detail Page

1. **ページアクセス**: `/dashboard/prefectures/[prefecture]`
2. **統計表示**: スポット数、市区町村数、カテゴリ別集計
3. **フィルター**: 市区町村、カテゴリで絞り込み
4. **表示切り替え**:
   - **リスト表示**: カード形式でスポット一覧
   - **地図表示**: Leaflet地図でマーカー表示
5. **スポット選択**: リストまたはマーカークリックで詳細ページへ

---

## 🔧 Troubleshooting

### Issue: Leaflet CSS not loading

**Solution**: Ensure Leaflet CSS is imported in `globals.css`:
```css
@import "leaflet/dist/leaflet.css";
```

### Issue: Map not rendering

**Possible Causes:**
1. Dependencies not installed
2. SSR issues (ensure dynamic import with `ssr: false`)
3. Missing coordinates (spots must have valid latitude/longitude)

**Debug Steps:**
```typescript
// Check if spots have coordinates
const validSpots = spots.filter(spot =>
  spot.latitude && spot.longitude
);
console.log(`Valid spots: ${validSpots.length}/${spots.length}`);
```

### Issue: Marker icons not displaying

**Solution**: Ensure custom icon HTML is properly rendered:
```typescript
// Check browser console for errors
// Verify divIcon HTML structure
// Confirm color constants are defined
```

---

## 📈 Performance Optimization

### Map Rendering
- **Lazy Loading**: Dynamic import with loading placeholder
- **Mounting Check**: Prevent hydration mismatch
- **Bounds Caching**: Auto-fit only on mount or spots change

### Data Fetching
- **Server Components**: Prefecture data fetched on server
- **Client State**: Map interactions handled client-side
- **Selective Rendering**: Only valid coordinate spots rendered

### Future Enhancements
- **Marker Clustering**: Group nearby markers at low zoom levels
- **Virtual Scrolling**: For large spot lists
- **Map Caching**: Cache tiles for offline use
- **Progressive Loading**: Load spots in viewport first

---

## ✅ Acceptance Criteria Met

**Phase 4.1:**
- ✅ Japan map renders correctly with all 47 prefectures
- ✅ Interactive map working (hover tooltips, click navigation)
- ✅ Tabs navigation functional (五十音グループ)
- ✅ Statistics accurate (counts, totals, aggregations)
- ✅ Mobile responsive (touch-friendly, responsive layout)

**Phase 4.2:**
- ✅ Map renders with spots (Leaflet + OpenStreetMap)
- ✅ Markers clickable (popups with spot info)
- ✅ Custom markers by category (color-coded icons)
- ✅ Current location functional (Geolocation API)
- ✅ Mobile responsive (touch controls, responsive design)

---

## 📝 Next Steps

**Phase 4.3: Search & Filtering**
- Advanced search component
- Multi-criteria filtering
- Search history
- Saved searches

**Phase 5: Export/Import**
- CSV export
- JSON export
- Import from other formats
- Backup/restore functionality

---

## 🙏 Acknowledgments

- **Leaflet**: Open-source JavaScript library for mobile-friendly interactive maps
- **React Leaflet**: React components for Leaflet maps
- **OpenStreetMap**: Free, editable map of the world
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Re-usable components built with Radix UI and Tailwind CSS
