# API Design

The API base path is `/api/v1`. Use plural resource nouns and standard HTTP semantics: 200/201/202/204 for success; 400, 401, 403, 404, 409, 422, 429, and safe 5xx responses for failures.

Controllers return response DTOs, never TypeORM entities. Errors use:

```json
{"error":{"code":"MACHINE_CODE","message":"Safe message","details":null,"requestId":"req_123"}}
```

Do not expose stack traces, SQL/ORM errors, internal hosts, secrets, or raw sensitive upstream responses. Version only breaking contracts. Important retriable side effects use an `Idempotency-Key`, stored with actor, request fingerprint, response, and expiry.
