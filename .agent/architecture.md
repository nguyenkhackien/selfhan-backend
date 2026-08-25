# Architecture

Organize business modules by domain:

```text
src/modules/<module>/
├── presentation/       # controllers and HTTP DTOs
├── application/        # use cases, commands, queries, ports
├── domain/             # entities, value objects, domain services/errors
└── infrastructure/     # TypeORM entities/repositories and integrations
```

Controllers parse validated HTTP input, obtain the authenticated principal, call a use case, and map response DTOs. They do not contain business logic, query the database, start transactions, or call external services.

Application services coordinate the flow, resource authorization, transaction boundary, and post-commit side effects. Domain code does not depend on NestJS or TypeORM. Infrastructure implements ports and must not leak TypeORM query builders into application code.

Modules communicate through an exported use case/port or events. Avoid circular dependencies and do not use `forwardRef()` as a default solution. Do not hold transactions while calling external services or waiting for jobs.
