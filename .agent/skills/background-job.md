# Background Job

Every job has a type, payload version, unique ID, idempotency key, retry count, timestamp, and correlation ID. Validate payload, bound timeout/retry, distinguish retryable errors, log structured context, and send exhausted work to a dead-letter path. Do not hold a database connection while awaiting an external dependency.
