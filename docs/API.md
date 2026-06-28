# Digitalized Plantation API Documentation

Base URL: `http://localhost:4000/api`

All authenticated endpoints require header: `Authorization: Bearer <accessToken>`

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Error response:
```json
{
  "success": false,
  "error": { "message": "Description", "code": "ERROR_CODE" }
}
```

## Authentication

### POST /auth/login
```json
{ "email": "user@example.com", "password": "password", "rememberMe": false }
```

### POST /auth/refresh
```json
{ "refreshToken": "uuid-token" }
```

## Customer Endpoints (Role: CUSTOMER)

All routes prefixed with `/customer`

- `GET /dashboard` — Full dashboard data
- `GET /plantation` — Plantation details
- `GET /equipment` — Equipment list
- `POST /equipment/:id/control` — `{ "state": "ON" | "OFF" }`
- `GET /notifications?page=1&limit=20`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `GET /tickets`
- `POST /tickets` — `{ "subject", "category", "message", "priority?" }`
- `GET /tickets/:id`
- `POST /tickets/:id/messages` — `{ "content" }`

## Admin Endpoints (Role: ADMIN | SUPPORT | SUPER_ADMIN)

All routes prefixed with `/admin`

- `GET /dashboard` — Platform statistics
- `GET /customers?search=&page=1&limit=20&isActive=true`
- `GET /customers/:id`
- `POST /customers` — Create customer (ADMIN+)
- `PATCH /customers/:id` — Update customer (ADMIN+)
- `DELETE /customers/:id` — Delete customer (SUPER_ADMIN)
- `PATCH /customers/:id/manual-control` — `{ "enabled": true | false }`
- `GET /plantations?search=&status=`
- `GET /emergencies?severity=CRITICAL&customerId=`
- `GET /activity-logs?page=1&limit=50&action=LOGIN`
- `GET /tickets?status=OPEN&search=`
- `GET /tickets/:id`
- `PATCH /tickets/:id` — `{ "status", "assignedToId", "priority" }`
- `POST /tickets/:id/messages` — `{ "content" }`

## WebSocket Events (Socket.io)

Connect to `http://localhost:4000`

- Client emits: `join:plantation` (plantationId)
- Client emits: `join:admin`
- Server emits: `notification` (to plantation room)
- Server emits: `emergency` (to admin room)
