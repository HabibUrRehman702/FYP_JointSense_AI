# Complete API Testing Guide - Step by Step

## 🚀 Server Status: ✅ Running on http://localhost:5000

## 📋 Table of Contents
1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [X-Ray Images](#3-x-ray-images)
4. [AI Predictions](#4-ai-predictions)
5. [Recommendations](#5-recommendations)
6. [Activity Logs](#6-activity-logs)
7. [Diet Logs](#7-diet-logs)
8. [Weight Logs](#8-weight-logs)
9. [Medication Reminders](#9-medication-reminders)
10. [Consultations](#10-consultations)
11. [Messages](#11-messages)
12. [Forum](#12-forum)
13. [Notifications](#13-notifications)
14. [Progress Reports](#14-progress-reports)
15. [Doctor-Patient Relations](#15-doctor-patient-relations)

---

## 🎯 Before You Start

1. **Open Swagger UI**: http://localhost:5000/api-docs
2. **Keep this guide open** alongside Swagger
3. **Copy-paste the JSON data** from this guide
4. **Test in sequence** - some APIs depend on data from previous ones

---

# 1. Authentication

## 1.1 Register Patient User

**Endpoint**: `POST /api/auth/register`

**Input Data**:
```json
{
  "email": "patient1@test.com",
  "password": "Patient123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1985-05-15",
  "gender": "male",
  "role": "patient"
}
```

**Expected Response**: 
- Status: 201
- Returns: `token` and `user` object
- **⚠️ SAVE THE TOKEN - You'll need it!**

---

## 1.2 Register Doctor User

**Endpoint**: `POST /api/auth/register`

**Input Data**:
```json
{
  "email": "doctor1@test.com",
  "password": "Doctor123!",
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "phone": "+1987654321",
  "dateOfBirth": "1980-03-20",
  "gender": "female",
  "role": "doctor"
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THIS TOKEN TOO - For doctor operations**

---

## 1.3 Login

**Endpoint**: `POST /api/auth/login`

**Input Data**:
```json
{
  "email": "patient1@test.com",
  "password": "Patient123!"
}
```

**Expected Response**:
- Status: 200
- Returns fresh token

---

## 1.4 Get Current User Profile

**Endpoint**: `GET /api/auth/me`

**Requirements**: Must be authorized first!

**Steps**:
1. Click "Authorize" button (🔓 top right)
2. Paste token (without "Bearer")
3. Click "Authorize"
4. Close dialog
5. Try this endpoint

**Expected Response**:
- Status: 200
- Returns your user profile

---

## 1.5 Update Password

**Endpoint**: `PUT /api/auth/password`

**Input Data**:
```json
{
  "currentPassword": "Patient123!",
  "newPassword": "NewPassword123!"
}
```

**Expected Response**:
- Status: 200
- Message: Password updated successfully

---

## 1.6 Logout

**Endpoint**: `POST /api/auth/logout`

**No Input Required**

**Expected Response**:
- Status: 200
- Message: Logged out successfully

---

# 2. User Management

**⚠️ Note**: Most user endpoints require Admin role. For testing, use the patient/doctor you created.

## 2.1 Get All Users (Admin Only)

**Endpoint**: `GET /api/users`

**Query Parameters**:
- page: 1
- limit: 10
- role: patient

**Expected Response**:
- List of users with pagination

---

## 2.2 Get Single User

**Endpoint**: `GET /api/users/{id}`

**Steps**:
1. Get your user ID from `/api/auth/me`
2. Paste it in the `id` field

**Expected Response**:
- User details

---

## 2.3 Update User Profile

**Endpoint**: `PUT /api/users/{id}`

**Input Data**:
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "+1234567899"
}
```

**Expected Response**:
- Status: 200
- Updated user object

---

# 3. X-Ray Images

## 3.1 Upload X-Ray Image

**Endpoint**: `POST /api/xrays`

**⚠️ Note**: This requires multipart/form-data with an actual image file.

**For Testing in Swagger**:
1. Click "Try it out"
2. Upload any image file (JPG/PNG)
3. Fill other fields:

```json
{
  "userId": "your_user_id_here",
  "captureDate": "2025-11-12",
  "equipment": "Digital X-Ray Machine",
  "position": "AP",
  "kVp": 70,
  "mAs": 10
}
```

**Expected Response**:
- Status: 201
- X-ray object with ID
- **⚠️ SAVE THE X-RAY ID**

---

## 3.2 Get User's X-Rays

**Endpoint**: `GET /api/xrays/user/{userId}`

**Path Parameter**: Your user ID

**Expected Response**:
- List of X-rays for that user

---

## 3.3 Get Single X-Ray

**Endpoint**: `GET /api/xrays/{id}`

**Path Parameter**: X-ray ID from previous step

---

## 3.4 Update X-Ray Metadata

**Endpoint**: `PUT /api/xrays/{id}`

**Input Data**:
```json
{
  "metadata": {
    "equipment": "Updated Equipment Name",
    "notes": "Additional notes"
  }
}
```

---

## 3.5 Delete X-Ray

**Endpoint**: `DELETE /api/xrays/{id}`

**Path Parameter**: X-ray ID

**Expected Response**:
- Status: 200
- Message: X-ray deleted successfully

---

# 4. AI Predictions

## 4.1 Create AI Prediction (Doctor/Admin)

**Endpoint**: `POST /api/predictions`

**⚠️ Requires**: Doctor or Admin token

**Input Data**:
```json
{
  "xrayImageId": "xray_id_from_previous_step",
  "userId": "patient_user_id",
  "oaStatus": "moderate",
  "klGrade": 2,
  "confidence": 0.85,
  "riskScore": 65,
  "analysis": {
    "jointSpaceNarrowing": true,
    "osteophytes": true,
    "sclerosis": false,
    "boneDeformity": false
  },
  "modelInfo": {
    "modelName": "KL-Grade-CNN-v2",
    "modelVersion": "2.1.0",
    "accuracy": 0.92
  },
  "explanation": "Moderate osteoarthritis with visible joint space narrowing and osteophyte formation."
}
```

**Expected Response**:
- Status: 201
- Prediction object with ID
- **⚠️ SAVE THE PREDICTION ID**

---

## 4.2 Get User's Predictions

**Endpoint**: `GET /api/predictions/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 10
- klGrade: 2 (optional)

---

## 4.3 Get Single Prediction

**Endpoint**: `GET /api/predictions/{id}`

---

## 4.4 Update Prediction (Review)

**Endpoint**: `PUT /api/predictions/{id}`

**Input Data**:
```json
{
  "reviewNotes": "Confirmed diagnosis. Recommend physical therapy and weight management."
}
```

---

## 4.5 Get Prediction Statistics

**Endpoint**: `GET /api/predictions/stats/{userId}`

**Expected Response**:
- Average risk score
- KL grade distribution
- Total predictions

---

## 4.6 Delete Prediction (Admin)

**Endpoint**: `DELETE /api/predictions/{id}`

**⚠️ Requires**: Admin token

---

# 5. Recommendations

## 5.1 Generate AI Recommendations

**Endpoint**: `POST /api/recommendations/generate`

**⚠️ Requires**: Doctor or Admin token

**Input Data**:
```json
{
  "userId": "patient_user_id",
  "klGrade": 2
}
```

**Expected Response**:
- Comprehensive recommendations based on KL grade
- Activity suggestions
- Diet recommendations
- Medication suggestions
- **⚠️ SAVE THE RECOMMENDATION ID**

---

## 5.2 Get User's Recommendations

**Endpoint**: `GET /api/recommendations/user/{userId}`

---

## 5.3 Get Active Recommendations

**Endpoint**: `GET /api/recommendations/active/{userId}`

---

## 5.4 Create Custom Recommendation

**Endpoint**: `POST /api/recommendations`

**Input Data**:
```json
{
  "userId": "patient_user_id",
  "klGrade": 2,
  "recommendations": {
    "activity": [
      {
        "type": "daily_steps",
        "target": "8000-10000 steps",
        "description": "Moderate daily walking",
        "priority": "high"
      }
    ],
    "diet": [
      {
        "type": "anti_inflammatory",
        "description": "Include omega-3 rich foods",
        "priority": "high"
      }
    ]
  },
  "basedOn": ["klGrade", "doctorAssessment"]
}
```

---

## 5.5 Update Recommendation

**Endpoint**: `PUT /api/recommendations/{id}`

**Input Data**:
```json
{
  "isActive": true,
  "recommendations": {
    "activity": [
      {
        "type": "swimming",
        "target": "30 minutes, 3 times/week",
        "description": "Low-impact exercise",
        "priority": "high"
      }
    ]
  }
}
```

---

## 5.6 Delete Recommendation

**Endpoint**: `DELETE /api/recommendations/{id}`

**⚠️ Requires**: Doctor or Admin token

---

# 6. Activity Logs

## 6.1 Create Activity Log

**Endpoint**: `POST /api/activity`

**Input Data**:
```json
{
  "userId": "your_user_id",
  "date": "2025-11-12",
  "steps": 8500,
  "distance": 6.5,
  "caloriesBurned": 320,
  "activeMinutes": 45,
  "targetSteps": 10000,
  "targetActiveMinutes": 60,
  "dataSource": "manual"
}
```

**Expected Response**:
- Status: 201
- Activity log with calculated adherence score
- **⚠️ SAVE THE ACTIVITY ID**

---

## 6.2 Get User's Activity Logs

**Endpoint**: `GET /api/activity/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 10
- startDate: 2025-11-01
- endDate: 2025-11-12

---

## 6.3 Get Activity Statistics

**Endpoint**: `GET /api/activity/stats/{userId}`

**Query Parameters**:
- days: 30

**Expected Response**:
- Average steps
- Total calories
- Average adherence score

---

## 6.4 Update Activity Log

**Endpoint**: `PUT /api/activity/{id}`

**Input Data**:
```json
{
  "steps": 9000,
  "activeMinutes": 50,
  "caloriesBurned": 350
}
```

---

## 6.5 Delete Activity Log

**Endpoint**: `DELETE /api/activity/{id}`

---

# 7. Diet Logs

## 7.1 Create Diet Log

**Endpoint**: `POST /api/diet`

**Input Data**:
```json
{
  "userId": "your_user_id",
  "date": "2025-11-12",
  "meals": [
    {
      "type": "breakfast",
      "time": "2025-11-12T08:00:00Z",
      "foods": [
        {
          "name": "Oatmeal",
          "quantity": "1 cup",
          "calories": 150
        },
        {
          "name": "Banana",
          "quantity": "1 medium",
          "calories": 105
        },
        {
          "name": "Almond milk",
          "quantity": "1 cup",
          "calories": 60
        }
      ],
      "totalCalories": 315,
      "nutrients": {
        "protein": 8,
        "carbs": 65,
        "fat": 5,
        "fiber": 10
      }
    }
  ],
  "antiInflammatoryFoods": ["turmeric", "ginger", "omega3"],
  "dietaryScore": 85,
  "dataSource": "manual"
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE DIET LOG ID**

---

## 7.2 Add Meal to Existing Diet Log

**Endpoint**: `POST /api/diet/{id}/meals`

**Input Data**:
```json
{
  "type": "lunch",
  "time": "2025-11-12T12:30:00Z",
  "foods": [
    {
      "name": "Grilled Salmon",
      "quantity": "150g",
      "calories": 280
    },
    {
      "name": "Brown Rice",
      "quantity": "1 cup",
      "calories": 216
    },
    {
      "name": "Steamed Broccoli",
      "quantity": "1 cup",
      "calories": 55
    }
  ]
}
```

---

## 7.3 Get User's Diet Logs

**Endpoint**: `GET /api/diet/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 10
- startDate: 2025-11-01
- endDate: 2025-11-12

---

## 7.4 Get Diet Statistics

**Endpoint**: `GET /api/diet/stats/{userId}`

**Query Parameters**:
- days: 30

---

## 7.5 Get Nutrition Summary

**Endpoint**: `GET /api/diet/nutrition/{userId}`

**Query Parameters**:
- startDate: 2025-11-01
- endDate: 2025-11-12

---

## 7.6 Update Diet Log

**Endpoint**: `PUT /api/diet/{id}`

**Input Data**:
```json
{
  "dietaryScore": 90,
  "antiInflammatoryFoods": ["turmeric", "ginger", "omega3", "green_tea"]
}
```

---

## 7.7 Delete Diet Log

**Endpoint**: `DELETE /api/diet/{id}`

---

# 8. Weight Logs

## 8.1 Create Weight Log

**Endpoint**: `POST /api/weight`

**Input Data**:
```json
{
  "userId": "your_user_id",
  "weight": 75.5,
  "bmi": 24.8,
  "measuredAt": "2025-11-12T07:00:00Z",
  "notes": "Morning weight after workout",
  "dataSource": "manual"
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE WEIGHT LOG ID**

---

## 8.2 Get User's Weight Logs

**Endpoint**: `GET /api/weight/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 20
- startDate: 2025-10-01
- endDate: 2025-11-12

---

## 8.3 Get Weight Statistics

**Endpoint**: `GET /api/weight/stats/{userId}`

**Query Parameters**:
- days: 90

**Expected Response**:
- Current weight
- Weight change
- BMI statistics
- Trend analysis

---

## 8.4 Get Latest Weight

**Endpoint**: `GET /api/weight/latest/{userId}`

---

## 8.5 Update Weight Log

**Endpoint**: `PUT /api/weight/{id}`

**Input Data**:
```json
{
  "weight": 75.0,
  "bmi": 24.6,
  "notes": "Updated measurement"
}
```

---

## 8.6 Delete Weight Log

**Endpoint**: `DELETE /api/weight/{id}`

---

# 9. Medication Reminders

## 9.1 Create Medication Reminder

**Endpoint**: `POST /api/medications`

**Input Data**:
```json
{
  "userId": "your_user_id",
  "medicationName": "Ibuprofen",
  "dosage": "400mg",
  "frequency": "twice daily",
  "timeSlots": ["08:00", "20:00"],
  "startDate": "2025-11-12",
  "endDate": "2025-12-12",
  "isActive": true
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE MEDICATION ID**

---

## 9.2 Log Medication Taken

**Endpoint**: `POST /api/medications/{id}/log`

**Input Data**:
```json
{
  "taken": true,
  "time": "2025-11-12T08:00:00Z",
  "notes": "Taken with breakfast"
}
```

---

## 9.3 Get User's Medications

**Endpoint**: `GET /api/medications/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 20
- isActive: true

---

## 9.4 Get Today's Medications

**Endpoint**: `GET /api/medications/today/{userId}`

---

## 9.5 Get Medication Statistics

**Endpoint**: `GET /api/medications/stats/{userId}`

**Query Parameters**:
- days: 30

**Expected Response**:
- Overall adherence percentage
- Adherence by medication
- Total logs

---

## 9.6 Update Medication

**Endpoint**: `PUT /api/medications/{id}`

**Input Data**:
```json
{
  "dosage": "600mg",
  "frequency": "three times daily",
  "timeSlots": ["08:00", "14:00", "20:00"],
  "isActive": true
}
```

---

## 9.7 Delete Medication

**Endpoint**: `DELETE /api/medications/{id}`

---

# 10. Consultations

## 10.1 Schedule Consultation

**Endpoint**: `POST /api/consultations`

**Input Data**:
```json
{
  "doctorId": "doctor_user_id_here",
  "patientId": "your_user_id",
  "consultationType": "video",
  "scheduledAt": "2025-11-20T10:00:00Z",
  "duration": 30,
  "notes": "Follow-up consultation for knee pain assessment",
  "meetingDetails": {
    "meetingLink": "https://meet.example.com/abc123",
    "meetingId": "abc-123-def"
  }
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE CONSULTATION ID**

---

## 10.2 Get User's Consultations

**Endpoint**: `GET /api/consultations/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 10
- status: scheduled
- type: video

---

## 10.3 Get Upcoming Consultations

**Endpoint**: `GET /api/consultations/upcoming/{userId}`

---

## 10.4 Get Single Consultation

**Endpoint**: `GET /api/consultations/{id}`

---

## 10.5 Update Consultation

**Endpoint**: `PUT /api/consultations/{id}`

**Input Data**:
```json
{
  "scheduledAt": "2025-11-21T10:00:00Z",
  "notes": "Rescheduled - Updated notes",
  "status": "scheduled"
}
```

---

## 10.6 Cancel Consultation

**Endpoint**: `PUT /api/consultations/{id}/cancel`

**Input Data**:
```json
{
  "cancellationReason": "Patient requested reschedule due to conflict"
}
```

---

## 10.7 Complete Consultation (Doctor Only)

**Endpoint**: `PUT /api/consultations/{id}/complete`

**⚠️ Requires**: Doctor token

**Input Data**:
```json
{
  "notes": "Patient showed improvement. Discussed pain management strategies.",
  "clinicalAssessment": "KL Grade 2, moderate pain, good mobility",
  "prescriptions": [
    {
      "medication": "Ibuprofen",
      "dosage": "400mg",
      "frequency": "twice daily",
      "duration": "2 weeks"
    }
  ],
  "nextAppointment": "2025-12-20T10:00:00Z",
  "actionItems": [
    "Continue physical therapy",
    "Monitor pain levels",
    "Follow anti-inflammatory diet"
  ]
}
```

---

## 10.8 Delete Consultation (Admin Only) ⭐ NEW

**Endpoint**: `DELETE /api/consultations/{id}`

**⚠️ Requires**: Admin token

---

# 11. Messages

## 11.1 Send Message

**Endpoint**: `POST /api/messages`

**Input Data**:
```json
{
  "receiverId": "doctor_or_patient_user_id",
  "messageType": "text",
  "content": "Hello, I have a question about my treatment plan.",
  "priority": "normal"
}
```

**Expected Response**:
- Status: 201
- Message object with conversation ID
- **⚠️ SAVE THE MESSAGE ID**

---

## 11.2 Start Conversation (Patient)

**Endpoint**: `POST /api/messages/start-conversation`

**Input Data**:
```json
{
  "doctorId": "doctor_user_id",
  "initialMessage": "Hi Dr. Smith, I'd like to discuss my recent X-ray results."
}
```

---

## 11.3 Get All Conversations

**Endpoint**: `GET /api/messages/conversations`

**Expected Response**:
- List of all your conversations
- Last message in each
- Unread count

---

## 11.4 Get Conversation Messages

**Endpoint**: `GET /api/messages/conversation/{conversationId}`

**Path Parameter**: conversation ID from previous step

**Query Parameters**:
- page: 1
- limit: 50

---

## 11.5 Get Unread Count

**Endpoint**: `GET /api/messages/unread-count`

---

## 11.6 Search Messages

**Endpoint**: `GET /api/messages/search`

**Query Parameters**:
- query: "treatment"
- page: 1
- limit: 20

---

## 11.7 Mark Message as Read

**Endpoint**: `PUT /api/messages/{id}/read`

---

## 11.8 Delete Message

**Endpoint**: `DELETE /api/messages/{id}`

---

# 12. Forum

## 12.1 Create Forum Post

**Endpoint**: `POST /api/forum/posts`

**Input Data**:
```json
{
  "title": "Tips for Managing Knee Pain During Winter",
  "body": "I've been dealing with knee OA for 2 years now. Here are some tips that helped me during cold weather:\n\n1. Keep joints warm with proper clothing\n2. Gentle indoor exercises\n3. Warm compresses before activity\n\nWhat works for you?",
  "category": "tips",
  "tags": ["knee-pain", "winter", "self-care", "pain-management"]
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE POST ID**

---

## 12.2 Get All Forum Posts

**Endpoint**: `GET /api/forum/posts`

**Query Parameters**:
- page: 1
- limit: 10
- category: tips
- sort: recent (or popular, activity)
- search: knee pain

---

## 12.3 Get Single Forum Post

**Endpoint**: `GET /api/forum/posts/{id}`

**Expected Response**:
- Post details
- View count incremented automatically

---

## 12.4 Create Comment on Post

**Endpoint**: `POST /api/forum/posts/{id}/comments`

**Input Data**:
```json
{
  "body": "Great tips! I also find that staying hydrated helps reduce inflammation.",
  "parentCommentId": null
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE COMMENT ID**

---

## 12.5 Reply to Comment

**Endpoint**: `POST /api/forum/posts/{postId}/comments`

**Input Data**:
```json
{
  "body": "Thanks for sharing! How much water do you drink daily?",
  "parentCommentId": "comment_id_from_previous_step"
}
```

---

## 12.6 Get Post Comments

**Endpoint**: `GET /api/forum/posts/{id}/comments`

**Query Parameters**:
- page: 1
- limit: 20

---

## 12.7 Update Comment ⭐ NEW

**Endpoint**: `PUT /api/forum/comments/{id}`

**Input Data**:
```json
{
  "body": "Updated comment: Great tips! I also find that staying well-hydrated and gentle stretching helps reduce inflammation."
}
```

---

## 12.8 Like/Unlike Post

**Endpoint**: `PUT /api/forum/posts/{id}/like`

**No Input Required**

---

## 12.9 Like/Unlike Comment ⭐ NEW

**Endpoint**: `PUT /api/forum/comments/{id}/like`

**No Input Required**

---

## 12.10 Update Forum Post

**Endpoint**: `PUT /api/forum/posts/{id}`

**Input Data**:
```json
{
  "title": "Updated: Tips for Managing Knee Pain During Winter",
  "body": "Updated content with more tips...",
  "tags": ["knee-pain", "winter", "self-care", "pain-management", "exercise"]
}
```

---

## 12.11 Delete Forum Post

**Endpoint**: `DELETE /api/forum/posts/{id}`

---

## 12.12 Delete Comment ⭐ NEW

**Endpoint**: `DELETE /api/forum/comments/{id}`

**Note**: Deletes the comment and all its replies

---

## 12.13 Get Forum Categories

**Endpoint**: `GET /api/forum/categories`

---

# 13. Notifications

## 13.1 Create Notification (Admin)

**Endpoint**: `POST /api/notifications`

**⚠️ Requires**: Admin token

**Input Data**:
```json
{
  "userId": "target_user_id",
  "type": "reminder",
  "title": "Medication Reminder",
  "message": "Time to take your Ibuprofen (400mg)",
  "priority": "high",
  "channels": ["in_app", "email"],
  "actionRequired": true,
  "actionUrl": "/medications",
  "actionText": "View Medications",
  "expiresAt": "2025-11-13T08:00:00Z"
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE NOTIFICATION ID**

---

## 13.2 Broadcast Notification (Admin)

**Endpoint**: `POST /api/notifications/broadcast`

**⚠️ Requires**: Admin token

**Input Data**:
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "type": "announcement",
  "title": "System Maintenance Notice",
  "message": "The system will undergo maintenance on Nov 15, 2025 from 2-4 AM EST.",
  "priority": "medium",
  "channels": ["in_app", "email"]
}
```

---

## 13.3 Get User's Notifications

**Endpoint**: `GET /api/notifications/user/{userId}`

**Query Parameters**:
- page: 1
- limit: 20
- isRead: false
- type: reminder

---

## 13.4 Get Notification Statistics

**Endpoint**: `GET /api/notifications/stats/{userId}`

**Query Parameters**:
- days: 30

---

## 13.5 Mark as Read

**Endpoint**: `PUT /api/notifications/{id}/read`

**No Input Required**

---

## 13.6 Mark All as Read

**Endpoint**: `PUT /api/notifications/read-all/{userId}`

**No Input Required**

---

## 13.7 Delete Notification

**Endpoint**: `DELETE /api/notifications/{id}`

---

# 14. Progress Reports

## 14.1 Generate Progress Report (Doctor/Admin)

**Endpoint**: `POST /api/progress/reports/generate`

**⚠️ Requires**: Doctor or Admin token

**Input Data**:
```json
{
  "userId": "patient_user_id",
  "reportType": "monthly",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

**Expected Response**:
- Status: 201
- Comprehensive progress report
- **⚠️ SAVE THE REPORT ID**

---

## 14.2 Get User's Progress Reports

**Endpoint**: `GET /api/progress/reports/{userId}`

**Query Parameters**:
- page: 1
- limit: 10
- reportType: monthly

---

## 14.3 Get Single Progress Report

**Endpoint**: `GET /api/progress/reports/single/{id}`

---

## 14.4 Get Disease Progression

**Endpoint**: `GET /api/progress/progression/{userId}`

**Expected Response**:
- KL grade history
- Progression trend
- Risk factors

---

## 14.5 Get Progression Analytics

**Endpoint**: `GET /api/progress/analytics/{userId}`

**Expected Response**:
- Progression rate
- Risk level
- Trend analysis
- Projected grade

---

## 14.6 Update Disease Progression (Doctor/Admin)

**Endpoint**: `PUT /api/progress/progression/{userId}`

**⚠️ Requires**: Doctor or Admin token

**Input Data**:
```json
{
  "progression": {
    "currentGrade": 2,
    "rateOfProgression": "slow",
    "projectedGrade": 2
  },
  "riskFactors": {
    "age": true,
    "weight": false,
    "genetics": true,
    "previousInjury": false
  }
}
```

---

## 14.7 Delete Progress Report (Admin) ⭐ NEW

**Endpoint**: `DELETE /api/progress/reports/{id}`

**⚠️ Requires**: Admin token

---

## 14.8 Delete Disease Progression (Admin) ⭐ NEW

**Endpoint**: `DELETE /api/progress/progression/{userId}`

**⚠️ Requires**: Admin token

---

# 15. Doctor-Patient Relations

## 15.1 Create Doctor-Patient Relationship

**Endpoint**: `POST /api/doctor-patient-relations`

**⚠️ Requires**: Doctor or Admin token

**Input Data**:
```json
{
  "doctorId": "doctor_user_id",
  "patientId": "patient_user_id",
  "relationshipType": "primary_care",
  "permissions": {
    "canViewXrays": true,
    "canViewMedicalHistory": true,
    "canPrescribeMedication": true,
    "canModifyTreatmentPlan": true
  },
  "notes": "Primary care physician for knee OA management"
}
```

**Expected Response**:
- Status: 201
- **⚠️ SAVE THE RELATION ID**

---

## 15.2 Get Doctor's Patients

**Endpoint**: `GET /api/doctor-patient-relations/doctor/{doctorId}`

**Query Parameters**:
- page: 1
- limit: 10
- isActive: true

---

## 15.3 Get Patient's Doctors

**Endpoint**: `GET /api/doctor-patient-relations/patient/{patientId}`

**Query Parameters**:
- isActive: true

---

## 15.4 Get Single Relationship

**Endpoint**: `GET /api/doctor-patient-relations/{id}`

---

## 15.5 Get Relationship Permissions

**Endpoint**: `GET /api/doctor-patient-relations/permissions/{doctorId}/{patientId}`

---

## 15.6 Update Relationship

**Endpoint**: `PUT /api/doctor-patient-relations/{id}`

**Input Data**:
```json
{
  "relationshipType": "specialist",
  "permissions": {
    "canViewXrays": true,
    "canViewMedicalHistory": true,
    "canPrescribeMedication": true,
    "canModifyTreatmentPlan": false
  },
  "notes": "Specialized consultation for advanced treatment"
}
```

---

## 15.7 Soft Delete Relationship

**Endpoint**: `DELETE /api/doctor-patient-relations/{id}`

**Note**: Sets isActive to false, preserves history

---

## 15.8 Hard Delete Relationship (Admin) ⭐ NEW

**Endpoint**: `DELETE /api/doctor-patient-relations/{id}/permanent`

**⚠️ Requires**: Admin token

**Note**: Permanently removes the relationship

---

# 16. Additional Endpoints

## 16.1 KL Grades Reference

### Get All KL Grades
**Endpoint**: `GET /api/kl-grades`

### Get Single KL Grade
**Endpoint**: `GET /api/kl-grades/{grade}`

**Path Parameter**: 0-4

### Get KL Grade Recommendations
**Endpoint**: `GET /api/kl-grades/{grade}/recommendations`

---

## 16.2 Audit Logs (Admin)

### Get All Audit Logs
**Endpoint**: `GET /api/audit-logs`

**⚠️ Requires**: Admin token

**Query Parameters**:
- page: 1
- limit: 50
- userId: user_id
- action: user_created
- startDate: 2025-11-01
- endDate: 2025-11-12

### Get User's Audit Logs
**Endpoint**: `GET /api/audit-logs/user/{userId}`

### Get Audit Statistics
**Endpoint**: `GET /api/audit-logs/stats/summary`

---

# 🎯 Testing Strategy

## Recommended Order:

1. **Start with Authentication** (Create users first)
2. **Test User Management** (View/update profiles)
3. **Upload X-Rays** (Need these for predictions)
4. **Create Predictions** (Requires X-rays)
5. **Generate Recommendations** (Based on predictions)
6. **Log Health Data** (Activity, Diet, Weight, Medications)
7. **Test Consultations** (Doctor-patient interaction)
8. **Try Messaging** (Communication)
9. **Use Forum** (Community features)
10. **Check Notifications** (System alerts)
11. **View Progress** (Reports and analytics)
12. **Test DELETE operations** (Cleanup)

---

# 🔑 Key Points to Remember

1. **Save IDs**: Copy and save IDs from responses - you'll need them for subsequent tests
2. **Token Management**: Re-authorize if you get 401 errors
3. **Role Requirements**: Some endpoints need Doctor or Admin roles
4. **Data Dependencies**: Some operations require data from previous steps
5. **Pagination**: Use page and limit parameters for large datasets
6. **Error Handling**: Check error messages for validation issues

---

# ✅ Success Criteria

After testing all APIs, you should have:

- ✅ 2+ users (patient and doctor)
- ✅ 1+ X-ray image
- ✅ 1+ AI prediction
- ✅ 1+ recommendation
- ✅ Multiple health logs (activity, diet, weight)
- ✅ 1+ medication reminder
- ✅ 1+ consultation
- ✅ Messages exchanged
- ✅ Forum post with comments
- ✅ Notifications created
- ✅ Progress report generated
- ✅ Doctor-patient relationship established

---

**🎉 Happy Testing! Your server is ready at http://localhost:5000/api-docs**
