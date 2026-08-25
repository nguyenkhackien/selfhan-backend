# Authentication and Authorization

Determine credential, verify it, load the principal, check account state, and create minimal authenticated context. Do not put a full database user in a token or trust client-supplied identity fields.

Authorize in order: global permission, resource load, tenant, ownership/relationship, resource state, then action. Apply the same checks to background processing initiated on behalf of a user.
