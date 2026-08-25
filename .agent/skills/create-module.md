# Create Module

1. Find a similar module and define one domain boundary.
2. Define the smallest public API and required use cases.
3. Create presentation, application, domain, and infrastructure directories as needed.
4. Define repository ports in application/domain and implement adapters in infrastructure.
5. Register only required providers/exports and avoid circular dependencies.
6. Add unit coverage for the primary use case and integration coverage for persistence behavior.

Controllers must not contain business logic or direct database access.
