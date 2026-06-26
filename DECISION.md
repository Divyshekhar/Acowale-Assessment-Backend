# Acowale Feedback Platform Decisions

# Engineering Decision Log

## 1. Why did you choose this technology stack?

I chose a TypeScript-first stack to maximize developer productivity while maintaining strong type safety across both the frontend and backend.

For the frontend, I used Next.js with the App Router, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, Axios, and Recharts. This combination provides a modern developer experience, reusable UI components, efficient server-state management, robust form validation, and clean data visualization.

For the backend, I chose Bun as the runtime with Express.js, Prisma ORM, PostgreSQL, JWT authentication, and Pino logging. Express provides flexibility for REST APIs without unnecessary abstraction, while Prisma offers type-safe database access and migrations. PostgreSQL is well suited for relational data, filtering, and aggregation.

Overall, I selected technologies that balance productivity, maintainability, and production readiness rather than introducing unnecessary complexity.

---

## 2. Why did you choose PostgreSQL?

The application stores structured data with clear relationships and requires filtering, searching, sorting, pagination, and analytics.

PostgreSQL is well suited for these requirements because it provides:

* Strong relational consistency (ACID transactions)
* Efficient indexing
* Powerful aggregation queries
* Excellent support for filtering and sorting
* Mature tooling and reliability

Since the dashboard performs category-wise and status-wise aggregations, a relational database was a natural choice.

---

## 3. Why did you structure your application this way?

I followed a layered architecture to separate responsibilities.

* Routes register endpoints.
* Controllers handle HTTP requests and responses.
* Services contain business logic.
* Prisma manages database interactions.

This separation makes the code easier to understand, test, and extend.

On the frontend, I also separated concerns by organizing reusable components, API services, custom hooks, and feature-specific modules independently. TanStack Query manages server state while local component state is kept minimal.

---

## 4. What trade-offs did you make due to time constraints?

Since this assignment was designed to be completed within a limited timeframe, I prioritized delivering a polished MVP with production-oriented practices.

To keep the scope focused, I intentionally did not implement:

* Refresh token authentication
* Role-based authorization
* CI/CD pipelines
* Real-time updates

These are valuable improvements but were outside the scope of the assignment.

---

## 5. What would you improve if you had one more week?

With additional time, I would implement:

* GitHub Actions CI/CD
* OpenAPI / Swagger documentation
* Monitoring and centralized logging
* Audit logs for admin actions
* Email notifications for feedback status updates
* Advanced analytics with custom date ranges
* Performance benchmarking and load testing

---

## 6. What was the most difficult technical challenge you faced?

The most challenging aspect was designing the admin dashboard so that filtering, searching, sorting, pagination, and analytics all relied on backend APIs instead of frontend-only state.

I wanted the backend to remain the single source of truth, which required careful coordination between API design, query parameters, database queries, and frontend cache management.

---

## 7. Which AI tools did you use?

I primarily used ChatGPT as an engineering assistant.

It was helpful for discussing architecture, validating implementation approaches, reviewing code quality, brainstorming UI ideas, and improving documentation.

All generated suggestions were reviewed, modified, tested, and integrated manually.

---

## 8. Share one instance where AI helped you.

AI was particularly useful during the planning phase.

It helped break the application into reusable layers, including services, controllers, reusable frontend hooks, and shared UI components. This made the codebase more organized and easier to maintain.

---

## 9. Share one instance where you disagreed with AI and why.

AI occasionally suggested introducing additional abstractions such as refresh tokens, multiple user roles, or more complex architectural patterns.

I chose not to implement these because they added complexity without providing meaningful value for the scope of this assignment. Instead, I focused on delivering a clean, maintainable solution that fully addressed the stated requirements.

---

## 10. What would break first if this application suddenly had 100,000 users?

The primary bottleneck would likely be the database.

Large-scale filtering, searching, and analytics queries would require additional optimizations such as:

* Better indexing
* Query optimization
* Caching
* Read replicas
* Background aggregation jobs

The current implementation is appropriate for the expected scale of this assignment but would need infrastructure improvements for significantly higher traffic.

---

## 11. What is one thing in this assignment that you would improve, change, or challenge?

I appreciated that the assignment evaluated engineering decisions instead of focusing solely on algorithmic problems.

One improvement I would suggest is providing example API response contracts or sample JSON payloads. This would reduce ambiguity while still allowing candidates complete freedom in choosing their architecture, technology stack, and implementation approach.
