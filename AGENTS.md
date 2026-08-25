# NestJS Backend Agent Instructions

Read `.agent/README.md` and then the relevant files under `.agent/` before modifying this repository. Do not read the whole guide by default: use the routing table below to load the files required by the task.

## Required routing

| When the task involves | Read before changing code |
| --- | --- |
| Any code change | `.agent/README.md`, `.agent/architecture.md`, `.agent/coding-standards.md`, `.agent/testing.md` |
| New module or module boundary | `.agent/skills/create-module.md`, `.agent/architecture.md` |
| HTTP endpoint or API contract | `.agent/skills/create-api-endpoint.md`, `.agent/api-design.md`, `.agent/workflows.md`, `.agent/security.md` |
| Business flow/use case | `.agent/skills/implement-use-case.md`, `.agent/architecture.md`, `.agent/workflows.md` |
| Authentication, permissions, ownership, or tenancy | `.agent/skills/authentication-authorization.md`, `.agent/security.md` |
| Entity, repository, query, transaction, or migration | `.agent/database.md`; also `.agent/skills/database-migration.md` for schema changes |
| External API/client/webhook | `.agent/skills/external-api-integration.md`, `.agent/workflows.md`, `.agent/security.md` |
| Queue, worker, retry, or outbox | `.agent/skills/background-job.md`, `.agent/workflows.md`, `.agent/observability.md` |
| Cache | `.agent/skills/caching.md`, `.agent/performance.md` |
| File upload | `.agent/skills/file-upload.md`, `.agent/security.md` |
| Exception/error response | `.agent/skills/error-handling.md`, `.agent/api-design.md` |
| Test creation or test failure | `.agent/skills/testing.md`, `.agent/testing.md`; also `.agent/skills/debugging.md` when investigating unexpected behavior |
| Refactor | `.agent/skills/refactoring.md`, `.agent/architecture.md`, `.agent/testing.md` |
| Logging, metrics, request correlation, or probes | `.agent/observability.md`, `.agent/performance.md` |
| Pull request, review, or release | `.agent/git-workflow.md`, `.agent/review-checklist.md`, `.agent/templates/pull-request.template.md` |

Use the matching template under `.agent/templates/` when writing a module, endpoint, migration, pull-request, or incident document.

## Mandatory rules

1. Inspect existing patterns before creating code.
2. Keep controllers thin and place business logic in application or domain services.
3. Validate all external input; reject unknown fields.
4. Enforce authentication, authorization, ownership, and tenant isolation when a feature needs them.
5. Never expose TypeORM entities directly from controllers.
6. Use database constraints and transactions for data integrity.
7. Never hold a database transaction while calling an external service.
8. Give external calls an explicit timeout and typed error mapping.
9. Do not log secrets or sensitive data.
10. Do not modify a production-applied migration.
11. Add unit and/or integration coverage for happy paths and important failures.
12. Run format, lint, typecheck, and relevant tests before finishing.

## Before coding

Identify affected modules, request flow, database changes, authorization requirements, side effects, failure modes, and tests required.

## Before finishing

Verify build, lint, typecheck, relevant tests, API compatibility, migration safety, and absence of sensitive values in logs.

See `.agent/README.md` for the full guide.
