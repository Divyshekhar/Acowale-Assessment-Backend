# Acowale Feedback Platform Backend Architecture

## Architecture Style

The backend uses a layered Express architecture with clear ownership boundaries:

- Routes register URL paths, middleware, and controller handlers.
- Controllers translate HTTP requests into service calls and return HTTP responses.
- Services own business rules and all Prisma access.
- Validators define Zod schemas for body, params, and query input.
- Middlewares handle cross-cutting concerns such as authentication, validation, logging, and errors.
- Utilities and libraries hold reusable infrastructure such as JWT, cookies, logger, Prisma client, and response helpers.

This keeps request wiring, business behavior, and persistence concerns independent enough to test and change safely.

## Folder Responsibilities

```text
src/
  app.ts                 Express app composition
  server.ts              Runtime entrypoint
  config/                Environment validation and app configuration
  constants/             Shared constants
  controllers/           HTTP request/response handlers
  lib/                   External clients and infrastructure adapters
  middlewares/           Express middlewares
  routes/                Route registration
  services/              Business logic and Prisma queries
  types/                 Shared TypeScript types and Express augmentation
  utils/                 Reusable helpers
  validators/            Zod schemas
prisma/
  schema.prisma          Database schema
  migrations/            Prisma migrations
docs/
  ARCHITECTURE.md        Architecture and API design
```

## Database Models

### User

Admin users are the only authenticated user type.

| Field | Type | Notes |
| --- | --- | --- |
| id | String | Primary key, generated UUID/cuid |
| name | String | Admin display name |
| email | String | Unique login identifier |
| password | String | bcrypt hash only |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |

Indexes:

- Unique index on `email`.

### Feedback

Public submissions that admins manage.

| Field | Type | Notes |
| --- | --- | --- |
| id | String | Primary key, generated UUID/cuid |
| category | FeedbackCategory | Required |
| status | FeedbackStatus | Defaults to `PENDING` |
| comment | String | Required feedback body |
| email | String? | Optional submitter email |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |

Indexes:

- `category`
- `status`
- `createdAt`
- Composite indexes for common admin filtering and sorting, such as `category, createdAt` and `status, createdAt`.

### FeedbackCategory

```text
PRODUCT
BUG
FEATURE_REQUEST
SUPPORT
OTHER
```

### FeedbackStatus

```text
PENDING
IN_REVIEW
RESOLVED
REJECTED
```

Status defaults to `PENDING`.

Allowed transitions:

```text
PENDING -> IN_REVIEW
IN_REVIEW -> RESOLVED
IN_REVIEW -> REJECTED
```

## API Structure

All API routes are mounted under `/api/v1`.

### Health

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Service health check |

Response:

```json
{
  "status": "UP",
  "timestamp": "2026-06-26T00:00:00.000Z"
}
```

### Auth

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Public | Authenticate admin and set JWT cookie |
| POST | `/api/v1/auth/logout` | Protected | Clear JWT cookie |
| GET | `/api/v1/auth/me` | Protected | Return authenticated admin |

Login request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Feedback

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/feedback` | Public | Submit feedback |
| GET | `/api/v1/feedback` | Protected | List feedback for admin |
| GET | `/api/v1/feedback/:id` | Protected | Get one feedback item |
| PATCH | `/api/v1/feedback/:id/status` | Protected | Update feedback status |
| DELETE | `/api/v1/feedback/:id` | Protected | Delete feedback |

Create feedback request:

```json
{
  "category": "BUG",
  "comment": "The export button fails on mobile.",
  "email": "customer@example.com"
}
```

Admin list query:

| Query | Type | Notes |
| --- | --- | --- |
| page | number | Defaults to `1` |
| limit | number | Defaults to `10`, bounded |
| search | string | Searches `comment` and `email` |
| category | FeedbackCategory | Optional |
| status | FeedbackStatus | Optional |
| sortBy | string | Allowed fields only, such as `createdAt` |
| sortOrder | `asc` or `desc` | Defaults to `desc` |

Update status request:

```json
{
  "status": "IN_REVIEW"
}
```

### Analytics

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/analytics` | Protected | Dashboard metrics |

Data returned:

- Total feedback count
- Category-wise distribution
- Status-wise distribution
- Recent feedback
- Feedback submitted in the last 7 days
- Pending feedback count
- Resolved feedback count

## Authentication Flow

1. Admin sends email and password to `POST /api/v1/auth/login`.
2. Auth service finds the admin by email.
3. Auth service compares password with bcrypt.
4. JWT utility signs an access token containing the admin id.
5. Cookie utility sets the token in an HttpOnly cookie.
6. Protected requests read the cookie through auth middleware.
7. Auth middleware verifies JWT and fetches the admin.
8. Auth middleware attaches a sanitized admin object to `req.user`.
9. Controllers use `req.user` only after protected route middleware.

Cookie settings:

```text
httpOnly: true
sameSite: "none"
secure: true only in production
```

Refresh tokens, Passport, and sessions are intentionally excluded to keep the machine-test authentication scope simple and explicit.

## Middleware Plan

### Request Logger

Uses Pino HTTP middleware.

Logs:

- Request method and URL
- Response status
- Request duration
- Error details when requests fail

Development uses pretty logs. Production emits structured JSON.

### Validation Middleware

Accepts optional Zod schemas for:

- `body`
- `params`
- `query`

Validated values replace the raw request values before reaching controllers.

### Authentication Middleware

Responsibilities:

- Read JWT from the auth cookie.
- Verify signature and expiry.
- Load the admin from the database.
- Reject missing, invalid, expired, or stale-user tokens.
- Attach sanitized admin details to the request.

### Not Found Middleware

Returns a consistent `404` JSON response for unknown routes.

### Global Error Middleware

Normalizes:

- Zod validation errors
- Prisma known request errors
- JWT errors
- Auth errors
- Duplicate records
- Missing resources
- Unknown server failures

Production responses do not expose stack traces.

## Response Format

Success:

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
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

## Validation Plan

Zod schemas will cover:

- Auth login body
- Feedback create body
- Feedback id params
- Feedback list query
- Feedback status update body

Incoming strings for pagination and sorting are parsed and constrained before reaching services.

## Service Plan

### AuthService

- Validate credentials
- Hash passwords when user creation or seed logic is added
- Compare passwords
- Return sanitized admin data

### FeedbackService

- Create public feedback
- List feedback with pagination, search, filters, and sorting
- Fetch one feedback item
- Enforce status transition rules
- Delete feedback

### AnalyticsService

- Count total feedback
- Group by category
- Group by status
- Fetch recent feedback
- Aggregate the last seven days
- Count pending and resolved feedback

## Security Decisions

- Do not use Helmet, per project requirement.
- Use CORS scoped to `CLIENT_URL`.
- Use HttpOnly cookies for JWT storage.
- Use `secure` cookies only in production.
- Hash passwords with bcrypt.
- Validate every input boundary with Zod.
- Never return password hashes.
- Never use raw SQL unless Prisma cannot reasonably express a query.
- Never expose stack traces in production.
