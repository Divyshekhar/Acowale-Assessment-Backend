# Acowale Feedback Platform API

Base API path:

```text
/api/v1
```

All JSON responses use the same envelope.

Success:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Paginated success:

```json
{
  "success": true,
  "message": "Feedback fetched successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Failure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Health

### GET `/health`

Public health check.

Response:

```json
{
  "status": "UP",
  "timestamp": "2026-06-26T00:00:00.000Z"
}
```

## Authentication

JWT authentication is stored in an HttpOnly cookie named `acowale_access_token`.

### POST `/api/v1/auth/login`

Public.

Rate limited to 5 attempts per 15 minutes per client.

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "id": "admin_id",
    "name": "Admin",
    "email": "admin@example.com",
    "createdAt": "2026-06-26T00:00:00.000Z",
    "updatedAt": "2026-06-26T00:00:00.000Z"
  }
}
```

### POST `/api/v1/auth/logout`

Protected. Clears the auth cookie.

### GET `/api/v1/auth/me`

Protected. Returns the current admin.

## Feedback

### POST `/api/v1/feedback`

Public. Creates feedback with status `PENDING`.

Rate limited to 10 submissions per minute per client.

Request:

```json
{
  "category": "BUG",
  "comment": "The export button fails on mobile.",
  "email": "customer@example.com"
}
```

Allowed categories:

```text
PRODUCT
BUG
FEATURE_REQUEST
SUPPORT
OTHER
```

### GET `/api/v1/feedback`

Protected. Returns a paginated feedback list.

Query parameters:

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| page | number | `1` | Positive integer |
| limit | number | `10` | Max `100` |
| search | string | none | Searches comment and email |
| category | enum | none | Feedback category |
| status | enum | none | Feedback status |
| sortBy | enum | `createdAt` | `createdAt`, `updatedAt`, `category`, `status` |
| sortOrder | enum | `desc` | `asc` or `desc` |

### GET `/api/v1/feedback/:id`

Protected. Returns one feedback item.

### PATCH `/api/v1/feedback/:id/status`

Protected. Updates feedback status.

Request:

```json
{
  "status": "IN_REVIEW"
}
```

Allowed transitions:

```text
PENDING -> IN_REVIEW
IN_REVIEW -> RESOLVED
IN_REVIEW -> REJECTED
```

### DELETE `/api/v1/feedback/:id`

Protected. Deletes one feedback item.

## Analytics

### GET `/api/v1/analytics`

Protected. Returns dashboard analytics.

Response data includes:

- Total feedback count
- Category-wise distribution
- Status-wise distribution
- Recent feedback
- Feedback submitted in the last 7 days
- Pending feedback count
- Resolved feedback count
