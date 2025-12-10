# API Documentation

This document provides detailed API documentation for the Sleep Tracker & Wellness Diary application.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Your configured domain

## Authentication

All API routes (except `/auth/register` and `/auth/login`) require authentication via JWT Bearer token.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Minimum 8 characters |
| `name` | string | Yes | User's display name |

**Request Example:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid input (validation error) |
| 409 | Email already registered |

---

#### Login User

```http
POST /auth/login
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email address |
| `password` | string | Yes | User's password |

**Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid input (validation error) |
| 401 | Invalid credentials |

---

#### Get Current User

```http
GET /auth/me
```

**Headers:** Requires Authorization header

**Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Sleep Logs

#### List Sleep Logs

```http
GET /api/sleep-logs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Filter logs from this date (YYYY-MM-DD) |
| `endDate` | string | Filter logs until this date (YYYY-MM-DD) |
| `limit` | number | Maximum number of logs to return (default: 30) |

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "date": "2024-01-15",
      "bedtime": "2024-01-14T23:30:00Z",
      "wakeTime": "2024-01-15T07:30:00Z",
      "durationMinutes": 480,
      "quality": 4,
      "interruptions": 1,
      "notes": "Woke up once around 3 AM",
      "createdAt": "2024-01-15T07:45:00Z",
      "updatedAt": "2024-01-15T07:45:00Z"
    }
  ]
}
```

---

#### Create Sleep Log

```http
POST /api/sleep-logs
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Date of wake-up (YYYY-MM-DD) |
| `bedtime` | string | Yes | ISO datetime when went to bed |
| `wakeTime` | string | Yes | ISO datetime when woke up |
| `quality` | number | Yes | Sleep quality 1-5 (1=poor, 5=excellent) |
| `interruptions` | number | No | Number of times woken up (default: 0) |
| `notes` | string | No | Additional notes |

**Request Example:**

```json
{
  "date": "2024-01-15",
  "bedtime": "2024-01-14T23:30:00Z",
  "wakeTime": "2024-01-15T07:30:00Z",
  "quality": 4,
  "interruptions": 1,
  "notes": "Had coffee late, took longer to fall asleep"
}
```

**Response (201 Created):**

```json
{
  "log": {
    "id": 1,
    "userId": 1,
    "date": "2024-01-15",
    "bedtime": "2024-01-14T23:30:00Z",
    "wakeTime": "2024-01-15T07:30:00Z",
    "durationMinutes": 480,
    "quality": 4,
    "interruptions": 1,
    "notes": "Had coffee late, took longer to fall asleep",
    "createdAt": "2024-01-15T07:45:00Z",
    "updatedAt": "2024-01-15T07:45:00Z"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid input (validation error) |
| 409 | Log already exists for this date |

---

#### Update Sleep Log

```http
PUT /api/sleep-logs/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| `id` | Sleep log ID |

**Request Body:** Partial sleep log object (only fields to update)

**Response (200 OK):**

```json
{
  "log": { /* Updated sleep log object */ }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid input |
| 404 | Log not found or not owned by user |

---

#### Delete Sleep Log

```http
DELETE /api/sleep-logs/:id
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### Diary Entries

#### List Diary Entries

```http
GET /api/diary-entries
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Filter entries from this date (YYYY-MM-DD) |
| `endDate` | string | Filter entries until this date (YYYY-MM-DD) |
| `limit` | number | Maximum number of entries to return (default: 30) |

**Response (200 OK):**

```json
{
  "entries": [
    {
      "id": 1,
      "userId": 1,
      "date": "2024-01-15",
      "mood": 4,
      "energy": 3,
      "activities": ["exercise", "reading", "meditation"],
      "dietNotes": "Healthy meals, avoided sugar",
      "journalText": "Had a productive day...",
      "createdAt": "2024-01-15T20:00:00Z",
      "updatedAt": "2024-01-15T20:00:00Z"
    }
  ]
}
```

---

#### Create Diary Entry

```http
POST /api/diary-entries
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Entry date (YYYY-MM-DD) |
| `mood` | number | Yes | Mood score 1-5 (1=low, 5=excellent) |
| `energy` | number | Yes | Energy level 1-5 |
| `activities` | string[] | No | Array of activity tags |
| `dietNotes` | string | No | Notes about food/drink |
| `journalText` | string | No | Free-form journal entry |

**Request Example:**

```json
{
  "date": "2024-01-15",
  "mood": 4,
  "energy": 3,
  "activities": ["exercise", "work", "social"],
  "dietNotes": "Skipped breakfast, had a big lunch",
  "journalText": "Felt anxious in the morning but exercise helped..."
}
```

**Response (201 Created):**

```json
{
  "entry": { /* Created diary entry object */ }
}
```

---

#### Update Diary Entry

```http
PUT /api/diary-entries/:id
```

**Response (200 OK):**

```json
{
  "entry": { /* Updated diary entry object */ }
}
```

---

#### Delete Diary Entry

```http
DELETE /api/diary-entries/:id
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### AI Insights

#### Get Insights

```http
GET /api/insights
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `sleep_debt`, `consistency`, `correlation` |

**Response (200 OK):**

```json
{
  "insights": [
    {
      "id": 1,
      "userId": 1,
      "type": "sleep_debt",
      "title": "Sleep Debt Accumulating",
      "content": "You've accumulated 4.5 hours of sleep debt over the past week. Consider going to bed 30 minutes earlier this week to recover.",
      "generatedAt": "2024-01-15T06:00:00Z",
      "expiresAt": "2024-01-16T06:00:00Z"
    },
    {
      "id": 2,
      "userId": 1,
      "type": "consistency",
      "title": "Bedtime Consistency: Good",
      "content": "Your bedtime variance is 45 minutes, which is good. Maintaining consistent sleep times helps regulate your circadian rhythm.",
      "generatedAt": "2024-01-15T06:00:00Z",
      "expiresAt": "2024-01-16T06:00:00Z"
    },
    {
      "id": 3,
      "userId": 1,
      "type": "correlation",
      "title": "Exercise Improves Sleep",
      "content": "On days when you exercise, you sleep an average of 23% longer and rate your sleep quality 0.8 points higher.",
      "generatedAt": "2024-01-15T06:00:00Z",
      "expiresAt": "2024-01-16T06:00:00Z"
    }
  ],
  "generatedAt": "2024-01-15T06:00:00Z",
  "nextUpdate": "2024-01-16T06:00:00Z"
}
```

---

#### Generate Insights (Manual)

```http
POST /api/insights/generate
```

**Note:** Rate limited to 1 request per hour per user.

**Response (200 OK):**

```json
{
  "success": true,
  "insightCount": 3
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 429 | Rate limit exceeded (wait before retrying) |
| 400 | Insufficient data (need minimum 7 days of logs) |

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request body validation failed |
| `AUTHENTICATION_ERROR` | Missing or invalid JWT token |
| `AUTHORIZATION_ERROR` | User not authorized for this resource |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per 15-minute window
- **Insight Generation**: 1 request per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

---

## Data Types

### Quality/Mood/Energy Scale

| Value | Meaning |
|-------|---------|
| 1 | Very Poor |
| 2 | Poor |
| 3 | Average |
| 4 | Good |
| 5 | Excellent |

### InsightType

| Value | Description |
|-------|-------------|
| `sleep_debt` | Cumulative sleep deficit calculation |
| `consistency` | Bedtime/wake time variance analysis |
| `correlation` | Activity-sleep pattern correlations |

### Date Formats

- **Date**: `YYYY-MM-DD` (e.g., `2024-01-15`)
- **DateTime**: ISO 8601 (e.g., `2024-01-15T07:30:00Z`)
