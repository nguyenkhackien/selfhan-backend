# External API Integration

Define an adapter port such as `PaymentGateway.charge(input)`. Its implementation must handle credentials, timeout, safe retry, idempotency, correlation ID, response validation, redacted logging, metrics, and typed upstream errors. Never trust an upstream response without validating its shape.
