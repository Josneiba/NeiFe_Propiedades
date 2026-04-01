# NeiFe API Reference

## Base URL

`http://localhost:3000/api`

## Authentication Routes

### Register User

**POST** `/auth/registro`

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "demo1234",
  "rut": "12.345.678-9",
  "phone": "+56 9 1234 5678",
  "role": "LANDLORD" | "TENANT",
  "privacyAccepted": true
}
```

Response: `{ user: { id, email, name, role } }`

### Login (via NextAuth)

```javascript
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
  email: "owner@neife.cl",
  password: "demo1234",
  redirect: false,
});
```

---

## Properties API

### List Properties

**GET** `/properties`
Response: `{ properties: Property[] }`

### Create Property

**POST** `/properties`

```json
{
  "name": "Depto Providencia",
  "address": "Av. Providencia 1234",
  "commune": "Providencia",
  "bedrooms": 2,
  "monthlyRentCLP": 450000
}
```

### Get Property Detail

**GET** `/properties/[id]`

### Update Property

**PUT** `/properties/[id]`
Same body as create

### Delete Property (soft delete)

**DELETE** `/properties/[id]`

---

## Payments API

### List Payments

**GET** `/payments?propertyId=X&status=PENDING&month=3&year=2025`
Response: `{ payments: Payment[] }`

### Create Payment

**POST** `/payments`

```json
{
  "propertyId": "id",
  "month": 3,
  "year": 2025,
  "amountUF": 12.5,
  "amountCLP": 450000
}
```

### Update Payment Status

**PATCH** `/payments/[id]`

```json
{
  "status": "PAID" | "PENDING" | "OVERDUE" | "CANCELLED",
  "method": "transfer",
  "receipt": "https://..."
}
```

Triggers: Notification to tenant, Activity log created

---

## Monthly Services API

### List Services

**GET** `/services?propertyId=X&year=2025`
Response: `{ services: MonthlyService[] }`

### Create/Update Services

**POST** `/services`

```json
{
  "propertyId": "id",
  "month": 3,
  "year": 2025,
  "water": 13500,
  "electricity": 22000,
  "gas": 0
}
```

### Upload Bill Document

**POST** `/services/upload`
FormData:

- `file` - PDF or image
- `propertyId` - string
- `month` - number
- `year` - number
- `type` - "water" | "electricity" | "gas"

Response: `{ url: "https://cloudinary...", service: MonthlyService }`

---

## Maintenance API

### List Maintenance Requests

**GET** `/maintenance?propertyId=X&status=APPROVED&category=PLUMBING`
Response: `{ maintenance: MaintenanceRequest[] }`

### Create Maintenance Request (Tenant)

**POST** `/maintenance`

```json
{
  "propertyId": "id",
  "category": "PLUMBING" | "ELECTRICAL" | "STRUCTURAL" | ...,
  "description": "Fuga de agua en la cocina",
  "photos": ["url1", "url2"]
}
```

Auto-sets: `isLandlordResp`, `legalReference`
Creates: Timeline entry, Notification to landlord

### Update Maintenance Status (Landlord)

**PATCH** `/maintenance/[id]`

```json
{
  "status": "REVIEWING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED",
  "note": "Se asignó plomero",
  "providerId": "provider_id",  // Optional
  "rejectionReason": "Not covered by landlord"  // For REJECTED
}
```

Creates: Timeline entry, Notification to tenant

---

## Providers API

### List Providers

**GET** `/providers`
Response: `{ providers: Provider[] }`

### Create Provider

**POST** `/providers`

```json
{
  "name": "Juan Herrera",
  "specialty": "PLUMBER" | "ELECTRICIAN" | ...,
  "phone": "+56 9 5555 1234",
  "email": "juan@example.com",
  "description": "15+ years experience"
}
```

### Delete Provider

**DELETE** `/providers/[id]`

---

## Notifications API

### List Notifications

**GET** `/notifications?unreadOnly=true`
Response: `{ notifications: Notification[], unreadCount: number }`

### Mark as Read

**PATCH** `/notifications`

```json
{
  "ids": ["id1", "id2"],
  // OR
  "all": true
}
```

### Real-time Stream (SSE)

**GET** `/notifications/stream`
Sends unread notifications every 8 seconds as Server-Sent Events

```javascript
// Client-side
const eventSource = new EventSource("/api/notifications/stream");
eventSource.onmessage = (event) => {
  const notifications = JSON.parse(event.data);
  console.log(notifications);
};
```

---

## Invitations API

### Create Invitation

**POST** `/invitations`

```json
{
  "type": "EMAIL" | "LINK",
  "email": "arrendatario@example.com",  // Required for EMAIL
  "propertyId": "id"
}
```

Response: `{ invitation, inviteUrl: "..." }`

### Verify Invitation

**GET** `/invitations/[token]`
Response: `{ invitation, property, sender }`

### Accept Invitation

**POST** `/invitations/[token]`
Updates: `Invitation.status = ACCEPTED`, `Property.tenantId = session.user.id`
Creates: Notification to landlord, Activity log

---

## File Upload API

### Upload File

**POST** `/upload`
FormData:

- `file` - image or PDF (max 10MB)
- `folder` - "properties" | "maintenance" | "contracts" | "avatars"

Response: `{ url: "https://cloudinary..." }`

---

## Dashboard Stats API

### Get Stats

**GET** `/dashboard/stats`
Response:

```json
{
  "stats": {
    "totalRecaudadoCLP": 2450000,
    "totalRecaudadoUF": 45.5,
    "pagosPendientesCLP": 380000,
    "mantencionesActivas": 2,
    "propiedadesActivas": 4
  }
}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "error": "Error message" | "Error details array from Zod validation"
}
```

HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

## Authentication Headers

All routes except `/auth/registro` and `/auth/[...nextauth]` require:

- Valid NextAuth session (automatic with SessionProvider)
- Middleware redirects to /login if no session

No need to manually add Authorization headers - NextAuth handles it.

---

## Rate Limiting

No rate limiting implemented. Add later if needed:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
```

---

## CORS

Currently allows same-origin requests only. For external consumption:

```typescript
// Add to API routes if needed
headers: {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
}
```
