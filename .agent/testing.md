# Testing

Use the lowest test level that proves behavior. Unit tests cover domain and application rules; integration tests cover TypeORM mappings, constraints, transactions, filters, pagination, and soft-delete behavior.

Test happy paths plus validation, unauthenticated/forbidden access where applicable, not-found, conflict, and meaningful dependency failures. Mock boundaries such as repository ports, external clients, queue, clock, and ID generator—not pure functions or simple domain entities.

Tests are isolated, use minimal factories, do not use production data, and clean database state or roll it back. Coverage is a signal; prioritize permissions, state transitions, idempotency, transformations, and important edge cases.
