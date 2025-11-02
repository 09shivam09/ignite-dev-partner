# EVENT-CONNECT API Documentation

Complete API reference for all backend endpoints with usage examples.

## Base URL

All API endpoints are Supabase Edge Functions:
```
Production: https://nxidkfnbqlhhmbsskykn.supabase.co/functions/v1/
Local: http://localhost:54321/functions/v1/
```

## Authentication

Most endpoints require authentication using Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get your access token after login using Supabase Auth.

## Quick Start

```typescript
import api from '@/lib/api';

// All endpoints are available through the api object
const vendors = await api.vendor.search({ city: 'Mumbai' });
```

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Vendors](#vendor-endpoints)
3. [Leads & Inquiries](#lead-management-endpoints)
4. [Chat & Messaging](#chat-endpoints)
5. [Bookings](#booking-payment-endpoints)
6. [Inspiration Gallery](#inspiration-endpoints)
7. [AI Features](#ai-endpoints)
8. [Reviews](#reviews)
9. [User Profile](#user-management)

---

## Authentication Endpoints

### POST /auth/login
Login with email and password using Supabase Auth.

**JavaScript Example:**
```typescript
const { user, session } = await api.auth.login(
  'user@example.com',
  'password123'
);
```

### POST /auth/register
Register a new user account.

**JavaScript Example:**
```typescript
const { user } = await api.auth.register(
  'user@example.com',
  'password123',
  { full_name: 'John Doe' }
);
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

## Vendor Endpoints

### GET /vendor-search
Search and filter vendors with advanced options.

**Query Parameters:**
- `city` - Filter by city
- `category` - Filter by service category
- `budget` - Maximum budget
- `rating` - Minimum rating (1-5)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `sortBy` - Sort by: rating, distance, price

**JavaScript Example:**
```typescript
const result = await api.vendor.search({
  city: 'Mumbai',
  category: 'Photography',
  rating: 4,
  budget: 50000
});
```

**Response:**
```json
{
  "vendors": [
    {
      "id": "uuid",
      "business_name": "Elite Photography",
      "rating": 4.8,
      "total_reviews": 127,
      "location": { "type": "Point", "coordinates": [lat, lng] },
      "services": [...],
      "distance": 2.5
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### GET /vendor/:id
Get detailed vendor information including services and portfolio.

**JavaScript Example:**
```typescript
const vendor = await api.vendor.getById('vendor-uuid');
```

**Response:**
```json
{
  "id": "uuid",
  "business_name": "Elite Photography",
  "business_description": "Professional photography services...",
  "rating": 4.8,
  "total_reviews": 127,
  "total_bookings": 450,
  "business_hours": {},
  "vendor_services": [...],
  "vendor_portfolio": [...]
}
```

### GET /vendor-portfolio/:vendorId
Get vendor's portfolio images and work samples.

**JavaScript Example:**
```typescript
const portfolio = await api.vendor.getPortfolio('vendor-uuid');
```

**Response:**
```json
{
  "portfolio": [
    {
      "id": "uuid",
      "image_url": "https://...",
      "caption": "Wedding at Grand Hotel - Dec 2024",
      "display_order": 1,
      "created_at": "2024-12-01T..."
    }
  ]
}
```

### GET /vendor/:id/reviews
Get vendor reviews with sentiment analysis.

**JavaScript Example:**
```typescript
const reviews = await api.vendor.getReviews('vendor-uuid');
```

### POST /vendor/create
Create a new vendor profile (requires auth).

**JavaScript Example:**
```typescript
const vendor = await api.vendor.create({
  business_name: 'My Catering Co',
  business_description: 'Premium catering...',
  business_email: 'contact@mycatering.com',
  business_phone: '+1234567890',
  location: { type: 'Point', coordinates: [lat, lng] }
});
```

### POST /vendor-portfolio/:vendorId
Upload portfolio image (requires auth, vendor ownership).

**JavaScript Example:**
```typescript
const portfolio = await api.vendor.uploadPortfolio('vendor-uuid', {
  image_url: 'https://...',
  caption: 'Corporate Event 2024',
  display_order: 1
});
```

### POST /vendor/updatePackages
Update service packages (requires auth, vendor ownership).

**JavaScript Example:**
```typescript
await api.vendor.updatePackages('vendor-uuid', [
  {
    name: 'Basic Package',
    description: 'Perfect for small events',
    base_price: 50000,
    pricing_type: 'fixed'
  }
]);
```

---

## Lead Management Endpoints

### POST /leads-manage/create
Create a new lead/inquiry to vendor (requires auth).

**JavaScript Example:**
```typescript
const lead = await api.lead.create({
  vendor_id: 'vendor-uuid',
  service_id: 'service-uuid',
  event_date: '2025-12-15',
  event_type: 'wedding',
  guest_count: 200,
  message: 'Interested in your premium package'
});
```

**Response:**
```json
{
  "lead": {
    "id": "uuid",
    "status": "pending",
    "booking_reference": "BK-2025-001",
    "created_at": "2025-11-02T..."
  },
  "message": "Lead created successfully"
}
```

### GET /leads-manage/vendor/:vendorId
Get all leads for a vendor (requires auth, vendor ownership).

**JavaScript Example:**
```typescript
const { leads } = await api.lead.getVendorLeads('vendor-uuid');
```

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "consumer": {
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "service": {...},
      "event_date": "2025-12-15",
      "guest_count": 200,
      "status": "pending",
      "created_at": "..."
    }
  ]
}
```

### PATCH /leads-manage/:leadId
Update lead status (requires auth, ownership verification).

**JavaScript Example:**
```typescript
const lead = await api.lead.updateStatus(
  'lead-uuid',
  'accepted',
  'Confirmed with premium package'
);
```

---

## Chat Endpoints

### POST /chat-messages/createRoom
Create or get existing chat room with vendor (requires auth).

**JavaScript Example:**
```typescript
const { conversation_id, receiver_id } = await api.chat.createRoom('vendor-uuid');
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "receiver_id": "uuid"
}
```

### POST /chat-messages/sendMessage
Send a message in a conversation (requires auth).

**JavaScript Example:**
```typescript
const message = await api.chat.sendMessage({
  conversation_id: 'conv-uuid',
  receiver_id: 'user-uuid',
  content: 'Hi, interested in your services for Dec 15th',
  attachments: []
});
```

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "sender_id": "uuid",
    "content": "...",
    "is_read": false,
    "created_at": "2025-11-02T..."
  }
}
```

### GET /chat-messages/:conversationId/messages
Get all messages in a conversation (requires auth).

**JavaScript Example:**
```typescript
const { messages } = await api.chat.getMessages('conversation-uuid');
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender": {
        "full_name": "John Doe",
        "avatar_url": "https://..."
      },
      "receiver": {...},
      "content": "Hi, interested in your services",
      "is_read": true,
      "created_at": "..."
    }
  ]
}
```

---

## Booking & Payment Endpoints

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

## Inspiration Endpoints

### GET /inspiration-gallery
Get inspiration gallery items from vendor portfolios (public).

**Query Parameters:**
- `category` (optional) - Filter by category
- `limit` (optional) - Number of items (default: 20)

**JavaScript Example:**
```typescript
const { inspiration } = await api.inspiration.getGallery('wedding', 20);
```

**Response:**
```json
{
  "inspiration": [
    {
      "id": "uuid",
      "image_url": "https://...",
      "caption": "Elegant Wedding Setup",
      "vendor_name": "Elite Decorators",
      "vendor_id": "uuid",
      "rating": 4.8,
      "service": "Decoration",
      "category": "Wedding",
      "price": 50000
    }
  ]
}
```

### POST /inspiration-gallery
Save items to personal moodboard (requires auth).

**JavaScript Example:**
```typescript
const result = await api.inspiration.saveMoodboard([
  'portfolio-uuid-1',
  'portfolio-uuid-2',
  'portfolio-uuid-3'
]);
```

**Response:**
```json
{
  "message": "Moodboard saved successfully",
  "moodboard": ["uuid1", "uuid2", "uuid3"]
}
```

---

## AI Endpoints

### POST /ai-recommendations
Get AI-powered event planning recommendations (requires auth).

Uses Lovable AI (google/gemini-2.5-flash) for intelligent recommendations.

**JavaScript Example:**
```typescript
const recommendations = await api.ai.planEvent({
  event_type: 'wedding',
  guest_count: 200,
  location: 'Mumbai',
  budget: 500000,
  preferences: 'Traditional theme with modern touches'
});
```

**Response:**
```json
{
  "recommendations": [
    {
      "service_type": "Venue",
      "reason": "Perfect for 200 guests with traditional setup",
      "priority": "high",
      "estimated_budget": 150000,
      "available_services": [
        {
          "id": "uuid",
          "name": "Grand Banquet Hall",
          "base_price": 120000,
          "vendors": {...}
        }
      ]
    },
    {
      "service_type": "Catering",
      "reason": "Traditional menu with modern presentation",
      "priority": "high",
      "estimated_budget": 200000,
      "available_services": [...]
    }
  ],
  "message": "Recommendations generated successfully"
}
```

### POST /ai-style-match
Match event style using AI vision analysis (requires auth).

Uses Lovable AI with vision capabilities for style matching.

**JavaScript Example:**
```typescript
const styleMatch = await api.ai.matchStyle(
  'https://example.com/event-photo.jpg',
  'Looking for similar elegant garden setup',
  { color_scheme: 'pastel', theme: 'garden' }
);
```

**Response:**
```json
{
  "style_matches": {
    "style_type": "Elegant Garden",
    "color_palette": ["#FFE4E1", "#F0E68C", "#98FB98"],
    "theme": "Garden Romance",
    "decor_elements": [
      "Floral Arches",
      "String Lights",
      "Natural Elements",
      "Vintage Furniture"
    ],
    "recommended_vendors": [
      {
        "type": "Decorator",
        "reason": "Specializes in outdoor garden setups with floral elements"
      },
      {
        "type": "Florist",
        "reason": "Expert in pastel arrangements and garden aesthetics"
      }
    ],
    "budget_estimate": "Medium to High (₹150,000 - ₹300,000)",
    "season_suitability": "Spring/Summer (Best in Feb-Apr)"
  },
  "matching_vendors": [
    {
      "id": "uuid",
      "business_name": "Garden Dreams Decor",
      "rating": 4.9,
      "services": [...]
    }
  ],
  "message": "Style analysis complete"
}
```

### POST /ai-support
AI chatbot for event planning assistance (streaming, public).

**JavaScript Example:**
```typescript
// Streaming example
const response = await fetch(
  `${API_BASE}/functions/v1/ai-support`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Help me plan a 200-guest wedding in Mumbai' }
      ]
    })
  }
);

// Handle SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
// ... process stream
```

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