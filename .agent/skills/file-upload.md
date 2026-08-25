# File Upload

Bound file count and size, validate MIME type and content, sanitize display names, generate storage keys, prevent traversal, and never use a client filename as storage path. Prefer upload intent plus expiring signed URL; verify metadata and scan content when required. Clean orphaned files if database persistence fails.
