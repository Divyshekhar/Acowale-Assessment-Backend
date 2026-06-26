# Acowale Feedback Platform Backend

Production-oriented backend for a customer feedback platform. Public users can submit feedback, and admins can authenticate to manage feedback and view analytics.

## Links

- **Frontend Repository:** https://github.com/Divyshekhar/acowale-feedback-frontend
- **Backend Repository:** https://github.com/Divyshekhar/Acowale-Assessment-Backend
- **Live Frontend:** https://your-frontend.vercel.app
- **Live Backend:** https://your-backend.onrender.com


## Tech Stack

- Bun
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod
- JWT in HttpOnly cookies
- Pino logging
- In-memory rate limiting for login and public feedback creation

Helmet is intentionally not used, per project requirements.

## Setup

Install dependencies:

```bash
bun install
```

Create a local env file:

```bash
cp .env.example .env
```

Update `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, and `CLIENT_URL`.

Generate Prisma client:

```bash
bunx prisma generate
```

Apply migrations once PostgreSQL is running:

```bash
bunx prisma migrate dev
```

Run in development:

```bash
bun run dev
```

Run in production mode:

```bash
bun run start
```

Typecheck:

```bash
bun run typecheck
```

Run tests:

```bash
bun run test
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | HTTP port |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `JWT_SECRET` | Yes | Secret with at least 32 characters |
| `JWT_EXPIRES_IN` | Yes | JWT lifetime, such as `1d` |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `CLIENT_URL` | Yes | Allowed CORS origin |
| `COOKIE_SECRET` | No | Cookie parser signing secret |

## Project Structure

```text
src/
  app.ts
  server.ts
  config/
  constants/
  controllers/
  lib/
  middlewares/
  routes/
  services/
  types/
  utils/
  validators/
prisma/
  schema.prisma
  migrations/
docs/
  ARCHITECTURE.md
  API.md
```

## API Summary

Public:

- `GET /health`
- `POST /api/v1/auth/login`
- `POST /api/v1/feedback`

Protected:

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/feedback`
- `GET /api/v1/feedback/:id`
- `PATCH /api/v1/feedback/:id/status`
- `DELETE /api/v1/feedback/:id`
- `GET /api/v1/analytics`

Detailed endpoint documentation is in [docs/API.md](docs/API.md).

## Rate Limiting

The API includes lightweight in-memory rate limiting:

- `POST /api/v1/auth/login`: 5 requests per 15 minutes per client
- `POST /api/v1/feedback`: 10 requests per minute per client

For multi-instance production deployments, replace the in-memory store with Redis or another shared backing store.

## Authentication Notes

Admins authenticate with email and password. Passwords are bcrypt hashes in the database. On login, the API sets a JWT in an HttpOnly cookie:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production only

Refresh tokens, sessions, and Passport are intentionally not used.

## Deployment Notes

- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET` and `COOKIE_SECRET`.
- Set `CLIENT_URL` to the deployed frontend origin.
- Run Prisma migrations before starting the server.
- Ensure the runtime can connect to PostgreSQL through `DATABASE_URL`.
- Pino emits structured JSON logs in production.
