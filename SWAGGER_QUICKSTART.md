# Quick Start Guide - Swagger API Documentation

## 🚀 Getting Started

### 1. Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

### 2. Access Swagger UI

Open your browser and navigate to:
```
http://localhost:5000/api-docs
```

### 3. Explore the API

You'll see an interactive documentation page with all available endpoints organized by categories.

## 🔑 Authentication Setup

### Step 1: Register a Test User

1. Find the **Authentication** section
2. Click on `POST /api/auth/register`
3. Click **"Try it out"**
4. Use this sample data:

```json
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "role": "patient"
}
```

5. Click **"Execute"**
6. Copy the `token` from the response

### Step 2: Authorize Swagger

1. Click the **"Authorize" 🔓** button at the top right
2. Paste your token (no need to add "Bearer" prefix, Swagger adds it)
3. Click **"Authorize"**
4. Click **"Close"**

Now you can test all protected endpoints! 🎉

## 📝 Testing Common Workflows

### Workflow 1: User Authentication

```
1. POST /api/auth/register    → Register new user
2. POST /api/auth/login        → Login and get token
3. GET /api/auth/me            → Get current user profile
4. PUT /api/auth/password      → Update password
5. POST /api/auth/logout       → Logout
```

### Workflow 2: X-Ray Analysis

```
1. POST /api/xrays             → Upload X-ray image
2. POST /api/predictions       → Create AI prediction
3. GET /api/predictions/user/{userId} → View predictions
4. GET /api/recommendations    → Get recommendations
```

### Workflow 3: Health Tracking

```
1. POST /api/activity          → Log physical activity
2. POST /api/diet              → Log meal
3. POST /api/weight            → Log weight
4. GET /api/progress           → View progress report
```

### Workflow 4: Doctor-Patient Interaction

```
1. POST /api/doctor-patient-relations → Link doctor to patient
2. POST /api/consultations     → Schedule consultation
3. POST /api/messages          → Send message
4. GET /api/notifications      → Check notifications
```

### Workflow 5: Community Engagement

```
1. GET /api/forum              → Browse forum posts
2. POST /api/forum             → Create new post
3. POST /api/forum/{id}/comments → Add comment
4. PUT /api/forum/{id}/like    → Like a post
```

## 🧪 Sample Test Data

### Patient User
```json
{
  "email": "patient@test.com",
  "password": "Patient123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "patient",
  "dateOfBirth": "1985-05-15",
  "gender": "female"
}
```

### Doctor User
```json
{
  "email": "doctor@test.com",
  "password": "Doctor123!",
  "firstName": "Dr. Michael",
  "lastName": "Johnson",
  "role": "doctor",
  "phone": "+1987654321"
}
```

### Activity Log
```json
{
  "date": "2024-01-15",
  "activityType": "walking",
  "duration": 30,
  "intensity": "moderate",
  "caloriesBurned": 150,
  "notes": "Morning walk in the park"
}
```

### Diet Log
```json
{
  "date": "2024-01-15",
  "mealType": "breakfast",
  "foodItems": ["oatmeal", "banana", "almond milk"],
  "calories": 350,
  "nutritionInfo": {
    "protein": 12,
    "carbs": 65,
    "fats": 8,
    "fiber": 10
  }
}
```

### Weight Log
```json
{
  "date": "2024-01-15",
  "weight": 75.5,
  "bmi": 24.2,
  "notes": "Morning weight after workout"
}
```

### Medication Reminder
```json
{
  "medicationName": "Ibuprofen",
  "dosage": "400mg",
  "frequency": "twice daily",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "reminderTime": ["08:00", "20:00"],
  "isActive": true
}
```

### Consultation
```json
{
  "doctorId": "doctor_user_id_here",
  "appointmentDate": "2024-01-20T10:00:00Z",
  "consultationType": "video",
  "notes": "Follow-up consultation for knee pain"
}
```

### Forum Post
```json
{
  "title": "Tips for Managing Knee Pain",
  "content": "I've found that regular low-impact exercises help a lot...",
  "category": "exercises",
  "tags": ["knee-pain", "exercises", "tips"]
}
```

## 🎯 Pro Tips

1. **Use the Filter Bar**: Search for specific endpoints using the search bar
2. **Expand All**: Click "Expand Operations" to see all endpoints at once
3. **Download Spec**: Download the OpenAPI spec for use with other tools
4. **Model Schemas**: Click on schema names to see complete data structures
5. **Response Examples**: Check the "Responses" section for example outputs

## 🔧 Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Make sure you've clicked "Authorize" and entered a valid token

### Issue: Token Expired
**Solution**: Login again to get a new token

### Issue: 404 Not Found
**Solution**: Ensure the server is running on the correct port (default: 5000)

### Issue: CORS Error
**Solution**: Check `ALLOWED_ORIGINS` in your `.env` file

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JWT Authentication](https://jwt.io/)

## 🆘 Need Help?

- Check the main README.md
- Review SWAGGER_README.md for detailed documentation
- Contact: support@jointsenseai.com

---

Happy Testing! 🎉
