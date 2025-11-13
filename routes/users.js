const express = require('express');
const { User, AuditLog, DoctorPatientRelation } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { userUpdateSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [patient, doctor, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET /api/users - Get all users (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const role = req.query.role;
  const search = req.query.search;

  let query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'user_created',
      entity: 'users',
      entityId: user._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'profilePicture',
      'medicalInfo', 'doctorInfo'
    ];

    // Admin can update more fields
    if (req.user.role === 'admin') {
      allowedFields.push('email', 'role', 'isActive');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'user_updated',
      entity: 'users',
      entityId: user._id,
      changes: updates,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'user_deleted',
      entity: 'users',
      entityId: req.params.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's patients (Doctor only)
// @route   GET /api/users/patients
// @access  Private/Doctor
const getPatients = async (req, res) => {
  try {
    const relations = await DoctorPatientRelation.find({
      doctorId: req.user._id,
      isActive: true
    }).populate('patientId', '-password');

    const patients = relations.map(relation => relation.patientId);

    res.json({
      success: true,
      count: patients.length,
      data: {
        patients
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's doctors (Patient only)
// @route   GET /api/users/doctors
// @access  Private/Patient
const getDoctors = async (req, res) => {
  try {
    const relations = await DoctorPatientRelation.find({
      patientId: req.user._id,
      isActive: true
    }).populate('doctorId', '-password');

    const doctors = relations.map(relation => relation.doctorId);

    res.json({
      success: true,
      count: doctors.length,
      data: {
        doctors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
router.get('/', auth, authorize('admin'), getUsers);
router.get('/patients', auth, authorize('doctor'), getPatients);
router.get('/doctors', auth, authorize('patient'), getDoctors);
router.get('/:id', auth, authorizePatientAccess, getUser);
router.post('/', auth, authorize('admin'), createUser);
router.put('/:id', auth, authorizePatientAccess, updateUser);
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;