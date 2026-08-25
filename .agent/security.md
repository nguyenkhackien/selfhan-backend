# Security

Validate every path, query, header, body, and claim with the global validation pipe (`whitelist`, `forbidNonWhitelisted`, controlled transformation). Do not trust client-supplied role, user ID, or tenant ID.

Authentication proves identity; authorization checks role/permission plus ownership, tenant, and resource state. Verify token signature, expiry, issuer/audience where used, and token type. Store only hashed refresh/reset tokens and use Argon2id for passwords.

Use parameterized ORM queries, whitelist dynamic sort/filter fields, and map explicit mutable fields rather than assigning a whole DTO. Rate-limit sensitive or expensive endpoints. Never log passwords, headers, cookies, tokens, API keys, connection strings, card data, or private keys.
