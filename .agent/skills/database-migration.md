# Database Migration

Identify schema change, table size, lock risk, compatibility, backfill, rollback, and deployment order. Review generated SQL, run it against a test database, run integration tests, and verify rollback/recovery.

Treat dangerous changes—column type changes, deletes/renames, new non-null fields, large indexes, enum changes, and large foreign keys—with expand-and-contract and small batches when needed.
