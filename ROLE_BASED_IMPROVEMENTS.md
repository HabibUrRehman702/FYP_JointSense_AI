# Role-Based Access Control Improvements

## Overview
This document details all role-based improvements implemented in the JointSense AI backend API, including admin registration, enhanced security, and role-specific access controls.

---

## Table of Contents
1. [Role Types](#role-types)
2. [Admin Registration](#admin-registration)
3. [Role-Based Endpoints](#role-based-endpoints)
4. [Security Enhancements](#security-enhancements)
5. [Testing Guide](#testing-guide)

---

## Role Types

The system supports three user roles:

### 1. **Patient** (Default)
- **Purpose**: End users who track their health and receive care
- **Access**: 
  - Own health data (activity, diet, weight logs)
  - Own X-rays and AI predictions
  - Forum participation
  - Doctor consultations (when assigned)
  - Medication reminders
  - Progress reports

### 2. **Doctor**
- **Purpose**: Healthcare providers who monitor and treat patients
- **Access**:
  - Patient data for assigned patients only
  - Create and manage consultations
  - Review X-rays and AI predictions
  - Create progress reports
  - Doctor-patient relationship management
  - Forum moderation (own posts/comments)

### 3. **Admin**
- **Purpose**: System administrators with full access
- **Access**:
  - All user data across the system
  - Audit logs
  - User management (create, update, delete)
  - System-wide statistics
  - Delete any content (consultations, posts, comments)
  - KL Grade reference data management

---

## Admin Registration

### Secure Registration Process

Admin accounts require a secret key for registration to prevent unauthorized admin creation.

#### Configuration

1. **Set Admin Secret in Environment Variables**
   ```bash
   # In .env file
   ADMIN_REGISTRATION_SECRET=your_secure_secret_key_here
   ```

   If not set, defaults to: `admin123secret` (⚠️ Change in production!)

2. **Registration Endpoint**: `POST /api/auth/register`

#### Request Body for Admin Registration

```json
{
  "email": "admin@jointense.com",
  "password": "SecureAdminPass123!",
  "firstName": "Admin",
  "lastName": "User",
  "dateOfBirth": "1985-01-01",
  "gender": "male",
  "role": "admin",
  "adminSecret": "admin123secret"
}
```

#### Response

**Success (201)**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6756abc123def456789",
      "email": "admin@jointense.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (403) - Invalid Secret**
```json
{
  "success": false,
  "message": "Invalid admin secret key. Admin registration requires authorization."
}
```

---

## Role-Based Endpoints

### Authentication Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/register` | POST | Public | Register new user (patient/doctor/admin) |
| `/api/auth/login` | POST | Public | Login and get JWT token |
| `/api/auth/me` | GET | Authenticated | Get current user profile |
| `/api/auth/logout` | POST | Authenticated | Logout user |

### User Management

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/users` | GET | Admin | Get all users |
| `/api/users/:id` | GET | Admin, Self | Get user by ID |
| `/api/users/:id` | PUT | Admin, Self | Update user |
| `/api/users/:id` | DELETE | Admin | Delete user permanently |

### Doctor Registration Requirements

Doctors must provide additional information:

```json
{
  "email": "doctor@hospital.com",
  "password": "DoctorPass123!",
  "firstName": "Dr. John",
  "lastName": "Smith",
  "dateOfBirth": "1980-05-15",
  "gender": "male",
  "role": "doctor",
  "doctorInfo": {
    "licenseNumber": "MED-12345",
    "specialization": "Orthopedics",
    "experience": 10,
    "hospital": "City Hospital"
  }
}
```

### Patient Registration (Enhanced)

Patients can optionally provide medical information:

```json
{
  "email": "patient@email.com",
  "password": "PatientPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-08-20",
  "gender": "female",
  "role": "patient",
  "medicalInfo": {
    "height": 165,
    "bloodType": "A+",
    "allergies": ["Penicillin"],
    "chronicConditions": ["Osteoarthritis"],
    "emergencyContact": {
      "name": "John Doe",
      "relationship": "Spouse",
      "phone": "+1234567890"
    }
  }
}
```

---

## Security Enhancements

### 1. **Admin Secret Key Validation**
- Prevents unauthorized admin registration
- Environment-configurable secret
- Returns 403 error on invalid secret

### 2. **Doctor License Validation**
- Validates unique license numbers
- Prevents duplicate doctor registrations
- Requires specialization field

### 3. **Role-Based Middleware**

#### `auth` Middleware
Verifies JWT token and attaches user to request:
```javascript
const { auth } = require('../middleware/auth');
router.get('/protected', auth, (req, res) => {
  // req.user contains authenticated user
});
```

#### `authorize` Middleware
Restricts access by role:
```javascript
const { auth, authorize } = require('../middleware/auth');
router.delete('/admin-only', auth, authorize('admin'), (req, res) => {
  // Only admins can access
});
```

#### `authorizePatientAccess` Middleware
Allows access to patient data for:
- The patient themselves
- Their assigned doctors
- Admin users

```javascript
const { auth, authorizePatientAccess } = require('../middleware/auth');
router.get('/patient/:userId/data', auth, authorizePatientAccess, (req, res) => {
  // Access granted based on relationship
});
```

### 4. **Audit Logging**
All user creation events are logged:
```javascript
await AuditLog.logActivity({
  userId: user._id,
  action: 'user_created',
  entity: 'users',
  entityId: user._id,
  ipAddress: getClientIP(req),
  userAgent: req.get('User-Agent')
});
```

---

## Role-Based Endpoints Access Matrix

### Activity Logs
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/activity | ✅ Own | ❌ | ✅ |
| GET /api/activity/:userId | ✅ Own | ✅ Assigned | ✅ |
| PUT /api/activity/:id | ✅ Own | ❌ | ✅ |
| DELETE /api/activity/:id | ✅ Own | ❌ | ✅ |

### Weight Logs
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/weight | ✅ Own | ❌ | ✅ |
| GET /api/weight/:userId | ✅ Own | ✅ Assigned | ✅ |
| PUT /api/weight/:id | ✅ Own | ❌ | ✅ |
| DELETE /api/weight/:id | ✅ Own | ❌ | ✅ |

### Diet Logs
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/diet | ✅ Own | ❌ | ✅ |
| GET /api/diet/:userId | ✅ Own | ✅ Assigned | ✅ |
| PUT /api/diet/:id | ✅ Own | ❌ | ✅ |
| DELETE /api/diet/:id | ✅ Own | ❌ | ✅ |

### Consultations
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/consultations | ❌ | ✅ | ✅ |
| GET /api/consultations | ✅ Own | ✅ Own | ✅ All |
| PUT /api/consultations/:id | ❌ | ✅ Own | ✅ |
| DELETE /api/consultations/:id | ❌ | ❌ | ✅ |

### X-Rays & AI Predictions
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/xrays | ✅ Own | ✅ | ✅ |
| GET /api/xrays/:userId | ✅ Own | ✅ Assigned | ✅ |
| DELETE /api/xrays/:id | ✅ Own | ❌ | ✅ |
| GET /api/predictions | ✅ Own | ✅ Assigned | ✅ |
| DELETE /api/predictions/:id | ❌ | ❌ | ✅ |

### Forum
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/forum/posts | ✅ | ✅ | ✅ |
| PUT /api/forum/posts/:id | ✅ Own | ✅ Own | ✅ |
| DELETE /api/forum/posts/:id | ✅ Own | ✅ Own | ✅ |
| POST /api/forum/comments | ✅ | ✅ | ✅ |
| PUT /api/forum/comments/:id | ✅ Own | ✅ Own | ✅ |
| DELETE /api/forum/comments/:id | ✅ Own | ✅ Own | ✅ |

### Doctor-Patient Relations
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /api/doctor-patient-relations | ❌ | ✅ | ✅ |
| GET /api/doctor-patient-relations | ✅ Own | ✅ Own | ✅ |
| DELETE /api/doctor-patient-relations/:id | ❌ | ✅ | ✅ |

### Audit Logs
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| GET /api/audit-logs | ❌ | ❌ | ✅ |
| GET /api/audit-logs/user/:userId | ❌ | ❌ | ✅ |

### KL Grades (Reference Data)
| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| GET /api/kl-grades | ✅ | ✅ | ✅ |
| POST /api/kl-grades | ❌ | ❌ | ✅ |
| PUT /api/kl-grades/:id | ❌ | ❌ | ✅ |
| DELETE /api/kl-grades/:id | ❌ | ❌ | ✅ |

---

## Testing Guide

### 1. Register Admin User

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@jointense.com",
  "password": "AdminPass123!",
  "firstName": "Admin",
  "lastName": "User",
  "dateOfBirth": "1985-01-01",
  "gender": "male",
  "role": "admin",
  "adminSecret": "admin123secret"
}
```

**Swagger UI:**
1. Go to http://localhost:5000/api-docs
2. Navigate to **Authentication** section
3. Click on `POST /api/auth/register`
4. Fill in the request body with admin details including `adminSecret`
5. Execute

### 2. Register Doctor

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "DoctorPass123!",
  "firstName": "Dr. John",
  "lastName": "Smith",
  "dateOfBirth": "1980-05-15",
  "gender": "male",
  "role": "doctor",
  "doctorInfo": {
    "licenseNumber": "MED-12345",
    "specialization": "Orthopedics",
    "experience": 10,
    "hospital": "City Hospital"
  }
}
```

### 3. Register Patient

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "patient@email.com",
  "password": "PatientPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-08-20",
  "gender": "female",
  "role": "patient",
  "medicalInfo": {
    "height": 165,
    "bloodType": "A+",
    "allergies": ["Penicillin"],
    "chronicConditions": ["Osteoarthritis"]
  }
}
```

### 4. Test Role-Based Access

#### a. Test Admin Access to Audit Logs
```bash
GET http://localhost:5000/api/audit-logs
Authorization: Bearer {admin_token}
```

**Expected:** 200 OK with audit logs

#### b. Test Patient Access to Audit Logs (Should Fail)
```bash
GET http://localhost:5000/api/audit-logs
Authorization: Bearer {patient_token}
```

**Expected:** 403 Forbidden

#### c. Test Doctor Access to Assigned Patient
```bash
# First, create doctor-patient relationship
POST http://localhost:5000/api/doctor-patient-relations
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "patientId": "{patient_id}"
}

# Then access patient's activity logs
GET http://localhost:5000/api/activity/{patient_id}
Authorization: Bearer {doctor_token}
```

**Expected:** 200 OK with patient's activity data

### 5. Test Invalid Admin Registration

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "fake-admin@test.com",
  "password": "FakeAdmin123!",
  "firstName": "Fake",
  "lastName": "Admin",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "role": "admin",
  "adminSecret": "wrong_secret"
}
```

**Expected:** 403 Forbidden with message "Invalid admin secret key"

---

## Environment Configuration

### Production Deployment

⚠️ **IMPORTANT**: Change the admin secret in production!

```bash
# .env
ADMIN_REGISTRATION_SECRET=use_a_very_strong_random_secret_here_minimum_32_characters
JWT_SECRET=use_a_very_strong_jwt_secret_here
```

### Generate Secure Secrets

**Using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

---

## Validation Rules

### Admin Registration
- ✅ Valid email format
- ✅ Password minimum 6 characters
- ✅ First name minimum 2 characters
- ✅ Last name minimum 2 characters
- ✅ Valid date of birth
- ✅ Gender: male, female, or other
- ✅ Role: admin
- ✅ **adminSecret must match ADMIN_REGISTRATION_SECRET**

### Doctor Registration
- ✅ All standard registration fields
- ✅ Role: doctor
- ✅ **licenseNumber (required, unique)**
- ✅ **specialization (required)**
- ✅ experience (optional, 0-50 years)
- ✅ hospital (optional)

### Patient Registration
- ✅ All standard registration fields
- ✅ Role: patient (default)
- ✅ medicalInfo (optional)
  - height: 100-250 cm
  - bloodType: A+, A-, B+, B-, AB+, AB-, O+, O-
  - allergies: array of strings
  - chronicConditions: array of strings

---

## API Changes Summary

### Modified Files

1. **routes/auth.js**
   - Added `adminSecret` parameter handling
   - Added admin secret key validation
   - Enhanced doctor registration validation (unique license check)
   - Added medicalInfo and doctorInfo to user creation

2. **middleware/validation.js**
   - Added `adminSecret` field to `userRegistrationSchema`
   - Made adminSecret required when role is 'admin'
   - Made adminSecret forbidden for other roles

3. **.env.example**
   - Added `ADMIN_REGISTRATION_SECRET` variable with documentation

4. **Swagger Documentation (routes/auth.js)**
   - Updated register endpoint documentation
   - Added adminSecret field description
   - Added medicalInfo and doctorInfo schema details
   - Added 403 response for invalid admin secret

---

## Error Handling

### Common Error Responses

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

```json
{
  "success": false,
  "message": "Doctor registration requires license number and specialization"
}
```

```json
{
  "success": false,
  "message": "A doctor with this license number already exists"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "Invalid admin secret key. Admin registration requires authorization."
}
```

```json
{
  "success": false,
  "message": "Access denied"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "No token provided, authorization denied"
}
```

---

## Security Best Practices

### For Development
1. ✅ Use environment variables for secrets
2. ✅ Never commit `.env` files to version control
3. ✅ Use strong, unique passwords for test accounts
4. ✅ Test all role-based access controls

### For Production
1. ⚠️ **Change ADMIN_REGISTRATION_SECRET to a strong, random value**
2. ⚠️ **Change JWT_SECRET to a strong, random value**
3. ⚠️ Use HTTPS for all API communication
4. ⚠️ Implement rate limiting (already configured)
5. ⚠️ Monitor audit logs for suspicious activity
6. ⚠️ Regularly rotate JWT secrets
7. ⚠️ Consider disabling admin registration in production after initial setup

---

## Troubleshooting

### Issue: "Invalid admin secret key" error
**Solution**: Check that `adminSecret` in request matches `ADMIN_REGISTRATION_SECRET` in `.env`

### Issue: "Doctor registration requires license number"
**Solution**: Include `doctorInfo` object with `licenseNumber` and `specialization` for doctor registration

### Issue: "Access denied" when accessing patient data
**Solution**: 
- Ensure doctor-patient relationship exists
- Check that JWT token is valid and not expired
- Verify role-based middleware is correctly applied

### Issue: Can't create admin user
**Solution**: 
1. Check `.env` file has `ADMIN_REGISTRATION_SECRET` set
2. Include correct `adminSecret` in registration request
3. Restart server after changing `.env`

---

## Future Enhancements

### Planned Improvements
- [ ] Multi-factor authentication for admin accounts
- [ ] IP whitelist for admin registration
- [ ] Admin approval workflow for doctor registration
- [ ] Role hierarchy and custom permissions
- [ ] Temporary admin privileges delegation
- [ ] Audit log filtering and search
- [ ] Role-based rate limiting
- [ ] Session management and concurrent login limits

---

## Support & Documentation

- **API Documentation**: http://localhost:5000/api-docs
- **Project Repository**: Check your GitHub repository
- **Environment Setup**: See `.env.example`
- **Full API Reference**: See `API_ENDPOINTS_REFERENCE.md`

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
