# 御朱印めぐり管理帳 - System Design Document

## Document Overview

**Project**: In-Stamp Archive (御朱印めぐり管理帳)
**Version**: 1.0
**Date**: 2025-11-04
**Status**: Active Development

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Design](#2-architecture-design)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [File Storage & Image Handling](#7-file-storage--image-handling)
8. [Security Architecture](#8-security-architecture)
9. [Performance & Scalability](#9-performance--scalability)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Development Workflow](#11-development-workflow)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. System Overview

### 1.1 Purpose

A comprehensive web application for managing "goshuin" (御朱印) - traditional Japanese temple and shrine seal stamp collections. Users can register sacred spots (temples, shrines, castles), record their visits with digital photos of goshuin, and manage their spiritual journey across Japan's 47 prefectures.

### 1.2 Technology Stack

#### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async web framework)
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL 17
- **Authentication**: fastapi-users (JWT-based)
- **Validation**: Pydantic v2
- **Migrations**: Alembic
- **Pagination**: fastapi-pagination
- **Testing**: pytest + pytest-asyncio

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React, Heroicons
- **API Client**: Auto-generated from OpenAPI (hey-api)
- **Testing**: Jest + React Testing Library

#### Infrastructure
- **Development**: Docker Compose
- **Package Manager**: uv (Python), pnpm (Node.js)
- **Mail**: MailHog (development), SMTP (production)
- **Deployment**: Vercel (Frontend + Serverless Backend)
- **CI/CD**: GitHub Actions

### 1.3 Key Features

1. **Multi-User System**: Individual accounts with data isolation
2. **Spot Management**: CRUD for temples/shrines/castles with geolocation
3. **Goshuin Records**: Visit tracking with photo uploads
4. **Image Management**: Multiple photos per spot/goshuin with ordering
5. **Prefecture Navigation**: 47 prefectures with map and list views
6. **Search & Filter**: Full-text search, category filtering, date ranges
7. **Data Export**: JSON/CSV export with backup capability
8. **Responsive Design**: Mobile-first with WCAG 2.1 AA compliance

---

## 2. Architecture Design

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 Frontend (React 19 + TypeScript)               │
│  - App Router with Server Components                        │
│  - Client Components for interactivity                      │
│  - Auto-generated API Client (OpenAPI)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS (JSON)
                   │ Authentication: JWT (HTTP-only Cookie)
┌──────────────────▼──────────────────────────────────────────┐
│                   API Gateway Layer                          │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Application                                         │
│  - CORS Middleware (configured origins)                      │
│  - Authentication Middleware (fastapi-users)                 │
│  - Route Guards (dependency injection)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬────────────────┐
        │                     │                │
┌───────▼──────┐    ┌────────▼─────┐   ┌─────▼────────┐
│ Business     │    │ Storage      │   │ External     │
│ Logic Layer  │    │ Service      │   │ Services     │
├──────────────┤    ├──────────────┤   ├──────────────┤
│ - Spots API  │    │ - Vercel     │   │ - Email      │
│ - Goshuin API│    │   Blob       │   │   (SMTP)     │
│ - Images API │    │ - Local FS   │   │ - Geocoding  │
│ - Export API │    │   (dev)      │   │   (future)   │
└──────┬───────┘    └──────────────┘   └──────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
├─────────────────────────────────────────────────────────────┤
│  SQLAlchemy ORM (Async)                                      │
│  - Repository Pattern                                        │
│  - Connection Pooling (AsyncEngine)                          │
│  - Transaction Management                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  Persistence Layer                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 17                                               │
│  - Tables: users, spots, goshuin_records, images            │
│  - Indexes: user_id, prefecture, spot_type, visit_date      │
│  - Constraints: FK, unique, check                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### Backend Components

```
fastapi_backend/
├── app/
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Settings & environment config
│   ├── database.py             # DB connection & session
│   ├── users.py                # fastapi-users setup
│   ├── email.py                # Email service
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── base.py             # Base class
│   │   ├── user.py             # User model
│   │   ├── spots.py            # Spot & SpotImage models
│   │   ├── goshuin_records.py  # GoshuinRecord model
│   │   └── goshuin_images.py   # GoshuinImage model
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── spots.py            # Spot request/response
│   │   ├── goshuin.py          # Goshuin request/response
│   │   └── images.py           # Image schemas
│   │
│   ├── api/
│   │   ├── deps.py             # Dependency injection
│   │   └── routes/             # API route handlers
│   │       ├── spots.py        # Spot CRUD
│   │       ├── spot_images.py  # Spot image management
│   │       ├── goshuin.py      # Goshuin CRUD
│   │       ├── goshuin_images.py # Goshuin image management
│   │       └── export.py       # Data export
│   │
│   └── services/               # Business logic
│       ├── storage.py          # File storage abstraction
│       └── export.py           # Export functionality
│
├── tests/                      # Comprehensive test suite
└── alembic/                    # Database migrations
```

#### Frontend Components

```
nextjs-frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   │
│   ├── login/                  # Authentication pages
│   ├── register/
│   └── password-recovery/
│   │
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout
│   │   ├── page.tsx            # Dashboard home
│   │   │
│   │   ├── (authenticated)/    # Protected routes group
│   │   │   ├── spots/          # Spot management
│   │   │   ├── goshuin/        # Goshuin management
│   │   │   ├── prefectures/    # Prefecture overview
│   │   │   └── settings/       # User settings
│   │   │
│   │   ├── prefecture/[code]/  # Prefecture detail
│   │   └── spots/[spotId]/     # Spot detail (public)
│   │
│   └── api/                    # API route handlers (optional)
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── actions/                # Server actions
│   └── [feature]/              # Feature-specific components
│
├── lib/
│   ├── auth-fetch.ts           # Authenticated fetch wrapper
│   ├── errors.ts               # Error handling
│   └── logger.ts               # Logging utilities
│
└── src/
    ├── actions/                # Server actions
    └── client/                 # Auto-generated API client
```

### 2.3 Data Flow Architecture

#### Request Flow (Authenticated)

```
User Action
    ↓
Next.js Client Component
    ↓
[Client-side validation (Zod)]
    ↓
Server Action / API Client
    ↓
[Attach JWT from cookie]
    ↓
FastAPI Endpoint
    ↓
[Authentication Middleware]
    ↓
[Authorization Check (user ownership)]
    ↓
Route Handler
    ↓
Service Layer
    ↓
[Business Logic & Validation]
    ↓
SQLAlchemy ORM
    ↓
PostgreSQL
    ↓
[Response serialization (Pydantic)]
    ↓
JSON Response
    ↓
Next.js Client
    ↓
UI Update
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │◄─────────┐
│ email (UQ)   │          │
│ hashed_pwd   │          │
│ is_active    │          │
│ is_verified  │          │
└──────────────┘          │
                          │
                          │ user_id (FK)
┌──────────────┐          │
│    spots     │◄─────────┤
│──────────────│          │
│ id (PK)      │          │
│ user_id (FK) │──────────┘
│ slug (UQ)    │
│ name         │
│ spot_type    │◄───────────────┐
│ prefecture   │                │
│ city         │                │
│ address      │                │
│ latitude     │                │
│ longitude    │                │
│ description  │                │
│ website_url  │                │
│ phone_number │                │
│ created_at   │                │
│ updated_at   │                │
└──────┬───────┘                │
       │                        │
       │ spot_id (FK)           │
       │                        │
       ├────────────────────────┼──────────────┐
       │                        │              │
       │                        │              │
┌──────▼────────┐    ┌──────────▼──────┐    ┌─▼────────────────┐
│ spot_images   │    │ goshuin_records │    │                  │
│───────────────│    │─────────────────│    │                  │
│ id (PK)       │    │ id (PK)         │    │                  │
│ spot_id (FK)  │    │ user_id (FK)    │────┘                  │
│ image_url     │    │ spot_id (FK)    │                       │
│ image_type    │    │ visit_date      │                       │
│ is_primary    │    │ acquisition_    │                       │
│ display_order │    │   method        │                       │
│ created_at    │    │ status          │                       │
└───────────────┘    │ rating          │                       │
                     │ notes           │                       │
                     │ created_at      │                       │
                     │ updated_at      │                       │
                     └──────┬──────────┘                       │
                            │                                  │
                            │ record_id (FK)                   │
                            │                                  │
                     ┌──────▼──────────┐                      │
                     │ goshuin_images  │                      │
                     │─────────────────│                      │
                     │ id (PK)         │                      │
                     │ record_id (FK)  │                      │
                     │ image_url       │                      │
                     │ image_type      │                      │
                     │ display_order   │                      │
                     │ created_at      │                      │
                     └─────────────────┘                      │
```

### 3.2 Table Definitions

#### users (managed by fastapi-users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(320) UNIQUE NOT NULL,
    hashed_password VARCHAR(1024) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX ix_users_email ON users(email);
```

#### spots
```sql
CREATE TABLE spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    spot_type VARCHAR(20) NOT NULL CHECK (spot_type IN ('shrine', 'temple', 'museum', 'other')),
    prefecture VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address VARCHAR(255),
    latitude FLOAT CHECK (latitude >= -90 AND latitude <= 90),
    longitude FLOAT CHECK (longitude >= -180 AND longitude <= 180),
    description TEXT,
    website_url VARCHAR(255),
    phone_number VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_spots_user_id ON spots(user_id);
CREATE INDEX ix_spots_prefecture ON spots(prefecture);
CREATE INDEX ix_spots_spot_type ON spots(spot_type);
CREATE INDEX ix_spots_slug ON spots(slug);
```

#### spot_images
```sql
CREATE TABLE spot_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('exterior', 'interior', 'map', 'other')),
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT uq_spot_images_spot_id_display_order UNIQUE (spot_id, display_order)
);

CREATE INDEX ix_spot_images_spot_id ON spot_images(spot_id);
```

#### goshuin_records
```sql
CREATE TABLE goshuin_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    acquisition_method VARCHAR(20) NOT NULL CHECK (acquisition_method IN ('in_person', 'by_mail', 'event', 'online')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'collected', 'missed')),
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT uq_goshuin_records_unique_visit UNIQUE (user_id, spot_id, visit_date)
);

CREATE INDEX ix_goshuin_records_user_id ON goshuin_records(user_id);
CREATE INDEX ix_goshuin_records_spot_id ON goshuin_records(spot_id);
CREATE INDEX ix_goshuin_records_visit_date ON goshuin_records(visit_date DESC);
```

#### goshuin_images
```sql
CREATE TABLE goshuin_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES goshuin_records(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('stamp', 'page', 'detail', 'other')),
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT uq_goshuin_images_record_id_display_order UNIQUE (record_id, display_order)
);

CREATE INDEX ix_goshuin_images_record_id ON goshuin_images(record_id);
```

### 3.3 Data Integrity Rules

1. **Referential Integrity**: All foreign keys use `ON DELETE CASCADE` for automatic cleanup
2. **User Isolation**: All user-owned data includes `user_id` for access control
3. **Uniqueness Constraints**:
   - `users.email`: Prevents duplicate accounts
   - `spots.slug`: URL-friendly unique identifiers
   - `goshuin_records(user_id, spot_id, visit_date)`: Prevents duplicate visit entries
   - `*_images(parent_id, display_order)`: Ensures consistent ordering
4. **Check Constraints**:
   - Coordinate bounds validation
   - Enum value validation (spot_type, status, etc.)
   - Rating range validation (1-5)
5. **Timestamps**: Automatic `created_at` and `updated_at` tracking

---

## 4. API Design

### 4.1 API Architecture Principles

- **RESTful Design**: Resources as nouns, HTTP verbs for actions
- **Consistency**: Uniform response structure and error handling
- **Versioning**: `/api` prefix for future versioning capability
- **Pagination**: Cursor or offset-based for list endpoints
- **Filtering**: Query parameters for flexible data retrieval
- **Nested Resources**: Parent-child relationships in URLs

### 4.2 Authentication Endpoints

**Base Path**: `/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/jwt/login` | Login (returns JWT) | No |
| POST | `/auth/jwt/logout` | Logout (invalidate token) | Yes |
| POST | `/auth/forgot-password` | Request password reset email | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/request-verify-token` | Request email verification | Yes |
| POST | `/auth/verify` | Verify email with token | No |

### 4.3 User Management Endpoints

**Base Path**: `/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/me` | Update current user profile | Yes |
| DELETE | `/users/me` | Delete current user account | Yes |

### 4.4 Spot Management Endpoints

**Base Path**: `/api/spots`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/spots` | List spots (with pagination/filters) | Yes |
| POST | `/api/spots` | Create new spot | Yes |
| GET | `/api/spots/{spot_id}` | Get spot details | Yes |
| PATCH | `/api/spots/{spot_id}` | Update spot | Yes (owner) |
| DELETE | `/api/spots/{spot_id}` | Delete spot | Yes (owner) |

**Query Parameters for GET /api/spots**:
- `page` (int): Page number (default: 1)
- `size` (int): Page size (default: 20, max: 100)
- `prefecture` (str): Filter by prefecture
- `spot_type` (enum): Filter by type (shrine/temple/museum/other)
- `search` (str): Keyword search in name/description
- `sort_by` (str): Sort field (created_at/updated_at/name)
- `sort_order` (str): asc/desc

**Response Example**:
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "slug": "kinkaku-ji-kyoto",
      "name": "金閣寺",
      "spot_type": "temple",
      "prefecture": "京都府",
      "city": "京都市",
      "address": "京都市北区金閣寺町1",
      "latitude": 35.0394,
      "longitude": 135.7292,
      "description": "世界遺産に登録された...",
      "website_url": "https://www.shokoku-ji.jp/kinkakuji/",
      "phone_number": "075-461-0013",
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "size": 20
}
```

### 4.5 Spot Image Endpoints

**Base Path**: `/api/spots/{spot_id}/images`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/spots/{spot_id}/images` | List spot images | Yes |
| POST | `/api/spots/{spot_id}/images` | Upload spot image | Yes (owner) |
| PATCH | `/api/spots/{spot_id}/images/{image_id}` | Update image metadata | Yes (owner) |
| DELETE | `/api/spots/{spot_id}/images/{image_id}` | Delete image | Yes (owner) |
| POST | `/api/spots/{spot_id}/images/reorder` | Reorder images | Yes (owner) |

**Upload Request (multipart/form-data)**:
```
POST /api/spots/{spot_id}/images
Content-Type: multipart/form-data

file: [binary image data]
image_type: "exterior"
is_primary: true
display_order: 0
```

### 4.6 Goshuin Record Endpoints

**Base Path**: `/api/goshuin`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/goshuin` | List all goshuin records | Yes |
| GET | `/api/spots/{spot_id}/goshuin` | List goshuin for spot | Yes |
| POST | `/api/spots/{spot_id}/goshuin` | Create goshuin record | Yes |
| GET | `/api/goshuin/{record_id}` | Get goshuin details | Yes (owner) |
| PATCH | `/api/goshuin/{record_id}` | Update goshuin record | Yes (owner) |
| DELETE | `/api/goshuin/{record_id}` | Delete goshuin record | Yes (owner) |

**Create Request**:
```json
{
  "visit_date": "2025-11-04",
  "acquisition_method": "in_person",
  "status": "collected",
  "rating": 5,
  "notes": "Beautiful calligraphy..."
}
```

### 4.7 Goshuin Image Endpoints

**Base Path**: `/api/goshuin/{record_id}/images`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/goshuin/{record_id}/images` | List goshuin images | Yes (owner) |
| POST | `/api/goshuin/{record_id}/images` | Upload goshuin image | Yes (owner) |
| DELETE | `/api/goshuin/{record_id}/images/{image_id}` | Delete image | Yes (owner) |
| POST | `/api/goshuin/{record_id}/images/reorder` | Reorder images | Yes (owner) |

### 4.8 Export Endpoints

**Base Path**: `/api/export`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/export/json` | Export all data as JSON | Yes |
| GET | `/api/export/csv/spots` | Export spots as CSV | Yes |
| GET | `/api/export/csv/goshuin` | Export goshuin as CSV | Yes |
| POST | `/api/import/json` | Import from JSON | Yes |

### 4.9 Error Response Format

All error responses follow a consistent structure:

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "field": "field_name" // optional, for validation errors
}
```

**Common HTTP Status Codes**:
- `200 OK`: Successful GET/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate entry
- `422 Unprocessable Entity`: Semantic validation error
- `500 Internal Server Error`: Server error

---

## 5. Frontend Architecture

### 5.1 Next.js App Router Structure

The application uses Next.js 15's App Router with the following organization:

#### Route Groups
- `(authenticated)`: Protected routes requiring login
- `(public)`: Public-facing pages

#### Page Structure
```
app/
├── page.tsx                        # Landing page (/)
├── layout.tsx                      # Root layout
├── login/page.tsx                  # Login (/login)
├── register/page.tsx               # Registration (/register)
├── password-recovery/
│   ├── page.tsx                    # Request reset (/password-recovery)
│   └── confirm/page.tsx            # Confirm reset (/password-recovery/confirm)
│
└── dashboard/
    ├── layout.tsx                  # Dashboard layout
    ├── page.tsx                    # Dashboard home (/dashboard)
    │
    ├── (authenticated)/            # Protected routes
    │   ├── spots/
    │   │   ├── page.tsx            # Spot list
    │   │   └── [spotId]/
    │   │       ├── page.tsx        # Spot detail
    │   │       └── edit/page.tsx   # Spot edit
    │   │
    │   ├── goshuin/
    │   │   ├── page.tsx            # Goshuin list
    │   │   ├── new/page.tsx        # Create goshuin
    │   │   └── [recordId]/
    │   │       ├── page.tsx        # Goshuin detail
    │   │       └── edit/page.tsx   # Goshuin edit
    │   │
    │   ├── prefectures/page.tsx    # Prefecture overview
    │   └── settings/page.tsx       # User settings
    │
    ├── prefecture/[code]/page.tsx  # Prefecture spots (public)
    └── spots/[spotId]/page.tsx     # Spot detail (public view)
```

### 5.2 Component Architecture

#### Component Hierarchy
```
Layout Components (app/*/layout.tsx)
    ↓
Page Components (app/*/page.tsx)
    ↓
Feature Components (components/[feature]/)
    ↓
UI Components (components/ui/)
```

#### Component Types

1. **Server Components** (Default in Next.js 15)
   - Data fetching at build/request time
   - No client-side JavaScript
   - Used for: layouts, static content, initial data loading

2. **Client Components** (`"use client"`)
   - Interactive elements
   - State management
   - Event handlers
   - Used for: forms, modals, interactive maps

3. **Server Actions** (components/actions/*)
   - Form submissions
   - Mutations
   - Authentication operations

### 5.3 State Management Strategy

#### Local State (useState, useReducer)
- Form inputs
- UI toggles (modals, dropdowns)
- Component-specific state

#### URL State (useSearchParams, useRouter)
- Filters
- Pagination
- Sort order
- Search queries

#### Server State (Server Components + Server Actions)
- Database data
- User session
- Authentication status

#### Global State (React Context - when needed)
- Theme preference
- User profile (cached)
- Toast notifications

### 5.4 Data Fetching Strategy

#### Server Components (Preferred)
```typescript
// app/dashboard/spots/page.tsx
import { SpotsService } from '@/src/client/services.gen';

export default async function SpotsPage() {
  const spots = await SpotsService.listSpots({ page: 1, size: 20 });

  return <SpotsList spots={spots.items} />;
}
```

#### Client Components (When needed)
```typescript
// components/spot-filter.tsx
"use client";

import { useState, useEffect } from 'react';
import { SpotsService } from '@/src/client/services.gen';

export function SpotFilter() {
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    SpotsService.listSpots({ page: 1, size: 20 })
      .then(data => setSpots(data.items));
  }, []);

  return <div>{/* ... */}</div>;
}
```

### 5.5 Form Handling

All forms use React Hook Form + Zod for type-safe validation:

```typescript
// components/spot-form.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const spotSchema = z.object({
  name: z.string().min(1).max(255),
  spot_type: z.enum(['shrine', 'temple', 'museum', 'other']),
  prefecture: z.string().min(1),
  // ...
});

type SpotFormData = z.infer<typeof spotSchema>;

export function SpotForm() {
  const form = useForm<SpotFormData>({
    resolver: zodResolver(spotSchema),
  });

  const onSubmit = async (data: SpotFormData) => {
    await SpotsService.createSpot({ requestBody: data });
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

### 5.6 Image Upload Strategy

#### Multi-Part Upload Flow
1. Client: Select images via `<input type="file" multiple>`
2. Client: Preview images (FileReader API)
3. Client: Submit as `multipart/form-data`
4. Server: Validate file type/size
5. Server: Upload to storage service
6. Server: Save metadata to database
7. Client: Display uploaded images

#### Image Optimization
- Next.js `<Image>` component for automatic optimization
- Responsive images with `srcset`
- Lazy loading with `loading="lazy"`
- WebP format support

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

#### Registration Flow
```
User fills registration form
    ↓
Frontend validates (Zod)
    ↓
POST /auth/register
    ↓
Backend validates (Pydantic)
    ↓
Password hashed (bcrypt)
    ↓
User created in database
    ↓
Verification email sent (optional)
    ↓
Response: UserRead
```

#### Login Flow
```
User submits credentials
    ↓
POST /auth/jwt/login (form-data)
    ↓
Backend validates credentials
    ↓
Password verified (bcrypt)
    ↓
JWT token generated
    ↓
Token set in HTTP-only cookie
    ↓
Response: 200 OK
    ↓
Frontend redirects to /dashboard
```

#### Authenticated Request Flow
```
User makes request
    ↓
Browser sends request + JWT cookie
    ↓
Backend extracts JWT from cookie
    ↓
Token validated (signature, expiry)
    ↓
User loaded from database
    ↓
Request proceeds with User context
    ↓
Response sent
```

### 6.2 JWT Configuration

```python
# fastapi_backend/app/config.py
class Settings:
    JWT_SECRET: str  # from environment
    JWT_ALGORITHM: str = "HS256"
    JWT_LIFETIME_SECONDS: int = 3600  # 1 hour
    JWT_REFRESH_LIFETIME_SECONDS: int = 86400  # 24 hours
```

### 6.3 Authorization Strategy

#### Resource Ownership Model
All user-owned resources include `user_id` for access control:

```python
# Example: Spot ownership check
async def get_spot(
    spot_id: UUID,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(
        select(Spot).where(
            Spot.id == spot_id,
            Spot.user_id == user.id  # Ownership check
        )
    )
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot
```

#### Permission Levels
1. **Public**: No authentication required
   - Landing page
   - Login/register pages

2. **Authenticated**: Valid JWT required
   - Dashboard access
   - View own data

3. **Owner**: Authenticated + resource ownership
   - Edit/delete own spots
   - Edit/delete own goshuin records

4. **Admin** (future): Superuser flag
   - Manage all users
   - System configuration

### 6.4 Password Security

- **Hashing**: bcrypt with configurable work factor
- **Strength Requirements**: Enforced by fastapi-users
- **Reset Flow**: Time-limited tokens sent via email
- **No Plain-Text Storage**: Only hashed passwords stored

### 6.5 CORS Configuration

```python
# fastapi_backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:3000", "https://app.example.com"]
    allow_credentials=True,  # Allow cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 7. File Storage & Image Handling

### 7.1 Storage Architecture

#### Development Environment
- **Storage**: Local filesystem
- **Path**: `fastapi_backend/uploads/`
- **Access**: Direct file serving via FastAPI static files

#### Production Environment
- **Storage**: Vercel Blob Storage
- **CDN**: Automatic via Vercel
- **Access**: Signed URLs with expiration

### 7.2 Storage Service Abstraction

```python
# fastapi_backend/app/services/storage.py
from abc import ABC, abstractmethod

class StorageService(ABC):
    @abstractmethod
    async def upload(self, file: UploadFile, path: str) -> str:
        """Upload file, return public URL"""
        pass

    @abstractmethod
    async def delete(self, url: str) -> None:
        """Delete file by URL"""
        pass

class LocalStorageService(StorageService):
    """Local filesystem storage for development"""
    async def upload(self, file: UploadFile, path: str) -> str:
        # Save to ./uploads/
        return f"http://localhost:8000/uploads/{path}"

    async def delete(self, url: str) -> None:
        # Delete from ./uploads/
        pass

class VercelBlobService(StorageService):
    """Vercel Blob Storage for production"""
    async def upload(self, file: UploadFile, path: str) -> str:
        # Upload to Vercel Blob
        return blob_url

    async def delete(self, url: str) -> None:
        # Delete from Vercel Blob
        pass

# Factory function
def get_storage_service() -> StorageService:
    if settings.ENVIRONMENT == "production":
        return VercelBlobService()
    return LocalStorageService()
```

### 7.3 Image Upload Flow

```
Client: Select images
    ↓
Client: Validate (type, size)
    ↓
POST /api/spots/{spot_id}/images
Content-Type: multipart/form-data
    ↓
Backend: Receive UploadFile
    ↓
Backend: Validate file
    ↓
Backend: Generate unique filename
    ↓
StorageService.upload()
    ↓
Database: Save metadata + URL
    ↓
Response: SpotImageRead
    ↓
Client: Display uploaded image
```

### 7.4 File Validation

```python
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

async def validate_image(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {ALLOWED_IMAGE_TYPES}"
        )

    # Read file to check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE} bytes"
        )

    # Reset file position for further processing
    await file.seek(0)
```

### 7.5 Image Path Structure

```
uploads/
├── spots/
│   └── {user_id}/
│       └── {spot_id}/
│           ├── {uuid}_original.jpg
│           ├── {uuid}_thumb.jpg
│           └── ...
│
└── goshuin/
    └── {user_id}/
        └── {record_id}/
            ├── {uuid}_original.jpg
            ├── {uuid}_thumb.jpg
            └── ...
```

### 7.6 Thumbnail Generation (Future)

```python
from PIL import Image

THUMBNAIL_SIZE = (300, 300)

async def generate_thumbnail(image_path: str) -> str:
    """Generate thumbnail and return thumbnail path"""
    with Image.open(image_path) as img:
        img.thumbnail(THUMBNAIL_SIZE)
        thumb_path = image_path.replace("_original", "_thumb")
        img.save(thumb_path, optimize=True, quality=85)
    return thumb_path
```

---

## 8. Security Architecture

### 8.1 Security Layers

#### Layer 1: Network Security
- **HTTPS Only**: Enforced in production (Vercel default)
- **HSTS**: HTTP Strict Transport Security headers
- **CORS**: Strict origin validation

#### Layer 2: Authentication Security
- **JWT Tokens**: Stateless authentication
- **HTTP-only Cookies**: XSS protection
- **Secure Flag**: Cookie only sent over HTTPS
- **SameSite**: CSRF protection

#### Layer 3: Authorization Security
- **Row-Level Security**: User ID checks in queries
- **Resource Ownership**: Verified before mutations
- **API Rate Limiting**: (future) DDoS protection

#### Layer 4: Input Validation
- **Pydantic**: Backend schema validation
- **Zod**: Frontend schema validation
- **SQLAlchemy ORM**: SQL injection prevention
- **Content-Type Validation**: File upload security

#### Layer 5: Output Sanitization
- **React**: Auto-escaping in JSX
- **CSP Headers**: Content Security Policy
- **X-Frame-Options**: Clickjacking prevention

### 8.2 Vulnerability Mitigations

#### SQL Injection
- **Mitigation**: SQLAlchemy ORM with parameterized queries
- **No raw SQL**: All queries use ORM methods

#### Cross-Site Scripting (XSS)
- **Mitigation**: React auto-escaping, CSP headers
- **No dangerouslySetInnerHTML**: Avoided except for sanitized markdown

#### Cross-Site Request Forgery (CSRF)
- **Mitigation**: SameSite cookies, origin validation
- **Double Submit**: CSRF tokens for state-changing operations (future)

#### Authentication Issues
- **Mitigation**: bcrypt password hashing, JWT expiration
- **Session Management**: Logout invalidates tokens

#### Insecure Direct Object References (IDOR)
- **Mitigation**: User ID checks in all queries
- **Authorization**: Ownership verified before access

#### Sensitive Data Exposure
- **Mitigation**: HTTPS, secure cookies, no logs of sensitive data
- **Password Policy**: Strong passwords enforced

#### File Upload Vulnerabilities
- **Mitigation**: Type validation, size limits, unique filenames
- **Storage Isolation**: User-specific directories

### 8.3 Security Headers

```python
# fastapi_backend/app/main.py
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    return response
```

### 8.4 Environment Variables Security

- **Never commit**: `.env` files in `.gitignore`
- **Secret Management**: Vercel environment variables for production
- **Rotation**: Regular JWT secret rotation recommended
- **Least Privilege**: Database user with minimal permissions

---

## 9. Performance & Scalability

### 9.1 Database Performance

#### Indexing Strategy
```sql
-- User-owned data access
CREATE INDEX ix_spots_user_id ON spots(user_id);
CREATE INDEX ix_goshuin_records_user_id ON goshuin_records(user_id);

-- Filtering
CREATE INDEX ix_spots_prefecture ON spots(prefecture);
CREATE INDEX ix_spots_spot_type ON spots(spot_type);

-- Sorting
CREATE INDEX ix_goshuin_records_visit_date ON goshuin_records(visit_date DESC);

-- Lookups
CREATE INDEX ix_spots_slug ON spots(slug);
CREATE INDEX ix_spot_images_spot_id ON spot_images(spot_id);
CREATE INDEX ix_goshuin_images_record_id ON goshuin_images(record_id);
```

#### Query Optimization
- **Eager Loading**: Use `selectinload()` for relationships
- **Pagination**: LIMIT/OFFSET for large result sets
- **Projection**: Select only needed columns
- **N+1 Prevention**: Batch loading with SQLAlchemy relationship loading strategies

#### Connection Pooling
```python
# Development (with Docker)
engine = create_async_engine(
    DATABASE_URL,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=5,
    max_overflow=10
)

# Production (Vercel Serverless)
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool  # No pooling for serverless
)
```

### 9.2 Frontend Performance

#### Next.js Optimizations
- **Server Components**: Default for reduced client JS
- **Streaming**: Progressive rendering with Suspense
- **Static Generation**: Pre-render when possible
- **Incremental Static Regeneration**: ISR for dynamic content
- **Edge Runtime**: Fast response times (future)

#### Image Optimization
- **Next.js Image**: Automatic format conversion, resizing
- **Lazy Loading**: Intersection Observer API
- **WebP Support**: Modern format with fallback
- **CDN**: Vercel Edge Network

#### Code Splitting
- **Automatic**: Next.js route-based splitting
- **Dynamic Imports**: For heavy components
- **Bundle Analysis**: Regular checks with `@next/bundle-analyzer`

#### Caching Strategy
```typescript
// Next.js 15 fetch with cache
fetch('/api/spots', {
  cache: 'force-cache',  // Static data
  next: { revalidate: 3600 }  // ISR every hour
})

fetch('/api/goshuin', {
  cache: 'no-store'  // Dynamic, user-specific data
})
```

### 9.3 API Performance

#### Response Compression
- **Gzip/Brotli**: Automatic via Vercel
- **Payload Minimization**: Only send necessary fields

#### Rate Limiting (Future)
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/spots")
@limiter.limit("100/hour")  # 100 requests per hour
async def create_spot():
    pass
```

### 9.4 Scalability Considerations

#### Horizontal Scaling
- **Stateless Backend**: JWT-based, no server-side sessions
- **Database**: PostgreSQL with read replicas (future)
- **File Storage**: CDN-backed (Vercel Blob)
- **Serverless**: Auto-scaling with Vercel Functions

#### Vertical Scaling
- **Database**: Upgrade PostgreSQL instance as needed
- **Compute**: Vercel Pro/Enterprise for more resources

#### Caching Layers (Future)
- **Redis**: Session cache, API response cache
- **CDN**: Static assets, image delivery
- **Browser**: Service Worker for offline support

---

## 10. Deployment Architecture

### 10.1 Environment Strategy

#### Development
```
Local Development:
- Docker Compose (backend + db + frontend + mailhog)
- Hot reload enabled
- Local file storage
- MailHog for email testing
```

#### Staging (Future)
```
Staging Environment:
- Vercel preview deployments
- Staging database (Vercel Postgres)
- Vercel Blob for images
- Real SMTP for email testing
```

#### Production
```
Production Environment:
- Vercel production deployment
- Production database (Vercel Postgres or external)
- Vercel Blob for images
- Production SMTP (e.g., SendGrid)
```

### 10.2 Vercel Deployment

#### Project Structure
```
Project Root
├── fastapi_backend/       # Python FastAPI app
│   └── api/
│       └── index.py       # Vercel serverless entry point
│
└── nextjs-frontend/       # Next.js app
    └── vercel.json        # Vercel configuration
```

#### Backend Deployment (Serverless Functions)
```python
# fastapi_backend/api/index.py
from fastapi_backend.app.main import app

# Export for Vercel
handler = app
```

```json
# vercel.json (backend)
{
  "builds": [
    {
      "src": "fastapi_backend/api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "fastapi_backend/api/index.py"
    }
  ]
}
```

#### Frontend Deployment
```json
# nextjs-frontend/vercel.json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

### 10.3 Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
JWT_SECRET=<generated-secret>
CORS_ORIGINS=http://localhost:3000,https://app.example.com
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=<sendgrid-api-key>
MAIL_FROM=noreply@example.com
ENVIRONMENT=production
STORAGE_PROVIDER=vercel_blob
VERCEL_BLOB_READ_WRITE_TOKEN=<token>
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
API_BASE_URL=https://api.example.com
```

### 10.4 Database Migrations

#### Local Development
```bash
# Create migration
alembic revision --autogenerate -m "Add goshuin tables"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

#### Production
```bash
# SSH into production server or use CI/CD
DATABASE_URL=<production-db> alembic upgrade head
```

### 10.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install uv
        run: pip install uv
      - name: Install dependencies
        run: cd fastapi_backend && uv sync
      - name: Run tests
        run: cd fastapi_backend && uv run pytest
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:password@localhost:5432/test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: cd nextjs-frontend && pnpm install
      - name: Run tests
        run: cd nextjs-frontend && pnpm test
      - name: Lint
        run: cd nextjs-frontend && pnpm lint
      - name: Type check
        run: cd nextjs-frontend && pnpm tsc
```

### 10.6 Monitoring & Logging

#### Backend Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
```

#### Frontend Logging
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Sentry, LogRocket)
      console.log(message, meta);
    } else {
      console.log(message, meta);
    }
  },
  error: (message: string, error?: Error) => {
    console.error(message, error);
    // Send to error tracking service
  }
};
```

#### Error Tracking
- **Sentry** (recommended): Automatic error reporting
- **Vercel Analytics**: Performance monitoring
- **Database Monitoring**: Query performance tracking

---

## 11. Development Workflow

### 11.1 Local Development Setup

#### Prerequisites
- Docker & Docker Compose
- Python 3.11+ with uv
- Node.js 20+ with pnpm
- Git

#### Initial Setup
```bash
# Clone repository
git clone https://github.com/yourusername/in-stamp-archive.git
cd in-stamp-archive

# Start services
docker-compose up -d

# Backend setup
cd fastapi_backend
uv sync
uv run alembic upgrade head

# Frontend setup
cd ../nextjs-frontend
pnpm install
pnpm run generate-client  # Generate API client from OpenAPI

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# MailHog: http://localhost:8025
# Database: localhost:5432
```

### 11.2 Development Commands

#### Backend
```bash
# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=app

# Format code
uv run ruff format .

# Lint
uv run ruff check .

# Type check
uv run mypy app

# Generate OpenAPI schema
uv run python -m app.main --generate-openapi --output ./shared-data/openapi.json

# Database migration
uv run alembic revision --autogenerate -m "Description"
uv run alembic upgrade head
```

#### Frontend
```bash
# Development server
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Tests
pnpm test

# Lint
pnpm lint
pnpm lint:fix

# Type check
pnpm tsc

# Format
pnpm prettier

# Generate API client (after backend schema changes)
pnpm run generate-client
```

### 11.3 Git Workflow

#### Branch Strategy
```
main                # Production-ready code
├── develop         # Integration branch
    ├── feature/xxx # Feature branches
    ├── fix/xxx     # Bug fix branches
    └── hotfix/xxx  # Urgent production fixes
```

#### Commit Convention
```
feat: Add goshuin image upload feature
fix: Resolve authentication cookie issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify spot query logic
test: Add tests for export functionality
chore: Update dependencies
```

### 11.4 Code Review Checklist

- [ ] Tests written and passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Documentation updated
- [ ] API client regenerated (if backend changes)
- [ ] Database migrations tested

### 11.5 Testing Strategy

#### Backend Testing
```python
# Unit tests (models, utils)
# tests/test_models.py
def test_spot_creation():
    spot = Spot(name="Test Temple", spot_type=SpotType.TEMPLE)
    assert spot.name == "Test Temple"

# Integration tests (API endpoints)
# tests/api/test_spots.py
@pytest.mark.asyncio
async def test_create_spot(client, authenticated_user):
    response = await client.post("/api/spots", json={
        "name": "金閣寺",
        "spot_type": "temple",
        "prefecture": "京都府",
        "slug": "kinkakuji"
    })
    assert response.status_code == 201

# E2E tests (workflows)
# tests/e2e/test_spot_workflow.py
@pytest.mark.asyncio
async def test_spot_creation_workflow(client):
    # Register user
    # Login
    # Create spot
    # Upload images
    # Verify spot exists
    pass
```

#### Frontend Testing
```typescript
// Unit tests (components)
// components/spot-card.test.tsx
test('renders spot name', () => {
  render(<SpotCard spot={mockSpot} />);
  expect(screen.getByText('金閣寺')).toBeInTheDocument();
});

// Integration tests (pages)
// app/dashboard/spots/page.test.tsx
test('displays spot list', async () => {
  render(<SpotsPage />);
  await waitFor(() => {
    expect(screen.getByText('金閣寺')).toBeInTheDocument();
  });
});

// E2E tests (with Playwright - future)
test('complete spot creation flow', async ({ page }) => {
  await page.goto('/login');
  // ... complete flow
});
```

---

## 12. Future Enhancements

### 12.1 Short-Term (Next 3-6 months)

#### Map Integration
- **Leaflet**: Interactive maps on prefecture pages
- **Clustering**: Marker clustering for dense areas
- **Current Location**: Geolocation API integration
- **Route Planning**: Multi-spot route visualization

#### Enhanced Search
- **Full-Text Search**: PostgreSQL full-text search
- **Faceted Filters**: Multi-select prefecture, category, date range
- **Search Suggestions**: Autocomplete with recent searches
- **Saved Searches**: Persist user search preferences

#### Social Features
- **Public Profiles**: Opt-in shareable goshuin collections
- **Community**: Discover other users' collections
- **Export Sharing**: Share collection as public link
- **Activity Feed**: Recent visits, new spots

#### Mobile Optimization
- **PWA**: Progressive Web App with offline support
- **Camera Integration**: Direct photo capture on mobile
- **Location Services**: Nearby spots based on GPS
- **Touch Gestures**: Swipe navigation, pinch zoom

### 12.2 Medium-Term (6-12 months)

#### Advanced Features
- **OCR**: Extract temple names and dates from goshuin images
- **QR Codes**: Generate QR codes for spot sharing
- **Statistics Dashboard**: Visit trends, prefecture coverage
- **Goals & Badges**: Gamification with achievements
- **Collections**: Organize spots into custom collections
- **Notes & Tags**: Rich text notes, custom tagging system

#### Integration
- **Google Maps**: Alternative to Leaflet
- **Apple Wallet**: Digital goshuin cards
- **Calendar Sync**: Export visits to calendar
- **Social Media**: Share to Twitter, Instagram
- **Cloud Backup**: Automatic backup to Google Drive, Dropbox

#### Performance
- **Redis Cache**: API response caching
- **Database Read Replicas**: Improved read performance
- **CDN**: Global content delivery
- **Image Processing**: Server-side thumbnail generation

### 12.3 Long-Term (12+ months)

#### Mobile App
- **React Native**: Cross-platform mobile app
- **Offline Mode**: Local SQLite database
- **Background Sync**: Upload when connection available
- **Push Notifications**: Visit reminders, nearby spots

#### Advanced Analytics
- **Visit Heatmap**: Visualize visit patterns
- **Travel Stats**: Distance traveled, prefectures visited
- **Recommendations**: AI-powered spot suggestions
- **Trend Analysis**: Popular spots, seasonal patterns

#### Community Features
- **Forums**: User discussions
- **Events**: Organize group visits
- **Ratings & Reviews**: Community spot reviews
- **Trading**: Digital goshuin exchange (with permission)

#### Enterprise Features
- **Multi-Language**: i18n support (English, Chinese, Korean)
- **API Access**: Public API for third-party integrations
- **White-Label**: Custom branding for organizations
- **Admin Dashboard**: User management, content moderation

---

## Appendix A: Glossary

- **Goshuin (御朱印)**: Traditional Japanese temple/shrine seal stamps
- **Spot**: Generic term for temples, shrines, castles, or other visit-worthy locations
- **Prefecture**: Japanese administrative division (similar to US state)
- **JWT**: JSON Web Token for authentication
- **ORM**: Object-Relational Mapping (SQLAlchemy)
- **CRUD**: Create, Read, Update, Delete operations
- **SSR**: Server-Side Rendering (Next.js)
- **CSR**: Client-Side Rendering
- **ISR**: Incremental Static Regeneration

## Appendix B: Technology Decisions

### Why FastAPI?
- Modern async Python framework
- Automatic OpenAPI documentation
- High performance with async/await
- Excellent type safety with Pydantic
- Easy Vercel deployment as serverless functions

### Why Next.js 15?
- React 19 with Server Components
- Excellent developer experience
- Built-in optimization (images, fonts, code splitting)
- Vercel integration for easy deployment
- Strong TypeScript support

### Why PostgreSQL?
- Robust relational database
- Excellent JSON support (JSONB)
- Full-text search capabilities
- Strong data integrity (FK, constraints)
- Mature ecosystem and tooling

### Why JWT over Sessions?
- Stateless authentication (scales horizontally)
- Works well with serverless architecture
- No server-side session storage needed
- Easy mobile app integration (future)

### Why Vercel?
- Excellent Next.js integration
- Serverless backend support (Python FastAPI)
- Global CDN
- Automatic HTTPS
- Simple deployment workflow
- Free tier for development

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-04 | System Design Agent | Initial comprehensive system design |

---

**End of System Design Document**
