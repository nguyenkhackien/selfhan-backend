# Implement Use Case

Use-case input is not an HTTP DTO and use cases do not depend on request/response objects. Inject repository ports and infrastructure abstractions. Put transaction boundaries around only atomic database work; publish external side effects after commit using an appropriate reliability pattern.

Return an explicit output type, throw typed business errors, and add tests for allowed and rejected state transitions.
