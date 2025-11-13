# 📋 Swagger API Testing Checklist

Use this checklist to systematically test all API endpoints through Swagger UI.

## ✅ Setup (Do First)

- [ ] Server is running on port 5000
- [ ] Navigate to http://localhost:5000/api-docs
- [ ] Swagger UI loads successfully
- [ ] All endpoint categories are visible

---

## 🔐 Authentication Tests

### User Registration
- [ ] POST /api/auth/register - Valid patient user
- [ ] POST /api/auth/register - Valid doctor user
- [ ] POST /api/auth/register - Duplicate email (should fail)
- [ ] POST /api/auth/register - Invalid email format (should fail)
- [ ] POST /api/auth/register - Weak password (should fail)

### User Login
- [ ] POST /api/auth/login - Valid credentials
- [ ] POST /api/auth/login - Invalid email (should fail)
- [ ] POST /api/auth/login - Wrong password (should fail)
- [ ] Copy JWT token from successful login
- [ ] Click "Authorize" button and paste token

### Profile Management
- [ ] GET /api/auth/me - Get current user profile
- [ ] PUT /api/auth/password - Update password with valid data
- [ ] PUT /api/auth/password - Wrong current password (should fail)

### Logout
- [ ] POST /api/auth/logout - Logout successfully

---

## 👥 User Management Tests

### List Users
- [ ] GET /api/users - Get all users (default pagination)
- [ ] GET /api/users?page=2&limit=5 - Test pagination
- [ ] GET /api/users?role=patient - Filter by role
- [ ] GET /api/users?search=john - Search by name

### User Details
- [ ] GET /api/users/{id} - Get specific user by ID
- [ ] GET /api/users/invalid-id - Invalid ID (should fail)
- [ ] GET /api/users/nonexistent-id - Not found (should fail)

### User CRUD (Admin only)
- [ ] POST /api/users - Create new user (if admin)
- [ ] PUT /api/users/{id} - Update user
- [ ] DELETE /api/users/{id} - Delete user

---

## 🔬 X-Ray Image Tests

### Upload & Retrieve
- [ ] POST /api/xrays - Upload X-ray image
- [ ] GET /api/xrays - Get all X-rays
- [ ] GET /api/xrays?patientId={id} - Filter by patient
- [ ] GET /api/xrays/{id} - Get specific X-ray

### Management
- [ ] PUT /api/xrays/{id} - Update X-ray metadata
- [ ] DELETE /api/xrays/{id} - Delete X-ray

---

## 🤖 AI Prediction Tests

### Create Predictions
- [ ] POST /api/predictions - Create prediction for X-ray
- [ ] Verify prediction includes KL grade (0-4)
- [ ] Verify confidence score is present

### Retrieve Predictions
- [ ] GET /api/predictions/user/{userId} - Get user predictions
- [ ] GET /api/predictions?klGrade=2 - Filter by KL grade
- [ ] GET /api/predictions/{id} - Get specific prediction

### Review Predictions
- [ ] PUT /api/predictions/{id} - Update/review prediction

---

## 🏃 Activity Tracking Tests

### Log Activities
- [ ] POST /api/activity - Log walking activity
- [ ] POST /api/activity - Log swimming activity
- [ ] POST /api/activity - Log yoga session

### Retrieve Activities
- [ ] GET /api/activity - Get all activities
- [ ] GET /api/activity?userId={id} - Filter by user
- [ ] GET /api/activity?startDate=2024-01-01 - Date range filter
- [ ] GET /api/activity/{id} - Get specific activity

### Update/Delete
- [ ] PUT /api/activity/{id} - Update activity
- [ ] DELETE /api/activity/{id} - Delete activity

---

## 🥗 Diet Tracking Tests

### Log Meals
- [ ] POST /api/diet - Log breakfast
- [ ] POST /api/diet - Log lunch
- [ ] POST /api/diet - Log dinner
- [ ] POST /api/diet - Log snack

### Retrieve Diet Logs
- [ ] GET /api/diet - Get all diet logs
- [ ] GET /api/diet?userId={id} - Filter by user
- [ ] GET /api/diet?date=2024-01-15 - Filter by date
- [ ] GET /api/diet?mealType=breakfast - Filter by meal type

### Analysis
- [ ] GET /api/diet/stats - Get nutrition statistics
- [ ] PUT /api/diet/{id} - Update diet entry
- [ ] DELETE /api/diet/{id} - Delete diet entry

---

## ⚖️ Weight Tracking Tests

### Log Weight
- [ ] POST /api/weight - Log weight entry
- [ ] Verify BMI is calculated automatically

### Retrieve Weight Logs
- [ ] GET /api/weight - Get all weight logs
- [ ] GET /api/weight?userId={id} - Filter by user
- [ ] GET /api/weight/{id} - Get specific entry

### Trends
- [ ] GET /api/weight/trends - Get weight trends
- [ ] PUT /api/weight/{id} - Update weight entry
- [ ] DELETE /api/weight/{id} - Delete weight entry

---

## 💊 Medication Tests

### Create Reminders
- [ ] POST /api/medications - Create medication reminder
- [ ] Verify reminder times are set

### Retrieve Medications
- [ ] GET /api/medications - Get all medications
- [ ] GET /api/medications?patientId={id} - Filter by patient
- [ ] GET /api/medications?isActive=true - Filter active only

### Manage Medications
- [ ] PUT /api/medications/{id} - Update medication
- [ ] POST /api/medications/{id}/take - Mark as taken
- [ ] DELETE /api/medications/{id} - Delete medication

---

## 👨‍⚕️ Consultation Tests

### Schedule Consultations
- [ ] POST /api/consultations - Schedule in-person consultation
- [ ] POST /api/consultations - Schedule video consultation
- [ ] POST /api/consultations - Schedule phone consultation

### Retrieve Consultations
- [ ] GET /api/consultations - Get all consultations
- [ ] GET /api/consultations?patientId={id} - Filter by patient
- [ ] GET /api/consultations?doctorId={id} - Filter by doctor
- [ ] GET /api/consultations?status=scheduled - Filter by status

### Manage Consultations
- [ ] PUT /api/consultations/{id} - Update consultation
- [ ] PUT /api/consultations/{id}/cancel - Cancel consultation
- [ ] POST /api/consultations/{id}/notes - Add notes

---

## 💬 Forum Tests

### Create Posts
- [ ] POST /api/forum - Create forum post
- [ ] Verify post appears in list

### Browse Posts
- [ ] GET /api/forum - Get all posts
- [ ] GET /api/forum?category={category} - Filter by category
- [ ] GET /api/forum?search={keyword} - Search posts
- [ ] GET /api/forum/{id} - Get specific post

### Interact with Posts
- [ ] POST /api/forum/{id}/comments - Add comment
- [ ] PUT /api/forum/{id}/like - Like post
- [ ] PUT /api/forum/{id}/like - Unlike post
- [ ] PUT /api/forum/{id} - Edit post
- [ ] DELETE /api/forum/{id} - Delete post

---

## 🔔 Notification Tests

### Retrieve Notifications
- [ ] GET /api/notifications - Get all notifications
- [ ] GET /api/notifications?isRead=false - Get unread only
- [ ] GET /api/notifications/{id} - Get specific notification

### Manage Notifications
- [ ] PUT /api/notifications/{id}/read - Mark as read
- [ ] PUT /api/notifications/read-all - Mark all as read
- [ ] DELETE /api/notifications/{id} - Delete notification

---

## 📊 Progress & Analytics Tests

### Progress Reports
- [ ] GET /api/progress - Get progress overview
- [ ] GET /api/progress?patientId={id} - Get patient progress
- [ ] GET /api/progress?startDate={date}&endDate={date} - Date range

### Statistics
- [ ] GET /api/progress/stats - Get statistics
- [ ] GET /api/progress/trends - Get trends

---

## 💡 Recommendation Tests

### Get Recommendations
- [ ] GET /api/recommendations - Get all recommendations
- [ ] GET /api/recommendations?patientId={id} - For specific patient
- [ ] POST /api/recommendations - Generate new recommendations

---

## 🤝 Doctor-Patient Relation Tests

### Create Relationships
- [ ] POST /api/doctor-patient-relations - Link doctor to patient
- [ ] Verify relationship is created

### Retrieve Relationships
- [ ] GET /api/doctor-patient-relations - Get all relationships
- [ ] GET /api/doctor-patient-relations?doctorId={id} - Doctor's patients
- [ ] GET /api/doctor-patient-relations?patientId={id} - Patient's doctors

### Manage Relationships
- [ ] DELETE /api/doctor-patient-relations/{id} - Remove relationship

---

## 📋 KL Grade Tests

### Retrieve Information
- [ ] GET /api/kl-grades - Get all KL grade info
- [ ] GET /api/kl-grades/{grade} - Get specific grade details

---

## 💌 Messaging Tests

### Send Messages
- [ ] POST /api/messages - Send message to another user
- [ ] Verify message is sent

### Retrieve Messages
- [ ] GET /api/messages - Get all messages
- [ ] GET /api/messages?conversationWith={userId} - Get conversation
- [ ] GET /api/messages/{id} - Get specific message

### Manage Messages
- [ ] PUT /api/messages/{id}/read - Mark as read
- [ ] DELETE /api/messages/{id} - Delete message

---

## 🔍 Audit Log Tests (Admin Only)

### View Audit Logs
- [ ] GET /api/audit-logs - Get all audit logs
- [ ] GET /api/audit-logs?userId={id} - Filter by user
- [ ] GET /api/audit-logs?action={action} - Filter by action
- [ ] GET /api/audit-logs?startDate={date} - Date range filter

---

## 🧪 Error Handling Tests

### Test Error Responses
- [ ] Invalid JWT token - Should return 401
- [ ] Expired JWT token - Should return 401
- [ ] Missing required fields - Should return 400
- [ ] Invalid ID format - Should return 400
- [ ] Non-existent resource - Should return 404
- [ ] Unauthorized access - Should return 403

### Test Rate Limiting
- [ ] Make 100+ requests quickly - Should get rate limited

---

## 📊 Test Results Summary

### Total Endpoints Tested: ___/100+
### Passed: ___
### Failed: ___
### Skipped: ___

### Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

### Notes:
_________________________________________
_________________________________________
_________________________________________

---

## 💡 Tips for Testing

1. ✅ Test happy path first (valid data)
2. ✅ Test error cases (invalid data)
3. ✅ Test edge cases (empty strings, nulls, etc.)
4. ✅ Test pagination on list endpoints
5. ✅ Test filtering and search
6. ✅ Test with different user roles
7. ✅ Check response times
8. ✅ Verify response data structure
9. ✅ Check HTTP status codes
10. ✅ Validate error messages

## 🎯 Success Criteria

- [ ] All critical endpoints return 200/201 for valid requests
- [ ] Authentication works correctly
- [ ] Authorization is properly enforced
- [ ] Error responses are meaningful
- [ ] Response times are acceptable (< 1s for most)
- [ ] Pagination works correctly
- [ ] Filtering and search work as expected
- [ ] No server crashes or 500 errors for valid requests

---

**Tester Name**: _________________________
**Test Date**: _________________________
**Environment**: Development / Staging / Production
**Server URL**: http://localhost:5000

---

✨ **Happy Testing!** ✨
