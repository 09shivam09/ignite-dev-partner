# EVENT-CONNECT API Documentation

## Base URL

All API endpoints are Supabase Edge Functions:
```
https://nxidkfnbqlhhmbsskykn.supabase.co/functions/v1/
```

## Authentication

Most endpoints require authentication using Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## User Management

### Get/Update User Profile

**Endpoint:** `POST /user-profile`

**Request:**
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "bio": "Event enthusiast",
  "city": "Mumbai",
  "preferences": {
    "event_types": ["wedding", "corporate"]
  }
}
```

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "city": "Mumbai",
    "preferences": {}
  }
}
```

---

## Services & Vendors

### Search Vendors

**Endpoint:** `POST /vendor-search`

**Request:**
```json
{
  "query": "catering",
  "category": "uuid",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "radius": 10,
  "minRating": 4.0,
  "maxPrice": 5000,
  "sortBy": "rating",
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "vendors": [...],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

### Get Services

**Endpoint:** `GET /services-api?category=uuid&page=1`

**Response:**
```json
{
  "services": [...],
  "total": 150,
  "page": 1,
  "total_pages": 8
}
```

### Get Service Details

**Endpoint:** `GET /services-api/:service_id`

**Response:**
```json
{
  "service": {
    "id": "uuid",
    "name": "Premium Catering",
    "description": "...",
    "base_price": 15000,
    "vendors": {...},
    "reviews": [...]
  }
}
```

---

## Bookings

### Create Booking

**Endpoint:** `POST /booking-create`

**Request:**
```json
{
  "vendor_id": "uuid",
  "service_id": "uuid",
  "event_date": "2025-12-25",
  "event_time": "18:00",
  "event_type": "wedding",
  "guest_count": 200,
  "event_address": "123 Main St",
  "special_requirements": "Vegetarian menu",
  "quantity": 1,
  "coupon_code": "SAVE20"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "booking_reference": "EVT-12345",
    "status": "pending",
    "total_amount": 12000
  }
}
```

### Get Booking History

**Endpoint:** `GET /booking-history?status=pending&page=1`

**Response:**
```json
{
  "bookings": [...],
  "total": 25,
  "page": 1,
  "total_pages": 2
}
```

### Manage Booking

**Endpoint:** `POST /booking-manage`

**Request:**
```json
{
  "booking_id": "uuid",
  "action": "confirm",
  "status": "confirmed"
}
```

**Actions:** `confirm`, `cancel`, `update_status`, `reschedule`

---

## Payments

### Process Payment

**Endpoint:** `POST /payment-process`

**Request:**
```json
{
  "booking_id": "uuid",
  "payment_method": "card",
  "payment_provider": "stripe",
  "amount": 12000
}
```

---

## Reviews

### Add Review

**Endpoint:** `POST /review-add`

**Request:**
```json
{
  "booking_id": "uuid",
  "vendor_id": "uuid",
  "rating": 5,
  "comment": "Excellent service!",
  "images": ["url1", "url2"]
}
```

### Get Review Insights (AI)

**Endpoint:** `POST /review-insights`

**Request:**
```json
{
  "vendor_id": "uuid"
}
```

**Response:**
```json
{
  "insights": {
    "summary": "95% of customers loved the service...",
    "sentiment": "positive",
    "strengths": ["Professional", "Timely"],
    "areas_for_improvement": ["Response time"],
    "rating_breakdown": { "5": 80, "4": 15, "3": 3, "2": 1, "1": 1 },
    "percentage_satisfied": 95
  }
}
```

---

## Smart Features (AI)

### Get AI Recommendations

**Endpoint:** `POST /ai-recommendations`

**Request:**
```json
{
  "event_type": "wedding",
  "guest_count": 200,
  "location": "Mumbai",
  "budget": 50000
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "service_type": "Catering",
      "reason": "Essential for 200 guests",
      "priority": "high",
      "estimated_budget": 20000,
      "available_services": [...]
    }
  ]
}
```

### AI Chatbot

**Endpoint:** `POST /ai-support` (Streaming)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Help me plan a wedding" }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

---

## Notifications

### Send Email

**Endpoint:** `POST /send-booking-confirmation`

**Request:**
```json
{
  "booking_id": "uuid",
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "vendor_name": "Elite Catering",
  "service_name": "Premium Package",
  "event_date": "2025-12-25",
  "event_time": "18:00",
  "total_amount": 15000,
  "booking_reference": "EVT-12345"
}
```

### Send WhatsApp

**Endpoint:** `POST /whatsapp-notify`

**Request:**
```json
{
  "to_number": "+919876543210",
  "message_type": "booking_confirmation",
  "booking_id": "uuid"
}
```

**Message Types:** `booking_confirmation`, `booking_reminder`, `booking_update`

### Google Calendar Sync

**Endpoint:** `POST /google-calendar-sync`

**Request:**
```json
{
  "booking_id": "uuid",
  "action": "create"
}
```

**Response:**
```json
{
  "calendar_event": {...},
  "icalLink": "data:text/calendar;..."
}
```

---

## Offers

### List Active Offers

**Endpoint:** `GET /offers-list?category=uuid&page=1`

**Response:**
```json
{
  "offers": [...],
  "total": 15,
  "page": 1,
  "total_pages": 2
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## Rate Limits

- **AI Endpoints:** Subject to Lovable AI rate limits
- **Standard Endpoints:** No hard limits, but use responsibly
- **429 Response:** Wait before retrying

---

## Testing

Use cURL or Postman to test endpoints:

```bash
curl -X POST https://nxidkfnbqlhhmbsskykn.supabase.co/functions/v1/vendor-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "catering", "page": 1}'
```

---

For more details, see [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)