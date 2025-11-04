# In-Stamp Archive API Reference

**Base URL**: `/api` (proxied to FastAPI backend)
**Authentication**: JWT Bearer Token (OAuth2 Password Flow)
**Version**: 0.1.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Spots Management](#spots-management)
4. [Image Management](#image-management)
5. [Legacy Items](#legacy-items)
6. [Common Schemas](#common-schemas)
7. [Error Handling](#error-handling)

---

## Authentication

### POST /auth/jwt/login
Authenticate user and receive JWT access token.

**Request**
```
Content-Type: application/x-www-form-urlencoded

username=user@example.com
password=mypassword
```

**Response** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Error Responses**
- `400 Bad Request` - LOGIN_BAD_CREDENTIALS: Invalid credentials or inactive user
- `400 Bad Request` - LOGIN_USER_NOT_VERIFIED: User email not verified
- `422 Unprocessable Entity` - Validation error

**Usage Example**
```typescript
const response = await fetch('/auth/jwt/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'user@example.com',
    password: 'password123'
  })
});
const { access_token } = await response.json();
```

---

### POST /auth/jwt/logout
Logout current user (requires authentication).

**Headers**
```
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{}
```

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user

---

### POST /auth/register
Register new user account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false
}
```

**Response** `201 Created`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false
}
```

**Error Responses**
- `400 Bad Request` - REGISTER_USER_ALREADY_EXISTS: Email already registered
- `400 Bad Request` - REGISTER_INVALID_PASSWORD: Password validation failed
- `422 Unprocessable Entity` - Validation error

---

### POST /auth/forgot-password
Request password reset token via email.

**Request**
```json
{
  "email": "user@example.com"
}
```

**Response** `202 Accepted`
```json
{}
```

**Error Responses**
- `422 Unprocessable Entity` - Validation error

---

### POST /auth/reset-password
Reset password using token received via email.

**Request**
```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Response** `200 OK`
```json
{}
```

**Error Responses**
- `400 Bad Request` - RESET_PASSWORD_BAD_TOKEN: Invalid or expired token
- `400 Bad Request` - RESET_PASSWORD_INVALID_PASSWORD: Password validation failed
- `422 Unprocessable Entity` - Validation error

---

### POST /auth/request-verify-token
Request email verification token.

**Request**
```json
{
  "email": "user@example.com"
}
```

**Response** `202 Accepted`
```json
{}
```

---

### POST /auth/verify
Verify user email with token.

**Request**
```json
{
  "token": "verification-token-from-email"
}
```

**Response** `200 OK`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": true
}
```

**Error Responses**
- `400 Bad Request` - VERIFY_USER_BAD_TOKEN: Invalid token or user
- `400 Bad Request` - VERIFY_USER_ALREADY_VERIFIED: User already verified

---

## User Management

All user management endpoints require authentication via Bearer token.

### GET /users/me
Get current authenticated user information.

**Headers**
```
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": true
}
```

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user

---

### PATCH /users/me
Update current user information.

**Headers**
```
Authorization: Bearer <access_token>
```

**Request**
```json
{
  "email": "newemail@example.com",
  "password": "newPassword123"
}
```

**Response** `200 OK`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "newemail@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": true
}
```

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user
- `400 Bad Request` - UPDATE_USER_EMAIL_ALREADY_EXISTS: Email already in use
- `400 Bad Request` - UPDATE_USER_INVALID_PASSWORD: Password validation failed

---

### GET /users/{id}
Get user by ID (superuser only).

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `id` (path, required): User UUID

**Response** `200 OK`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": true
}
```

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user
- `403 Forbidden` - Not a superuser
- `404 Not Found` - User does not exist

---

### PATCH /users/{id}
Update user by ID (superuser only).

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `id` (path, required): User UUID

**Request**
```json
{
  "is_active": false,
  "is_verified": true
}
```

**Response** `200 OK`
```json
{
  "id": "922ff9c9-640f-4372-86d3-ce642cba5603",
  "email": "user@example.com",
  "is_active": false,
  "is_superuser": false,
  "is_verified": true
}
```

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user
- `403 Forbidden` - Not a superuser
- `404 Not Found` - User does not exist
- `400 Bad Request` - UPDATE_USER_EMAIL_ALREADY_EXISTS or UPDATE_USER_INVALID_PASSWORD

---

### DELETE /users/{id}
Delete user by ID (superuser only).

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `id` (path, required): User UUID

**Response** `204 No Content`

**Error Responses**
- `401 Unauthorized` - Missing token or inactive user
- `403 Forbidden` - Not a superuser
- `404 Not Found` - User does not exist

---

## Spots Management

Spots represent goshuin collection locations (shrines, temples, etc.).

### GET /api/spots
List spots with pagination and filtering.

**Next.js Route**: `app/api/spots/route.ts:GET`

**Headers**
```
Authorization: Bearer <access_token>
```

**Query Parameters**
- `page` (optional, default: 1): Page number (min: 1)
- `size` (optional, default: 12): Page size (min: 1, max: 100)
- `spotType` (optional): Filter by category (transformed to `category` parameter)

**Response** `200 OK`
```json
{
  "items": [
    {
      "id": "spot-uuid",
      "name": "Meiji Shrine",
      "category": "shrine",
      "prefecture": "Tokyo",
      "address": "1-1 Yoyogi Kamizono-cho, Shibuya City",
      "latitude": 35.6764,
      "longitude": 139.6993,
      "images": [...],
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "size": 12,
  "pages": 4
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to load spots

**Usage Example**
```typescript
// List first page of shrines
const response = await fetch('/api/spots?page=1&size=12&spotType=shrine', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { items, total, pages } = await response.json();
```

---

### POST /api/spots
Create new spot.

**Next.js Route**: `app/api/spots/route.ts:POST`

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**
```json
{
  "name": "Senso-ji Temple",
  "category": "temple",
  "prefecture": "Tokyo",
  "address": "2-3-1 Asakusa, Taito City",
  "latitude": 35.7148,
  "longitude": 139.7967,
  "description": "Ancient Buddhist temple in Asakusa"
}
```

**Response** `201 Created`
```json
{
  "id": "new-spot-uuid",
  "name": "Senso-ji Temple",
  "category": "temple",
  "prefecture": "Tokyo",
  "address": "2-3-1 Asakusa, Taito City",
  "latitude": 35.7148,
  "longitude": 139.7967,
  "description": "Ancient Buddhist temple in Asakusa",
  "user_id": "user-uuid",
  "created_at": "2025-01-15T10:35:00Z"
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to create spot

---

### GET /api/spots/{spotId}
Get spot details by ID.

**Next.js Route**: `app/api/spots/[spotId]/route.ts:GET`

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `spotId` (path, required): Spot UUID

**Response** `200 OK`
```json
{
  "id": "spot-uuid",
  "name": "Meiji Shrine",
  "category": "shrine",
  "prefecture": "Tokyo",
  "address": "1-1 Yoyogi Kamizono-cho, Shibuya City",
  "latitude": 35.6764,
  "longitude": 139.6993,
  "description": "Major Shinto shrine dedicated to Emperor Meiji",
  "images": [
    {
      "id": "image-uuid-1",
      "url": "https://storage.example.com/image1.jpg",
      "order": 0
    }
  ],
  "user_id": "user-uuid",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to load spot

---

### PATCH /api/spots/{spotId}
Update spot details.

**Next.js Route**: `app/api/spots/[spotId]/route.ts:PATCH`

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters**
- `spotId` (path, required): Spot UUID

**Request**
```json
{
  "name": "Meiji Jingu Shrine",
  "description": "Updated description with more details"
}
```

**Response** `200 OK`
```json
{
  "id": "spot-uuid",
  "name": "Meiji Jingu Shrine",
  "category": "shrine",
  "description": "Updated description with more details",
  ...
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to update spot

---

## Image Management

Manage images associated with spots (goshuin photos, location photos, etc.).

### GET /api/spots/{spotId}/images
List images for a spot.

**Next.js Route**: `app/api/spots/[spotId]/images/route.ts:GET`

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `spotId` (path, required): Spot UUID

**Response** `200 OK`
```json
[
  {
    "id": "image-uuid-1",
    "url": "https://storage.example.com/goshuin1.jpg",
    "order": 0,
    "created_at": "2025-01-15T10:40:00Z"
  },
  {
    "id": "image-uuid-2",
    "url": "https://storage.example.com/location.jpg",
    "order": 1,
    "created_at": "2025-01-15T10:41:00Z"
  }
]
```

**Error Responses**
- `500 Internal Server Error` - Unable to load spot images

---

### POST /api/spots/{spotId}/images
Upload new image to spot.

**Next.js Route**: `app/api/spots/[spotId]/images/route.ts:POST`
**Backend Route**: `/api/spots/{spotId}/images/uploads` (note: uses `/uploads` endpoint)

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Parameters**
- `spotId` (path, required): Spot UUID

**Request**
```
FormData with image file
```

**Response** `201 Created`
```json
{
  "id": "new-image-uuid",
  "url": "https://storage.example.com/new-image.jpg",
  "order": 2,
  "created_at": "2025-01-15T10:45:00Z"
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to upload spot image

**Usage Example**
```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch(`/api/spots/${spotId}/images`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

### PATCH /api/spots/{spotId}/images/{imageId}
Update image metadata.

**Next.js Route**: `app/api/spots/[spotId]/images/[imageId]/route.ts:PATCH`

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters**
- `spotId` (path, required): Spot UUID
- `imageId` (path, required): Image UUID

**Request**
```json
{
  "order": 0
}
```

**Response** `200 OK`
```json
{
  "id": "image-uuid",
  "url": "https://storage.example.com/image.jpg",
  "order": 0,
  "created_at": "2025-01-15T10:40:00Z"
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to update image

---

### DELETE /api/spots/{spotId}/images/{imageId}
Delete image from spot.

**Next.js Route**: `app/api/spots/[spotId]/images/[imageId]/route.ts:DELETE`

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `spotId` (path, required): Spot UUID
- `imageId` (path, required): Image UUID

**Response** `204 No Content`

**Error Responses**
- `500 Internal Server Error` - Unable to delete image

---

### POST /api/spots/{spotId}/images/reorder
Reorder images for a spot.

**Next.js Route**: `app/api/spots/[spotId]/images/reorder/route.ts:POST`

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters**
- `spotId` (path, required): Spot UUID

**Request**
```json
{
  "image_ids": [
    "image-uuid-3",
    "image-uuid-1",
    "image-uuid-2"
  ]
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "images": [
    {
      "id": "image-uuid-3",
      "order": 0
    },
    {
      "id": "image-uuid-1",
      "order": 1
    },
    {
      "id": "image-uuid-2",
      "order": 2
    }
  ]
}
```

**Error Responses**
- `500 Internal Server Error` - Unable to reorder images

**Usage Example**
```typescript
// Reorder images by dragging in UI
const newOrder = ['uuid-3', 'uuid-1', 'uuid-2'];
await fetch(`/api/spots/${spotId}/images/reorder`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ image_ids: newOrder })
});
```

---

## Legacy Items

**Note**: These endpoints are from the legacy system and may be deprecated in future versions. Use Spots endpoints for new development.

### GET /items/
List items with pagination.

**Headers**
```
Authorization: Bearer <access_token>
```

**Query Parameters**
- `page` (optional, default: 1): Page number (min: 1)
- `size` (optional, default: 50): Page size (min: 1, max: 100)

**Response** `200 OK`
```json
{
  "items": [
    {
      "id": "item-uuid",
      "name": "Sample Item",
      "description": "Item description",
      "quantity": 5,
      "user_id": "user-uuid"
    }
  ],
  "total": 10,
  "page": 1,
  "size": 50,
  "pages": 1
}
```

---

### POST /items/
Create new item.

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**
```json
{
  "name": "New Item",
  "description": "Item description",
  "quantity": 3
}
```

**Response** `200 OK`
```json
{
  "id": "new-item-uuid",
  "name": "New Item",
  "description": "Item description",
  "quantity": 3,
  "user_id": "user-uuid"
}
```

---

### DELETE /items/{item_id}
Delete item by ID.

**Headers**
```
Authorization: Bearer <access_token>
```

**Parameters**
- `item_id` (path, required): Item UUID

**Response** `200 OK`
```json
{}
```

---

## Common Schemas

### UserRead
```typescript
interface UserRead {
  id: string;              // UUID
  email: string;           // Email format
  is_active: boolean;      // Default: true
  is_superuser: boolean;   // Default: false
  is_verified: boolean;    // Default: false
}
```

### UserCreate
```typescript
interface UserCreate {
  email: string;
  password: string;
  is_active?: boolean | null;      // Default: true
  is_superuser?: boolean | null;   // Default: false
  is_verified?: boolean | null;    // Default: false
}
```

### UserUpdate
```typescript
interface UserUpdate {
  password?: string | null;
  email?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  is_verified?: boolean | null;
}
```

### BearerResponse
```typescript
interface BearerResponse {
  access_token: string;    // JWT token
  token_type: string;      // Always "bearer"
}
```

### ErrorModel
```typescript
interface ErrorModel {
  detail: string | { [key: string]: string };
}
```

### ValidationError
```typescript
interface ValidationError {
  loc: Array<string | number>;  // Error location path
  msg: string;                   // Error message
  type: string;                  // Error type
}
```

### HTTPValidationError
```typescript
interface HTTPValidationError {
  detail?: Array<ValidationError>;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Successful request |
| `201` | Created | Resource created successfully |
| `202` | Accepted | Request accepted (async processing) |
| `204` | No Content | Successful deletion |
| `400` | Bad Request | Business logic error (see detail code) |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `422` | Unprocessable Entity | Request validation failed |
| `500` | Internal Server Error | Server error or backend unavailable |

### Error Response Format

All error responses follow this format:

```json
{
  "detail": "ERROR_CODE"
}
```

or for validation errors:

```json
{
  "detail": {
    "code": "ERROR_CODE",
    "reason": "Human readable explanation"
  }
}
```

### Common Error Codes

**Authentication Errors**
- `LOGIN_BAD_CREDENTIALS` - Invalid username/password or inactive user
- `LOGIN_USER_NOT_VERIFIED` - User email not verified
- `REGISTER_USER_ALREADY_EXISTS` - Email already registered
- `REGISTER_INVALID_PASSWORD` - Password doesn't meet requirements
- `RESET_PASSWORD_BAD_TOKEN` - Invalid or expired reset token
- `RESET_PASSWORD_INVALID_PASSWORD` - Password validation failed
- `VERIFY_USER_BAD_TOKEN` - Invalid verification token
- `VERIFY_USER_ALREADY_VERIFIED` - User already verified

**User Management Errors**
- `UPDATE_USER_EMAIL_ALREADY_EXISTS` - Email already in use by another user
- `UPDATE_USER_INVALID_PASSWORD` - Password doesn't meet requirements

### Error Handling Best Practices

1. **Always check HTTP status code first**
   ```typescript
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.detail);
   }
   ```

2. **Handle specific error codes**
   ```typescript
   try {
     await login(email, password);
   } catch (error) {
     if (error.detail === 'LOGIN_USER_NOT_VERIFIED') {
       // Show verification reminder
     } else if (error.detail === 'LOGIN_BAD_CREDENTIALS') {
       // Show invalid credentials message
     }
   }
   ```

3. **Implement retry logic for 5xx errors**
   ```typescript
   async function fetchWithRetry(url, options, retries = 3) {
     for (let i = 0; i < retries; i++) {
       const response = await fetch(url, options);
       if (response.status < 500) return response;
       await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
     }
   }
   ```

4. **Token refresh handling**
   ```typescript
   if (response.status === 401) {
     // Redirect to login or refresh token
     window.location.href = '/login';
   }
   ```

---

## Authentication Flow

### Complete Login Flow

```typescript
// 1. Login and get token
const loginResponse = await fetch('/auth/jwt/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: email,
    password: password
  })
});

const { access_token } = await loginResponse.json();

// 2. Store token (in memory, sessionStorage, or httpOnly cookie)
sessionStorage.setItem('token', access_token);

// 3. Use token for authenticated requests
const spotsResponse = await fetch('/api/spots', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// 4. Logout when done
await fetch('/auth/jwt/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` }
});

sessionStorage.removeItem('token');
```

### Registration Flow

```typescript
// 1. Register new user
const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});

const user = await registerResponse.json();

// 2. Request verification email
await fetch('/auth/request-verify-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: user.email })
});

// 3. User clicks link in email with token
// 4. Verify user with token
await fetch('/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: tokenFromEmail })
});

// 5. Now user can login
```

### Password Reset Flow

```typescript
// 1. User requests password reset
await fetch('/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// 2. User receives email with reset token
// 3. User submits new password with token
await fetch('/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: resetTokenFromEmail,
    password: 'newSecurePassword123'
  })
});

// 4. User can now login with new password
```

---

## Rate Limiting

**Note**: Rate limiting is not documented in the OpenAPI spec. Contact backend team for current rate limits.

Recommended client-side practices:
- Implement exponential backoff for failed requests
- Cache GET responses where appropriate
- Batch operations when possible
- Use pagination efficiently

---

## API Versioning

Current version: **0.1.0**

The API does not currently use version prefixes in URLs. Future versions may introduce `/v2/` prefixing for breaking changes.

---

## Support & Resources

- **Backend Repository**: FastAPI implementation
- **Frontend Integration**: See `src/lib/api/client.ts` for typed client
- **Generated Types**: `src/lib/api/generated/types.gen.ts`
- **OpenAPI Spec**: `openapi.json`

---

*Last Updated: 2025-01-15*
*Generated from OpenAPI 3.1.0 specification*
