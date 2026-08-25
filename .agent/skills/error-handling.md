# Error Handling

Use typed errors: validation, authentication, authorization, not found, conflict, business rule, dependency, infrastructure, and unexpected. Domain/application code throws typed errors; a global filter maps them to safe HTTP responses. Never throw strings, expose raw infrastructure errors, or log one error repeatedly without new context.
