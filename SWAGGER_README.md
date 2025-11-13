# Swagger API Documentation

## Overview
Complete API documentation for Joint Sense AI - Knee Osteoarthritis Prediction and Management System.

## Access Documentation

After starting the server, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

## Features

✅ **Interactive API Testing** - Test all endpoints directly from the browser
✅ **Authentication Support** - JWT Bearer token authentication
✅ **Request/Response Examples** - See example payloads for all endpoints
✅ **Schema Definitions** - Complete data models documentation
✅ **Filter & Search** - Search and filter capabilities for list endpoints

## Authentication

Most endpoints require authentication. To use protected endpoints:

1. **Register or Login** via `/api/auth/register` or `/api/auth/login`
2. Copy the JWT token from the response
3. Click the **"Authorize"** button at the top right of the Swagger UI
4. Enter your token in the format: `Bearer <your-token>`
5. Click **"Authorize"** to apply

## API Categories

### 🔐 Authentication
- Register new user
- Login
- Get current user profile
- Update password
- Logout

### 👥 Users
- Get all users (Admin)
- Get user by ID
- Update user profile
- Delete user

### 🔬 X-Ray Images
- Upload X-ray images
- Get X-ray images by patient
- Get single X-ray details
- Delete X-ray image

### 🤖 AI Predictions
- Get predictions by user
- Create new prediction
- Get prediction details
- Update prediction review

### 💊 Medications
- Get medication reminders
- Create medication reminder
- Update medication
- Mark medication as taken

### 🏃 Activity Logs
- Log physical activities
- Get activity history
- Get activity statistics

### 🥗 Diet Logs
- Log meals and nutrition
- Get diet history
- Calculate nutrition totals

### ⚖️ Weight Logs
- Log weight measurements
- Get weight history
- Calculate BMI trends

### 👨‍⚕️ Consultations
- Schedule consultations
- Get consultation history
- Update consultation status
- Add consultation notes

### 💬 Forum
- Create forum posts
- Get forum posts
- Add comments
- Like/Unlike posts

### 🔔 Notifications
- Get user notifications
- Mark as read
- Delete notifications

### 📊 Progress Reports
- Get patient progress
- Generate reports
- View trends and analytics

### 🤝 Doctor-Patient Relations
- Link doctor to patient
- Get patient list (doctors)
- Get assigned doctors (patients)

### 📋 KL Grades
- Get KL grade information
- Classification details

### 🔍 Audit Logs
- View system audit logs (Admin)
- Track user actions

### 💌 Messages
- Send messages
- Get conversations
- Mark messages as read

### 💡 Recommendations
- Get personalized recommendations
- AI-powered health suggestions

## Testing Workflow

### 1. User Registration & Login
```
POST /api/auth/register
POST /api/auth/login
```

### 2. Upload X-Ray
```
POST /api/xrays
```

### 3. Get AI Prediction
```
POST /api/predictions
GET /api/predictions/user/{userId}
```

### 4. Log Health Data
```
POST /api/activity
POST /api/diet
POST /api/weight
```

### 5. View Progress
```
GET /api/progress?patientId={id}
GET /api/recommendations?patientId={id}
```

## Response Format

All responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Pagination

List endpoints support pagination:

```
GET /api/endpoint?page=1&limit=10
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Filtering & Search

Many endpoints support filtering:

```
GET /api/users?role=patient&search=john
GET /api/predictions?klGrade=2&oaStatus=mild
GET /api/consultations?status=scheduled
```

## Rate Limiting

API requests are rate-limited:
- 100 requests per 15 minutes per IP
- Additional limits may apply to specific endpoints

## Development

To modify or extend the API documentation:

1. Edit `swagger.js` for configuration
2. Add JSDoc comments in route files
3. Update schemas in `swagger.js` or `routes/swagger-annotations.js`
4. Restart the server to see changes

## Support

For API support or questions:
- Email: support@jointsenseai.com
- GitHub: [Joint Sense AI Repository]

## License

MIT License - See LICENSE file for details
