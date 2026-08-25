# Performance

Measure before optimizing. Do not load unbounded data, perform CPU-heavy synchronous work in request handlers, or use cache to hide a bad query. Use bounded body/upload/page/batch sizes and apply backpressure under overload.

For database work, select only required fields, prevent N+1, paginate, and inspect plans for slow queries. Cache only with a namespaced/versioned key, TTL, invalidation policy, and acceptable consistency model. Every dependency operation needs an explicit timeout.
