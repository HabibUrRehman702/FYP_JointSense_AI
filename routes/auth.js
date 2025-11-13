const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { userRegistrationSchema, userLoginSchema } = require('../middleware/validation');
const { getClientIP } = require('../utils/ipUtils');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               role:
 *                 type: string
 *                 enum: [patient, doctor, admin]
 *                 example: patient
 *                 description: User role (default is patient)
 *               adminSecret:
 *                 type: string
 *                 example: admin123secret
 *                 description: Required only for admin role registration. Set ADMIN_REGISTRATION_SECRET in .env file.
 *               medicalInfo:
 *                 type: object
 *                 description: Required for patient role
 *                 properties:
 *                   height:
 *                     type: number
 *                     example: 175
 *                   bloodType:
 *                     type: string
 *                     enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                     example: O+
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Penicillin"]
 *                   chronicConditions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Diabetes"]
 *               doctorInfo:
 *                 type: object
 *                 description: Required for doctor role
 *                 required:
 *                   - licenseNumber
 *                   - specialization
 *                 properties:
 *                   licenseNumber:
 *                     type: string
 *                     example: MED-12345
 *                   specialization:
 *                     type: string
 *                     example: Orthopedics
 *                   experience:
 *                     type: number
 *                     example: 10
 *                   hospital:
 *                     type: string
 *                     example: City Hospital
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Invalid admin secret key
 */
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    role = 'patient',
    adminSecret,
    medicalInfo,
    doctorInfo
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }
  
  // Validate admin registration with secret key
  if (role === 'admin') {
    const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'admin123secret';
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin secret key. Admin registration requires authorization.'
      });
    }
  }
  
  // Validate doctor-specific fields
  if (role === 'doctor') {
    if (!doctorInfo || !doctorInfo.licenseNumber || !doctorInfo.specialization) {
      return res.status(400).json({
        success: false,
        message: 'Doctor registration requires license number and specialization'
      });
    }
    
    // Check for duplicate license number
    const existingDoctor = await User.findOne({ 'doctorInfo.licenseNumber': doctorInfo.licenseNumber });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'A doctor with this license number already exists'
      });
    }
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    role,
    medicalInfo: role === 'patient' ? medicalInfo : undefined,
    doctorInfo: role === 'doctor' ? doctorInfo : undefined
  });

  // Log activity
  await AuditLog.logActivity({
    userId: user._id,
    action: 'user_created',
    entity: 'users',
    entityId: user._id,
    ipAddress: getClientIP(req),
    userAgent: req.get('User-Agent')
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.correctPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Log activity
  await AuditLog.logActivity({
    userId: user._id,
    action: 'user_login',
    entity: 'users',
    entityId: user._id,
    ipAddress: getClientIP(req),
    userAgent: req.get('User-Agent')
  });

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.correctPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    await AuditLog.logActivity({
      userId: user._id,
      action: 'password_changed',
      entity: 'users',
      entityId: user._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'user_logout',
      entity: 'users',
      entityId: req.user._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
router.post('/register', validate(userRegistrationSchema), register);
router.post('/login', validate(userLoginSchema), login);
router.get('/me', auth, getMe);
router.put('/password', auth, updatePassword);
router.post('/logout', auth, logout);

module.exports = router;