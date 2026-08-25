# Observability

Emit structured logs containing useful context such as request ID, trace ID, actor/tenant/resource IDs, and duration when available. Log an unexpected error once at the system boundary; expected business errors usually do not need error-level logging.

Propagate correlation IDs to external requests, jobs, and events. Monitor request count/error rate/latency, active requests, database pool/query duration, queue state when present, and upstream latency/error rate. Keep liveness and readiness probes distinct.
