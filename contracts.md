# Module Contracts
> DO NOT CHANGE without notifying the team.
> These are the interfaces between modules that parallel workers depend on.

## Standard Error Response
```typescript
interface ApiError {
  error: string;
  code: number;
  details?: any;
}
```

## Auth API
```typescript
// POST /api/auth/register
Request: { email: string; password: string; name: string }
Response: { token: string; user: User }

// POST /api/auth/login
Request: { email: string; password: string }
Response: { token: string; user: User }

// GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user: User }
```

## Health Check
```typescript
// GET /api/health
Response: { status: "ok"; timestamp: string }
```

## Shared Types
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

## Additional Contracts
> Add new contracts here as features are defined.
> Each contract should specify: endpoint, request shape, response shape, error cases.
