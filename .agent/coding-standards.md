# Coding Standards

TypeScript is strict. Avoid `any`, non-null assertions, and casts that bypass validation. Public methods have explicit return types. Use PascalCase for classes, camelCase for values, UPPER_SNAKE_CASE for constants, and kebab-case filenames.

Functions do one thing, use guard clauses, avoid input mutation, and use a parameter object for several related primitives. Inject dependencies; do not instantiate infrastructure dependencies with `new` inside business services.

Read configuration through the config module, never scattered `process.env`. Await work that must finish, never use `forEach(async ...)`, and bound concurrency for large batches. Comments explain why—not what the code plainly does.
