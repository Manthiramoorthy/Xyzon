# Event Management API Documentation

## Overview

Comprehensive event management system with payment integration, certificate management, and automated email notifications.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Event Management

### Create Event (Admin Only)

```http
POST /events
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "shortDescription": "Join us for the latest tech trends",
  "eventType": "paid", // "paid" or "free"
  "price": 999,
  "currency": "INR",
  "startDate": "2024-12-15T09:00:00Z",
  "endDate": "2024-12-15T17:00:00Z",
  "registrationStartDate": "2024-11-01T00:00:00Z",
  "registrationEndDate": "2024-12-10T23:59:59Z",
  "eventMode": "online", // "online", "offline", "hybrid"
  "eventLink": "https://zoom.us/j/123456789",
  "venue": "Tech Center",
  "address": "123 Tech Street, Silicon Valley",
  "maxParticipants": 100,
  "category": "Technology",
  "tags": ["tech", "conference", "2024"],
  "hasCertificate": true,
  "registrationQuestions": [
    {
      "question": "What is your experience level?",
      "type": "select",
      "options": ["Beginner", "Intermediate", "Expert"],
      "required": true,
      "order": 1
    },
    {
      "question": "Any dietary restrictions?",
      "type": "textarea",
      "required": false,
      "order": 2
    }
  ]
}
```

### Get All Events (Public)

```http
GET /events?page=1&limit=10&status=published&eventType=paid&search=tech
```

### Get Single Event

```http
GET /events/:id
```

### Update Event (Admin Only)

```http
PUT /events/:id
Authorization: Bearer <admin-token>
```

### Delete Event (Admin Only)

```http
DELETE /events/:id
Authorization: Bearer <admin-token>
```

### Upload Event Images (Admin Only)

```http
POST /events/upload/images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form fields:
- banner: Image file (max 5MB)
- images: Multiple image files (max 5 files, 5MB each)
```

## Event Registration

### Register for Event

```http
POST /events/:id/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "answers": [
    {
      "questionId": "question_id_1",
      "question": "What is your experience level?",
      "answer": "Intermediate"
    }
  ]
}
```

### Verify Payment

```http
POST /events/payment/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Get User Registrations

```http
GET /events/user/registrations?page=1&limit=10
Authorization: Bearer <token>
```

## Admin Event Management

### Get Admin Events

```http
GET /events/admin/my-events?page=1&limit=10
Authorization: Bearer <admin-token>
```

### Get Event Registrations

```http
GET /events/:id/registrations?page=1&limit=10
Authorization: Bearer <admin-token>
```

### Mark Attendance/Update Registration Status

```http
PUT /events/registrations/:registrationId/attendance
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "attended", // "registered", "attended", "absent", "cancelled"
  "method": "manual" // "manual", "qr", "auto" (only used when status is "attended")
}
```

**Alternative endpoint for status updates:**

```http
PUT /events/registrations/:registrationId/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "attended", // "registered", "attended", "absent", "cancelled"
  "method": "manual" // "manual", "qr", "auto" (only used when status is "attended")
}
```

**Status Options:**

- `registered`: Default status when someone registers
- `attended`: Participant attended the event (sets check-in details)
- `absent`: Participant did not attend (clears check-in details)
- `cancelled`: Registration cancelled

**Response:**

```json
{
  "success": true,
  "message": "Registration status updated to attended",
  "data": {
    "_id": "registration_id",
    "status": "attended",
    "checkedIn": true,
    "checkInTime": "2024-12-15T10:30:00.000Z",
    "checkInMethod": "manual"
  }
}
```

### Issue Certificate

```http
POST /events/registrations/:registrationId/certificate
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate issued successfully",
  "data": {
    "certificateId": "CERT-1640995200000-XYZ123",
    "recipientName": "John Doe",
    "title": "Certificate of Participation - Tech Conference 2024",
    "verificationCode": "ABC123DEF456",
    "issuedAt": "2024-12-15T10:30:00.000Z"
  }
}
```

### Get Available Certificate Templates (Admin Only)

```http
GET /events/certificate-templates
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "default",
      "name": "Default",
      "filename": "default.html",
      "preview": "<!DOCTYPE html>..."
    },
    {
      "id": "professional",
      "name": "Professional",
      "filename": "professional.html", 
      "preview": "<!DOCTYPE html>..."
    }
  ]
}
```

### Get User Certificates

```http
GET /events/user/certificates
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "certificateId": "CERT-1640995200000-XYZ123",
      "title": "Certificate of Participation - Tech Conference 2024",
      "recipientName": "John Doe",
      "issueDate": "2024-12-15T10:30:00.000Z",
      "event": {
        "title": "Tech Conference 2024",
        "startDate": "2024-12-15T09:00:00.000Z"
      },
      "status": "issued"
    }
  ]
}
```

### View Certificate

```http
GET /events/certificates/:certificateId/view
Authorization: Bearer <user-token>
```

Returns the certificate as HTML for display in browser.

### Download Certificate Data

```http
GET /events/certificates/:certificateId/download
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": "CERT-1640995200000-XYZ123",
    "title": "Certificate of Participation - Tech Conference 2024",
    "recipientName": "John Doe",
    "eventTitle": "Tech Conference 2024",
    "issueDate": "2024-12-15T10:30:00.000Z",
    "verificationCode": "ABC123DEF456",
    "qrCode": "data:image/png;base64,iVBOR...",
    "generatedHtml": "<!DOCTYPE html>..."
  }
}
```

### Issue Bulk Certificates

```http
POST /events/:eventId/certificates/bulk
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "registrationIds": ["reg_id_1", "reg_id_2", "reg_id_3"]
}
```

### Send Event Reminders

```http
POST /events/:id/send-reminders
Authorization: Bearer <admin-token>
```

### Get Event Statistics

```http
GET /events/:id/statistics
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "event": {
      "id": "event_id",
      "title": "Event Title",
      "status": "published",
      "startDate": "2024-12-15T09:00:00Z",
      "maxParticipants": 100
    },
    "stats": {
      "totalRegistrations": 75,
      "attendedParticipants": 60,
      "certificatesIssued": 55,
      "revenue": 74250,
      "attendanceRate": "80.00"
    }
  }
}
```

## Certificate Management

### Get Certificate

```http
GET /certificates/:certificateId
```

### Verify Certificate

```http
GET /certificates/verify/:verificationCode

Response:
{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "certificateId": "CERT-xxx",
    "recipientName": "John Doe",
    "title": "Certificate of Participation",
    "issueDate": "2024-12-16",
    "event": {...},
    "isValid": true
  }
}
```

### Get User Certificates

```http
GET /certificates/user/my-certificates
Authorization: Bearer <token>
```

### Get Event Certificates (Admin)

```http
GET /certificates/event/:eventId/certificates
Authorization: Bearer <admin-token>
```

### Revoke Certificate (Admin)

```http
PUT /certificates/:id/revoke
Authorization: Bearer <admin-token>
```

### Generate Certificate Preview (Admin)

```http
POST /certificates/preview
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "template": "<html>...</html>",
  "sampleData": {
    "recipientName": "John Doe",
    "eventTitle": "Sample Event"
  }
}
```

## Payment Management

### Get Payment Status

```http
GET /api/payments/:id
Authorization: Bearer <token>
```

### Get User Payments

```http
GET /api/payments/user/my-payments?page=1&limit=10
Authorization: Bearer <token>
```

### Get Event Payments (Admin)

```http
GET /api/payments/event/:eventId/payments
Authorization: Bearer <admin-token>
```

### Refund Payment (Admin)

```http
POST /api/payments/:id/refund
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Event cancelled",
  "amount": 999 // optional, defaults to full amount
}
```

## Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "SPECIFIC_ERROR_CODE"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 100,
    "limit": 10,
    "totalPages": 10,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  }
}
```

## Event Status Definitions

- **draft**: Event created but not published
- **published**: Event is live and accepting registrations
- **cancelled**: Event has been cancelled
- **completed**: Event has finished

## Registration Status Definitions

- **registered**: User is registered for the event
- **attended**: User attended the event
- **absent**: User did not attend the event
- **cancelled**: Registration was cancelled

## Payment Status Definitions

- **created**: Payment order created
- **attempted**: Payment attempt in progress
- **paid**: Payment successful
- **failed**: Payment failed
- **cancelled**: Payment cancelled
- **refunded**: Payment refunded

## Email Notifications

The system automatically sends:

1. **Registration Confirmation** - Sent immediately after successful registration
2. **Event Reminders** - Sent 1 day before event (configurable via cron job)
3. **Certificate Email** - Sent when certificate is issued

## File Uploads

Supported image formats: JPG, JPEG, PNG, WEBP
Maximum file size: 5MB per file
Images are automatically optimized to WebP format

## Rate Limiting

API endpoints are rate limited to 300 requests per 15-minute window per IP address.

## Environment Variables Required

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=xyzon
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## Razorpay Integration

The system uses Razorpay for payment processing. Make sure to:

1. Create a Razorpay account
2. Get your test/live API keys
3. Configure webhook endpoints for payment status updates
4. Handle payment failures and retries appropriately

## QR Code Generation

QR codes are automatically generated for:

1. **Event Registration** - Contains registration verification link
2. **Certificate Verification** - Contains certificate verification link

QR codes are stored as data URLs and can be used for quick check-ins and certificate verification.

## Automated Tasks (Cron Jobs)

1. **Daily Reminders** (9:00 AM) - Send event reminders for upcoming events
2. **Event Status Update** (Hourly) - Update event status based on dates
3. **Payment Cleanup** (Daily Midnight) - Mark expired payments as failed

## Error Codes

Common error codes you might encounter:

- `UNAUTHORIZED` - Invalid or missing authentication token
- `FORBIDDEN` - Insufficient permissions
- `EVENT_NOT_FOUND` - Requested event doesn't exist
- `REGISTRATION_CLOSED` - Event registration has ended
- `EVENT_FULL` - Maximum participants reached
- `ALREADY_REGISTERED` - User already registered for this event
- `PAYMENT_FAILED` - Payment processing failed
- `INVALID_SIGNATURE` - Invalid Razorpay payment signature

This completes the comprehensive event management system! The API provides all the functionality you requested including event creation, payment processing, certificate management, email notifications, and administrative tools.
