# Complete API Endpoints Reference

## Joint Sense AI - Full API Documentation

### Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints
**Base Path**: `/api/auth`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user profile | Private |
| POST | `/logout` | Logout user | Private |
| PUT | `/password` | Update password | Private |

---

## 👥 User Management
**Base Path**: `/api/users`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all users | Admin |
| GET | `/:id` | Get single user | Private |
| GET | `/patients` | Get doctor's patients | Doctor |
| GET | `/doctors` | Get patient's doctors | Patient |
| POST | `/` | Create user | Admin |
| PUT | `/:id` | Update user | Private |
| DELETE | `/:id` | Delete user | Admin |

---

## 🏥 X-Ray Images
**Base Path**: `/api/xrays`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all X-rays for user | Private |
| GET | `/:id` | Get single X-ray | Private |
| POST | `/` | Upload X-ray image | Private |
| PUT | `/:id` | Update X-ray metadata | Private |
| DELETE | `/:id` | Delete X-ray | Private |

---

## 🤖 AI Predictions
**Base Path**: `/api/predictions`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all predictions for user | Private |
| GET | `/stats/:userId` | Get prediction statistics | Private |
| GET | `/:id` | Get single prediction | Private |
| POST | `/` | Create AI prediction | Doctor/Admin |
| PUT | `/:id` | Review prediction | Doctor/Admin |
| DELETE | `/:id` | Delete prediction | Admin |

---

## 💡 Recommendations
**Base Path**: `/api/recommendations`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all recommendations | Private |
| GET | `/active/:userId` | Get active recommendations | Private |
| GET | `/:id` | Get single recommendation | Private |
| POST | `/` | Create recommendation | Doctor/Admin |
| POST | `/generate` | Generate AI recommendations | Doctor/Admin |
| PUT | `/:id` | Update recommendation | Doctor/Admin |
| DELETE | `/:id` | Delete recommendation | Doctor/Admin |

---

## 🏃 Activity Logs
**Base Path**: `/api/activity`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all activity logs | Private |
| GET | `/stats/:userId` | Get activity statistics | Private |
| GET | `/:id` | Get single activity log | Private |
| POST | `/` | Create activity log | Private |
| PUT | `/:id` | Update activity log | Private |
| DELETE | `/:id` | Delete activity log | Private |

---

## 🍽️ Diet Logs
**Base Path**: `/api/diet`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all diet logs | Private |
| GET | `/stats/:userId` | Get diet statistics | Private |
| GET | `/nutrition/:userId` | Get nutrition summary | Private |
| GET | `/:id` | Get single diet log | Private |
| POST | `/` | Create diet log | Private |
| POST | `/:id/meals` | Add meal to diet log | Private |
| PUT | `/:id` | Update diet log | Private |
| DELETE | `/:id` | Delete diet log | Private |

---

## ⚖️ Weight Logs
**Base Path**: `/api/weight`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all weight logs | Private |
| GET | `/stats/:userId` | Get weight statistics | Private |
| GET | `/latest/:userId` | Get latest weight | Private |
| GET | `/:id` | Get single weight log | Private |
| POST | `/` | Create weight log | Private |
| PUT | `/:id` | Update weight log | Private |
| DELETE | `/:id` | Delete weight log | Private |

---

## 💊 Medication Reminders
**Base Path**: `/api/medications`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all medications | Private |
| GET | `/stats/:userId` | Get medication statistics | Private |
| GET | `/today/:userId` | Get today's medications | Private |
| GET | `/:id` | Get single medication | Private |
| POST | `/` | Create medication reminder | Private |
| POST | `/:id/log` | Log medication taken | Private |
| PUT | `/:id` | Update medication | Private |
| DELETE | `/:id` | Delete medication | Private |

---

## 📊 Progress Reports
**Base Path**: `/api/progress`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reports/:userId` | Get all progress reports | Private |
| GET | `/reports/single/:id` | Get single report | Private |
| GET | `/progression/:userId` | Get disease progression | Private |
| GET | `/analytics/:userId` | Get progression analytics | Private |
| POST | `/reports/generate` | Generate progress report | Doctor/Admin |
| PUT | `/progression/:userId` | Update disease progression | Doctor/Admin |
| DELETE | `/reports/:id` | Delete progress report ⭐ NEW | Admin |
| DELETE | `/progression/:userId` | Delete disease progression ⭐ NEW | Admin |

---

## 👨‍⚕️ Consultations
**Base Path**: `/api/consultations`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all consultations | Private |
| GET | `/upcoming/:userId` | Get upcoming consultations | Private |
| GET | `/:id` | Get single consultation | Private |
| POST | `/` | Schedule consultation | Private |
| PUT | `/:id` | Update consultation | Private |
| PUT | `/:id/cancel` | Cancel consultation | Private |
| PUT | `/:id/complete` | Complete consultation | Doctor |
| DELETE | `/:id` | Delete consultation ⭐ NEW | Admin |

---

## 💬 Messages
**Base Path**: `/api/messages`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/conversations` | Get all conversations | Private |
| GET | `/conversation/:conversationId` | Get conversation messages | Private |
| GET | `/unread-count` | Get unread message count | Private |
| GET | `/search` | Search messages | Private |
| POST | `/` | Send message | Private |
| POST | `/start-conversation` | Start new conversation | Patient |
| PUT | `/:id/read` | Mark message as read | Private |
| DELETE | `/:id` | Delete message | Private |

---

## 💭 Forum
**Base Path**: `/api/forum`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/posts` | Get all forum posts | Private |
| GET | `/posts/:id` | Get single post | Private |
| GET | `/posts/:id/comments` | Get post comments | Private |
| GET | `/categories` | Get forum categories | Private |
| POST | `/posts` | Create forum post | Private |
| POST | `/posts/:id/comments` | Create comment | Private |
| PUT | `/posts/:id` | Update post | Private |
| PUT | `/posts/:id/like` | Like/unlike post | Private |
| PUT | `/comments/:id` | Update comment ⭐ NEW | Private |
| PUT | `/comments/:id/like` | Like/unlike comment ⭐ NEW | Private |
| DELETE | `/posts/:id` | Delete post | Private |
| DELETE | `/comments/:id` | Delete comment ⭐ NEW | Private |

---

## 🔔 Notifications
**Base Path**: `/api/notifications`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/user/:userId` | Get all notifications | Private |
| GET | `/stats/:userId` | Get notification statistics | Private |
| GET | `/:id` | Get single notification | Private |
| POST | `/` | Create notification | Admin |
| POST | `/broadcast` | Broadcast notification | Admin |
| PUT | `/:id/read` | Mark as read | Private |
| PUT | `/read-all/:userId` | Mark all as read | Private |
| DELETE | `/:id` | Delete notification | Private |

---

## 🤝 Doctor-Patient Relations
**Base Path**: `/api/doctor-patient-relations`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/doctor/:doctorId` | Get doctor's patients | Doctor |
| GET | `/patient/:patientId` | Get patient's doctors | Patient |
| GET | `/permissions/:doctorId/:patientId` | Get permissions | Private |
| GET | `/:id` | Get single relationship | Private |
| POST | `/` | Create relationship | Doctor/Admin |
| PUT | `/:id` | Update relationship | Doctor/Admin |
| DELETE | `/:id` | Soft delete relationship | Doctor/Admin |
| DELETE | `/:id/permanent` | Hard delete relationship ⭐ NEW | Admin |

---

## 📈 KL Grades (Reference Data)
**Base Path**: `/api/kl-grades`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all KL grades | Public |
| GET | `/:grade` | Get single KL grade | Public |
| GET | `/:grade/recommendations` | Get KL grade recommendations | Public |
| POST | `/` | Create KL grade | Admin |
| POST | `/initialize` | Initialize default grades | Admin |
| PUT | `/:grade` | Update KL grade | Admin |
| DELETE | `/:grade` | Delete KL grade | Admin |

---

## 📋 Audit Logs
**Base Path**: `/api/audit-logs`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all audit logs | Admin |
| GET | `/:id` | Get single audit log | Admin |
| GET | `/user/:userId` | Get user's audit logs | Private |
| GET | `/stats/summary` | Get audit statistics | Admin |
| GET | `/entity/:entity/:entityId` | Get entity audit logs | Admin |
| GET | `/export` | Export audit logs | Admin |
| POST | `/` | Create audit log | Admin |
| DELETE | `/cleanup` | Delete old logs | Admin |

---

## 📊 Summary

### Total Endpoints: 150+

### By Category:
- Authentication: 5 endpoints
- Users: 7 endpoints
- X-Rays: 5 endpoints
- AI Predictions: 6 endpoints
- Recommendations: 7 endpoints
- Activity: 6 endpoints
- Diet: 8 endpoints
- Weight: 7 endpoints
- Medications: 8 endpoints
- Progress: 8 endpoints (2 new)
- Consultations: 8 endpoints (1 new)
- Messages: 8 endpoints
- Forum: 12 endpoints (3 new)
- Notifications: 8 endpoints
- Doctor-Patient: 8 endpoints (1 new)
- KL Grades: 7 endpoints
- Audit Logs: 8 endpoints

### New Endpoints Added: ⭐ 9
1. DELETE /api/consultations/:id
2. PUT /api/forum/comments/:id
3. DELETE /api/forum/comments/:id
4. PUT /api/forum/comments/:id/like
5. DELETE /api/progress/reports/:id
6. DELETE /api/progress/progression/:userId
7. DELETE /api/doctor-patient-relations/:id/permanent

### Access Levels:
- **Public**: 5 endpoints (KL grades reference)
- **Private**: ~120 endpoints (authenticated users)
- **Doctor**: ~15 endpoints (doctor-specific)
- **Admin**: ~20 endpoints (administrative)

---

## 🔒 Authentication

All private endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Get token from `/api/auth/login` or `/api/auth/register`

---

## 🧪 Testing with Swagger

Access interactive API documentation:
```
http://localhost:5000/api-docs
```

1. Click "Authorize" button
2. Paste your JWT token
3. Test any endpoint with pre-filled examples

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10,
  "data": [ ... ]
}
```

---

**Last Updated**: November 12, 2025  
**Version**: 1.0.0  
**Status**: ✅ All endpoints operational
