# Workflows

Standard request flow: request ID middleware → authentication/authorization guard → validation pipe → thin controller → application use case → repository/database → response DTO. Typed errors are mapped only at the global HTTP filter.

For creates: validate, authenticate, authorize, normalize, enforce a database uniqueness constraint, run required writes atomically, then publish/enqueue side effects after commit. For updates, load the resource, authorize at resource level, whitelist mutable fields, validate invariants, and persist atomically. Explicitly choose hard or soft delete.

Lists use bounded cursor pagination for large/changing data. Sort fields are whitelisted and cursors include a stable tie-breaker. External calls have an idempotency strategy where side effects exist, timeout, correlation ID, safe retry rules, and typed error mapping.
