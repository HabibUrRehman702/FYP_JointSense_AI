# 🗑️ Testing DELETE Endpoints in Swagger UI

## ✅ Server Restarted Successfully!

Your server is now running with **ALL DELETE endpoints visible in Swagger UI**.

## 🚀 Access Swagger UI

Open your browser and go to:
```
http://localhost:5000/api-docs
```

## 🔍 Finding DELETE Endpoints

### **NEW** DELETE Endpoints Now Available:

#### 1. **Consultations** (Admin Only)
- **Endpoint**: `DELETE /api/consultations/{id}`
- **Tag**: Consultations
- **Access**: Admin only
- **Purpose**: Permanently delete consultation records

#### 2. **Forum Comments** (Owner/Admin)
- **Endpoint**: `DELETE /api/forum/comments/{id}`
- **Tag**: Forum
- **Access**: Comment owner or Admin
- **Purpose**: Delete comment and all its replies

#### 3. **Forum Comment Update** (Owner/Admin)
- **Endpoint**: `PUT /api/forum/comments/{id}`
- **Tag**: Forum
- **Access**: Comment owner or Admin
- **Purpose**: Edit comment content

#### 4. **Forum Comment Like**
- **Endpoint**: `PUT /api/forum/comments/{id}/like`
- **Tag**: Forum
- **Access**: Authenticated users
- **Purpose**: Like/unlike a comment

#### 5. **Progress Reports** (Admin Only)
- **Endpoint**: `DELETE /api/progress/reports/{id}`
- **Tag**: Progress
- **Access**: Admin only
- **Purpose**: Delete individual progress reports

#### 6. **Disease Progression** (Admin Only)
- **Endpoint**: `DELETE /api/progress/progression/{userId}`
- **Tag**: Progress
- **Access**: Admin only
- **Purpose**: Delete complete disease progression history

#### 7. **Doctor-Patient Relations - Hard Delete** (Admin Only)
- **Endpoint**: `DELETE /api/doctor-patient-relations/{id}/permanent`
- **Tag**: Doctor-Patient Relations
- **Access**: Admin only
- **Purpose**: Permanently delete relationship (vs soft delete)

---

## 🎯 How to Test DELETE Endpoints

### Step 1: Get Authentication Token

1. **Login** (if you have an account):
   ```
   POST /api/auth/login
   ```
   Body:
   ```json
   {
     "email": "patient@test.com",
     "password": "Test123!@#"
   }
   ```

2. **OR Register** (if you don't have an account):
   ```
   POST /api/auth/register
   ```
   Body:
   ```json
   {
     "email": "testuser@example.com",
     "password": "Test123!@#",
     "firstName": "Test",
     "lastName": "User",
     "role": "patient",
     "dateOfBirth": "1990-01-01",
     "gender": "male"
   }
   ```

3. **Copy the token** from the response

### Step 2: Authorize in Swagger

1. Click the **"Authorize" 🔓** button (top right)
2. Paste **ONLY the token** (without "Bearer"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Click **"Authorize"**
4. Click **"Close"**

### Step 3: Find the DELETE Endpoint

1. **Scroll down** or use the **search/filter** in Swagger UI
2. Look for endpoints with the **red DELETE** badge
3. Click to expand the endpoint

### Step 4: Test the DELETE

#### Example: Delete a Consultation

1. **First, create a consultation** to have something to delete:
   ```
   POST /api/consultations
   ```
   Body:
   ```json
   {
     "doctorId": "doctor_id_here",
     "patientId": "your_user_id",
     "consultationType": "video",
     "scheduledAt": "2025-11-20T10:00:00Z",
     "notes": "Test consultation"
   }
   ```
   Copy the consultation `_id` from response

2. **Then delete it** (need Admin role):
   ```
   DELETE /api/consultations/{id}
   ```
   - Click "Try it out"
   - Paste the consultation ID in the `id` field
   - Click "Execute"
   - Expected response:
     ```json
     {
       "success": true,
       "message": "Consultation deleted successfully"
     }
     ```

---

## 📋 All DELETE Endpoints Checklist

### Existing DELETE Endpoints:
- [x] `DELETE /api/activity/{id}` - Activity logs
- [x] `DELETE /api/diet/{id}` - Diet logs
- [x] `DELETE /api/weight/{id}` - Weight logs
- [x] `DELETE /api/medications/{id}` - Medication reminders
- [x] `DELETE /api/xrays/{id}` - X-ray images
- [x] `DELETE /api/predictions/{id}` - AI predictions (Admin)
- [x] `DELETE /api/recommendations/{id}` - Recommendations (Doctor/Admin)
- [x] `DELETE /api/notifications/{id}` - Notifications
- [x] `DELETE /api/messages/{id}` - Messages
- [x] `DELETE /api/forum/posts/{id}` - Forum posts
- [x] `DELETE /api/users/{id}` - Users (Admin)

### **NEW** DELETE Endpoints:
- [x] `DELETE /api/consultations/{id}` ⭐ NEW
- [x] `DELETE /api/forum/comments/{id}` ⭐ NEW
- [x] `DELETE /api/progress/reports/{id}` ⭐ NEW
- [x] `DELETE /api/progress/progression/{userId}` ⭐ NEW
- [x] `DELETE /api/doctor-patient-relations/{id}/permanent` ⭐ NEW

### **NEW** UPDATE Endpoints:
- [x] `PUT /api/forum/comments/{id}` ⭐ NEW
- [x] `PUT /api/forum/comments/{id}/like` ⭐ NEW

---

## 🔐 Access Levels

### Public (No Auth):
- None - All DELETE operations require authentication

### Authenticated Users:
- Activity logs (own data)
- Diet logs (own data)
- Weight logs (own data)
- Medications (own data)
- Messages (own messages)
- Notifications (own notifications)
- Forum comments (own comments)

### Doctor Role:
- Recommendations
- Doctor-patient relations (soft delete)

### Admin Role:
- Consultations (hard delete)
- Progress reports
- Disease progression
- Doctor-patient relations (hard delete)
- AI predictions
- Users
- All data (full access)

---

## 💡 Tips for Testing

### 1. Test Flow: Create → Read → Delete

Always create data first before testing delete:
```
1. POST /api/consultations → Get ID
2. GET /api/consultations/{id} → Verify it exists
3. DELETE /api/consultations/{id} → Delete it
4. GET /api/consultations/{id} → Verify 404
```

### 2. Authorization Errors

If you get `403 Forbidden`:
- Check if endpoint requires Admin role
- Verify you're deleting your own data (for user-level endpoints)
- Make sure you're authenticated

### 3. Test with Different Users

Create multiple users with different roles:
- **Patient**: Test user-level deletes
- **Doctor**: Test doctor-specific deletes
- **Admin**: Test all admin-level deletes

### 4. Soft vs Hard Delete

Some endpoints have both:
- **Soft delete**: `DELETE /api/doctor-patient-relations/{id}` (sets isActive=false)
- **Hard delete**: `DELETE /api/doctor-patient-relations/{id}/permanent` (removes permanently)

---

## 🎨 Visual Guide in Swagger

### Look for these in Swagger UI:

1. **Red DELETE badge** = DELETE endpoint
2. **Orange PUT badge** = UPDATE endpoint (includes new comment endpoints)
3. **Green GET badge** = READ endpoint
4. **Blue POST badge** = CREATE endpoint

### Filtering by Tag:

Click on any tag to see only those endpoints:
- **Consultations** → See all consultation operations
- **Forum** → See all forum operations (including new comment endpoints)
- **Progress** → See all progress operations
- **Doctor-Patient Relations** → See relationship operations

---

## 🐛 Troubleshooting

### Issue: DELETE endpoints not visible
**Solution**: ✅ **FIXED!** Server restarted with Swagger annotations

### Issue: "Bearer Bearer" error
**Solution**: Paste token WITHOUT "Bearer" word in Authorize dialog

### Issue: 404 Not Found on DELETE
**Solution**: 
- Make sure the resource exists (GET it first)
- Check the ID is correct
- Verify you have access to that resource

### Issue: 403 Forbidden
**Solution**:
- Check if endpoint requires Admin role
- Verify you're authorized to delete that specific resource
- For admin-only endpoints, you need an admin account

---

## ✅ Verification

To verify all DELETE endpoints are visible:

1. Open http://localhost:5000/api-docs
2. Use browser search (Ctrl+F)
3. Search for "DELETE"
4. You should see **18+ DELETE endpoints**

---

## 🎉 Success!

All DELETE endpoints are now:
- ✅ Implemented in code
- ✅ Documented in Swagger
- ✅ Visible in Swagger UI
- ✅ Ready for testing

**Refresh your browser and start testing!** 🚀

---

**Server Status**: ✅ Running on http://localhost:5000  
**Swagger UI**: ✅ Available at http://localhost:5000/api-docs  
**Documentation**: ✅ Updated with all new endpoints
