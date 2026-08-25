# Caching

Add cache only after defining slow operation, key, TTL, invalidation trigger, acceptable staleness, miss behavior, and stampede strategy. Use cache-aside with a namespaced/versioned key; include tenant/user scope in the key where applicable. Do not cache sensitive data without a security review.
