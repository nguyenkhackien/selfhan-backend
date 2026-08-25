# Review Checklist

- Correctness: edge cases, concurrency, timestamps, async work, and valid state transitions.
- API: HTTP semantics, validated input, safe response DTOs/errors, bounded pagination, compatible contracts.
- Security: authentication/authorization, ownership/tenant isolation, no mass assignment, no secret logging.
- Database: constraints/indexes, no N+1, correct transaction scope, safe immutable migrations.
- Reliability: external timeout/retry/idempotency, graceful shutdown, and safe side effects.
- Tests: happy path and important invalid/forbidden/not-found/conflict/dependency cases.
- Observability: useful context, safe logs, and metrics/probes where relevant.
