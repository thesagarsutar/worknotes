# API Documentation

This document provides detailed information about the Worknotes API endpoints, request/response formats, and authentication requirements.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-1)
  - [Notes](#notes)
  - [Tasks](#tasks)
  - [User](#user)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)
- [Changelog](#changelog)

## Authentication

All API requests require authentication using a JWT token in the `Authorization` header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

To get a token:
1. Sign up/in using the authentication endpoints
2. Store the returned token securely
3. Include it in subsequent requests

## Base URL

- Production: `https://your-supabase-url.functions.supabase.co`
- Local Development: `http://localhost:54321/functions/v1`

## Endpoints

### Authentication

#### Sign Up

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Notes

#### List Notes

```http
GET /notes
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**
```json
[
  {
    "id": "note_123",
    "title": "My First Note",
    "content": "This is my first note",
    "created_at": "2025-06-15T12:00:00Z",
    "updated_at": "2025-06-15T12:00:00Z"
  }
]
```

#### Create Note

```http
POST /notes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "New Note",
  "content": "This is a new note"
}
```

**Response**
```json
{
  "id": "note_456",
  "title": "New Note",
  "content": "This is a new note",
  "created_at": "2025-06-15T12:00:00Z",
  "updated_at": "2025-06-15T12:00:00Z"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `auth/invalid-credentials` | 401 | Invalid email or password |
| `auth/unauthorized` | 401 | Missing or invalid authentication token |
| `auth/email-already-exists` | 400 | Email already in use |
| `validation/required-field` | 400 | Required field is missing |
| `not-found` | 404 | Resource not found |
| `rate-limit-exceeded` | 429 | Too many requests |
| `internal-server-error` | 500 | Internal server error |

## Rate Limiting

- 100 requests per minute per IP for unauthenticated endpoints
- 1000 requests per minute per user for authenticated endpoints
- Exceeding limits returns a 429 status code with `retry-after` header

## Webhooks

### Available Webhooks

1. `note.created` - Triggered when a new note is created
2. `note.updated` - Triggered when a note is updated
3. `note.deleted` - Triggered when a note is deleted

### Webhook Payload

```json
{
  "event": "note.created",
  "created_at": "2025-06-15T12:00:00Z",
  "data": {
    "id": "note_123",
    "title": "New Note",
    "content": "This is a new note"
  }
}
```

## Changelog

### 2025-06-15
- Initial API release
- Added authentication endpoints
- Added basic CRUD operations for notes
- Implemented rate limiting
- Added webhook support
