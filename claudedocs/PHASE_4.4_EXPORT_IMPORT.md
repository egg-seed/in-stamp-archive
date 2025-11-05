# Phase 4.4: Export/Import - Implementation Guide

**Project:** In-Stamp Archive (御朱印めぐり管理帳)
**Date:** 2025-11-05
**Status:** ✅ Complete

---

## 📋 Overview

Phase 4.4では、データのエクスポート/インポート機能のフロントエンドUIを実装しました。バックエンドAPIは既に完全に実装されていたため、UIページとナビゲーションの統合のみを行いました。

### 実装内容

**Frontend UI:**
- Export page with download functionality
- Import page with file upload
- Dashboard navigation integration
- Toast notifications for user feedback
- Error handling and validation

**Backend API (既存):**
- JSON export endpoint
- CSV export endpoint
- JSON import endpoint
- Complete data serialization service

---

## 📁 Created Files

### Frontend Pages

```
nextjs-frontend/
└── app/
    └── dashboard/
        ├── export/
        │   ├── page.tsx                 # Export page (Server Component)
        │   └── export-content.tsx       # Export UI (Client Component)
        └── import/
            ├── page.tsx                 # Import page (Server Component)
            └── import-content.tsx       # Import UI (Client Component)
```

### File Details

#### `app/dashboard/export/page.tsx`
**Purpose:** Server Component wrapper for export functionality

**Content:**
- Page title and description
- Suspense boundary for loading state
- ExportContent client component integration

#### `app/dashboard/export/export-content.tsx`
**Purpose:** Client Component with export download functionality

**Features:**
- JSON export (complete backup)
- CSV export (goshuin records)
- Download button with loading states
- File download handling
- Toast notifications
- Error handling

**Export Options:**
```typescript
const EXPORT_OPTIONS = [
  {
    id: "json",
    title: "完全バックアップ (JSON)",
    description: "すべてのスポット、御朱印記録、画像URLを含む完全なデータエクスポート",
    endpoint: "/api/export/json",
    filename: "goshuin-backup.json",
  },
  {
    id: "csv",
    title: "御朱印記録 (CSV)",
    description: "御朱印記録をCSV形式でエクスポート",
    endpoint: "/api/export/csv",
    filename: "goshuin-records.csv",
  },
];
```

#### `app/dashboard/import/page.tsx`
**Purpose:** Server Component wrapper for import functionality

**Content:**
- Page title and description
- Suspense boundary for loading state
- ImportContent client component integration

#### `app/dashboard/import/import-content.tsx`
**Purpose:** Client Component with file upload and import functionality

**Features:**
- File input for JSON files
- Upload button with loading states
- Import result display
- Error messages with Alert component
- Warning about data overwrite
- Success feedback with statistics

**Import Result Display:**
```typescript
interface ImportResult {
  spots: number;
  goshuin_records: number;
  spot_images: number;
  goshuin_images: number;
}
```

---

## 🔧 Integration

### Updated Files

#### `app/dashboard/(authenticated)/layout.tsx`

**Changes:**
1. Added Download and Upload icons from lucide-react
2. Added export and import navigation items
3. Positioned between goshuin and settings

**Before:**
```typescript
import {
  Landmark,
  LayoutDashboard,
  Map,
  Settings2,
  Stamp,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  // ... existing items
  {
    href: "/dashboard/goshuin",
    label: "御朱印記録",
    icon: Stamp,
    description: "参拝記録とアルバム",
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: Settings2,
    description: "プロフィールと表示設定",
  },
] as const;
```

**After:**
```typescript
import {
  Download,
  Landmark,
  LayoutDashboard,
  Map,
  Settings2,
  Stamp,
  Upload,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  // ... existing items
  {
    href: "/dashboard/goshuin",
    label: "御朱印記録",
    icon: Stamp,
    description: "参拝記録とアルバム",
  },
  {
    href: "/dashboard/export",
    label: "エクスポート",
    icon: Download,
    description: "データのバックアップ",
  },
  {
    href: "/dashboard/import",
    label: "インポート",
    icon: Upload,
    description: "データの復元",
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: Settings2,
    description: "プロフィールと表示設定",
  },
] as const;
```

---

## 🎨 UI Components Architecture

### Export Page Flow

```
ExportPage (Server Component)
└── ExportContent (Client Component)
    ├── Export Options Cards
    │   ├── JSON Backup Card
    │   │   └── Download Button
    │   └── CSV Records Card
    │       └── Download Button
    └── Information Card
        └── Usage notes and warnings
```

### Import Page Flow

```
ImportPage (Server Component)
└── ImportContent (Client Component)
    ├── File Upload Card
    │   ├── Hidden File Input
    │   └── Upload Button
    ├── Result Alert (conditional)
    │   └── Import statistics
    ├── Error Alert (conditional)
    │   └── Error message
    └── Information Card
        └── Important warnings and notes
```

### shadcn/ui Components Used

- `Button` - Action buttons
- `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` - Layout containers
- `Alert` / `AlertTitle` / `AlertDescription` - Messages and results
- `useToast` - Notification system
- Icons from `lucide-react`

---

## 🔄 Export Functionality

### JSON Export Flow

1. User clicks "ダウンロード" on JSON Backup card
2. Frontend sends GET request to `/api/export/json`
3. Backend streams complete JSON data
4. Frontend receives blob response
5. Creates temporary download link
6. Triggers browser download
7. Cleanup and success toast

**File Format:**
```json
{
  "version": "1.0",
  "generated_at": "2025-11-05T10:30:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "spots": [
    {
      "id": "uuid",
      "name": "浅草寺",
      "spot_type": "temple",
      "prefecture": "東京都",
      "images": [...],
      "goshuin_records": [...]
    }
  ],
  "pdf_document": [...]
}
```

### CSV Export Flow

1. User clicks "ダウンロード" on CSV Records card
2. Frontend sends GET request to `/api/export/csv`
3. Backend streams CSV data
4. Frontend receives blob response
5. Creates temporary download link
6. Triggers browser download
7. Cleanup and success toast

**CSV Format:**
```csv
spot_id,spot_name,spot_slug,spot_type,prefecture,city,visit_date,acquisition_method,status,rating,notes
uuid,浅草寺,senso-ji,temple,東京都,台東区,2025-01-01,in_person,collected,5,"素晴らしい御朱印でした"
```

---

## 📥 Import Functionality

### Import Flow

1. User clicks "ファイルを選択" button
2. Browser file dialog opens
3. User selects JSON file
4. Frontend validates file extension (.json)
5. Frontend reads file content
6. Frontend parses JSON
7. Frontend sends POST request to `/api/export/json` with data
8. Backend validates user ownership
9. Backend imports data (merge/overwrite)
10. Backend returns import statistics
11. Frontend displays success message with counts
12. File input reset

### Validation

**Client-side:**
- File extension must be `.json`
- File must be valid JSON format
- User receives clear error messages

**Server-side:**
- Export bundle must belong to authenticated user
- Data structure must match ExportBundle schema
- Database constraints enforced during import

### Data Merge Behavior

The import uses SQLAlchemy's `merge()` which:
- Overwrites existing records with same ID
- Creates new records for new IDs
- Preserves relationships and constraints

---

## ⚠️ Important Notes

### Export Considerations

1. **Image URLs Only**: Exports contain image URLs, not the image files themselves
2. **Privacy**: Exported files contain personal information
3. **Regular Backups**: Users should export regularly for data safety
4. **File Size**: Large collections may result in large JSON files

### Import Considerations

1. **Data Overwrite**: Import will overwrite existing data with same IDs
2. **Backup First**: Users should export current data before importing
3. **File Format**: Only JSON exports from this app are supported
4. **Image Availability**: Imported image URLs must still be accessible
5. **User Ownership**: Cannot import data belonging to other users

---

## 🧪 Testing Checklist

### Export Tests

- ✅ JSON export downloads successfully
- ✅ CSV export downloads successfully
- ✅ File naming includes timestamp
- ✅ Content-Disposition header respected
- ✅ Loading states display correctly
- ✅ Toast notifications show on success
- ✅ Error handling for API failures
- ✅ Multiple exports work sequentially

### Import Tests

- ✅ File selection dialog opens
- ✅ JSON file validation works
- ✅ Non-JSON files rejected
- ✅ Import success shows statistics
- ✅ Import errors displayed clearly
- ✅ File input resets after import
- ✅ Toast notifications show results
- ✅ Warning messages visible
- ✅ User ownership validation works

### Navigation Tests

- ✅ Export link appears in sidebar
- ✅ Import link appears in sidebar
- ✅ Links work on desktop
- ✅ Links work on mobile
- ✅ Icons display correctly
- ✅ Descriptions show in sidebar

---

## 📊 Backend API Reference

### Export Endpoints

#### GET `/api/export/json`
**Authentication:** Required (JWT token in cookies)

**Response:**
- Content-Type: `application/json`
- Content-Disposition: `attachment; filename="goshuin-export-{timestamp}.json"`
- Streaming response

**Data Structure:** Complete `ExportBundle` with all user data

#### GET `/api/export/csv`
**Authentication:** Required (JWT token in cookies)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="goshuin-export-{timestamp}.csv"`
- Streaming response

**Data Structure:** CSV with spot and goshuin record data

### Import Endpoints

#### POST `/api/export/json`
**Authentication:** Required (JWT token in cookies)

**Request Body:**
```json
{
  "version": "1.0",
  "generated_at": "...",
  "user": {...},
  "spots": [...],
  "pdf_document": [...]
}
```

**Response:**
```json
{
  "spots": 10,
  "goshuin_records": 25,
  "spot_images": 15,
  "goshuin_images": 30
}
```

**Errors:**
- 400: Invalid data or user mismatch
- 401: Unauthorized
- 500: Server error during import

---

## 🚀 Future Enhancements

### Phase 1: Enhanced Export Options
- Separate CSV for spots only
- Filter exports by date range
- Filter exports by prefecture
- Selective export (choose specific spots)
- Image file export (zip archive)

### Phase 2: Import Improvements
- Import validation preview
- Dry-run mode (preview without importing)
- Conflict resolution options (merge vs replace)
- Partial import (select what to import)
- Import from other formats (CSV, Excel)

### Phase 3: Scheduled Backups
- Automatic backup scheduling
- Cloud storage integration
- Backup history management
- Restore from backup list
- Incremental backups

### Phase 4: Advanced Features
- PDF export with images
- Share exports with others
- Import from external sources
- Data migration tools
- Backup encryption

---

## 🛠️ Troubleshooting

### Issue: Download not starting

**Symptoms:** Button clicked but no download

**Debug Steps:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check authentication token
4. Test API directly with curl

**Solution:**
```bash
# Test export endpoint
curl -X GET "http://localhost:8000/api/export/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o test-export.json
```

### Issue: Import fails with validation error

**Symptoms:** "Export bundle does not belong to the authenticated user"

**Cause:** Attempting to import data exported by different user

**Solution:** Only import files that you exported yourself

### Issue: File too large

**Symptoms:** Import takes very long or fails

**Possible Causes:**
1. Very large JSON file (>50MB)
2. Network timeout
3. Server memory limit

**Solutions:**
- Split data into smaller exports
- Increase server timeout limits
- Use streaming import (future enhancement)

---

## ✅ Acceptance Criteria Met

**Phase 4.4 Requirements:**
- ✅ Export UI page created
- ✅ Import UI page created
- ✅ JSON export functional
- ✅ CSV export functional
- ✅ JSON import functional
- ✅ Navigation links added
- ✅ Download handling implemented
- ✅ File upload handling implemented
- ✅ Error handling complete
- ✅ User feedback (toasts/alerts)
- ✅ Documentation complete

---

## 📝 Next Steps

**Phase 5: Mobile Optimization & PWA**
- Service worker implementation
- Offline support
- App manifest
- Push notifications
- Install prompt

**Phase 6: Advanced Features**
- Scheduled backups
- Cloud storage integration
- PDF export with images
- Data analytics
- Social features

---

## 🙏 Acknowledgments

- **FastAPI**: Excellent async backend framework with streaming support
- **Next.js**: Server Components for optimal data fetching
- **shadcn/ui**: Beautiful UI components
- **Lucide React**: Icon library
- **SQLAlchemy**: Powerful ORM with merge functionality
