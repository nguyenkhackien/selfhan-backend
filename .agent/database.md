# Database

The database is the final integrity boundary. Use UUID identifiers where appropriate, UTC timezone-aware timestamps, and constraints (`NOT NULL`, `UNIQUE`, foreign key, check, and composite/partial unique indexes) for important invariants.

Add indexes from real access patterns; avoid N+1 queries and unnecessary columns. Tenant-scoped repository calls require tenant scope. Use a transaction for atomic multi-write work and short read-modify-write sequences. Use optimistic locking or atomic conditional updates for contested resources.

Production migrations are immutable. Use new deterministic migrations, review generated SQL, test against a test database, and design large changes with expand-and-contract. TypeORM `synchronize` remains disabled.
