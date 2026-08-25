# NestJS Backend Engineering Guide

This directory defines engineering rules for developers and AI agents working in this repository. Start here, then load only the task-specific files in the routing table below. Root `AGENTS.md` contains the same routing rules for agents that automatically load repository instructions.

## Routing

| Task | Required files |
| --- | --- |
| Any change | `architecture.md`, `coding-standards.md`, `testing.md` |
| New module | `architecture.md`, `skills/create-module.md` |
| Endpoint | `api-design.md`, `workflows.md`, `security.md`, `skills/create-api-endpoint.md` |
| Use case | `architecture.md`, `workflows.md`, `skills/implement-use-case.md` |
| Database/schema | `database.md`, plus `skills/database-migration.md` for migrations |
| Auth or authorization | `security.md`, `skills/authentication-authorization.md` |
| External integration | `workflows.md`, `security.md`, `skills/external-api-integration.md` |
| Background processing | `workflows.md`, `observability.md`, `skills/background-job.md` |
| Cache or performance | `performance.md`, `skills/caching.md` when cache is added |
| Upload | `security.md`, `skills/file-upload.md` |
| Error handling | `api-design.md`, `skills/error-handling.md` |
| Tests/debugging/refactor | `testing.md` plus `skills/testing.md`, `skills/debugging.md`, or `skills/refactoring.md` as applicable |
| Review/release | `review-checklist.md`, `git-workflow.md`, `templates/pull-request.template.md` |

Templates in `templates/` are used only when their corresponding document is needed; they are not required reading for ordinary code changes.

Priorities, in order: correctness, security, data integrity, maintainability, observability, performance, and delivery speed.

Before changing code, inspect the relevant module, request flow, entities/constraints, authorization, side effects, and tests. After changing code, run formatting, lint, typecheck, unit tests, and applicable integration tests.

Never add a dependency without need, change a public contract accidentally, bypass validation/authorization, log secrets, or alter a migration that has already run in production.

A change is done only when it compiles, has no lint errors, validates input, returns standardized errors, preserves database integrity, and covers the happy path plus important failures.
