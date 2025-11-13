const express = require('express');
const router = express.Router();
const { DoctorPatientRelation, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// GET /api/doctor-patient-relations - Get relationships for current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    let query = {};
    
    // Doctors see their patient relationships
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }
    // Patients see their doctor relationships
    else if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    }
    // Admins see all relationships
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const relations = await DoctorPatientRelation.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName email doctorInfo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: -1 });

    const total = await DoctorPatientRelation.countDocuments(query);

    res.json({
      success: true,
      count: relations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        relations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all doctor-patient relationships for a doctor
// @route   GET /api/doctor-patient-relations/doctor/:doctorId
// @access  Private (Doctor only)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { doctorId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const relations = await DoctorPatientRelation.find(query)
      .populate('patientId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DoctorPatientRelation.countDocuments(query);

    res.json({
      success: true,
      data: relations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting doctor relations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor-patient relationships'
    });
  }
});

// @desc    Get all doctors for a patient
// @route   GET /api/doctor-patient-relations/patient/:patientId
// @access  Private (Patient only)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { isActive } = req.query;

    const query = { patientId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const relations = await DoctorPatientRelation.find(query)
      .populate('doctorId', 'firstName lastName specialization hospital doctorInfo')
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: relations
    });
  } catch (error) {
    console.error('Error getting patient relations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor-patient relationships'
    });
  }
});

// @desc    Create new doctor-patient relationship
// @route   POST /api/doctor-patient-relations
// @access  Private (Doctor or Admin)
router.post('/', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      relationshipType,
      permissions,
      notes
    } = req.body;

    // Validate that doctor and patient exist and have correct roles
    const doctor = await User.findById(doctorId);
    const patient = await User.findById(patientId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }

    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    // Check if active relationship already exists
    const existingRelation = await DoctorPatientRelation.findOne({
      doctorId,
      patientId,
      isActive: true
    });

    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: 'Active relationship already exists between this doctor and patient'
      });
    }

    const relation = new DoctorPatientRelation({
      doctorId,
      patientId,
      relationshipType: relationshipType || 'primary_care',
      permissions: permissions || {},
      notes
    });

    await relation.save();

    const populatedRelation = await DoctorPatientRelation.findById(relation._id)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedRelation
    });
  } catch (error) {
    console.error('Error creating doctor-patient relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating doctor-patient relationship'
    });
  }
});

// @desc    Get single doctor-patient relationship
// @route   GET /api/doctor-patient-relations/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const relation = await DoctorPatientRelation.findById(req.params.id)
      .populate('doctorId', 'firstName lastName specialization hospital doctorInfo')
      .populate('patientId', 'firstName lastName email phone medicalInfo');

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Doctor-patient relationship not found'
      });
    }

    res.json({
      success: true,
      data: relation
    });
  } catch (error) {
    console.error('Error getting doctor-patient relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor-patient relationship'
    });
  }
});

// @desc    Update doctor-patient relationship
// @route   PUT /api/doctor-patient-relations/:id
// @access  Private (Doctor or Admin)
router.put('/:id', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const {
      relationshipType,
      permissions,
      notes,
      isActive
    } = req.body;

    const relation = await DoctorPatientRelation.findById(req.params.id);

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Doctor-patient relationship not found'
      });
    }

    // Update fields
    if (relationshipType) relation.relationshipType = relationshipType;
    if (permissions) relation.permissions = { ...relation.permissions, ...permissions };
    if (notes !== undefined) relation.notes = notes;
    if (isActive !== undefined) {
      relation.isActive = isActive;
      if (!isActive) {
        relation.endDate = new Date();
      }
    }

    await relation.save();

    const updatedRelation = await DoctorPatientRelation.findById(relation._id)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName email');

    res.json({
      success: true,
      data: updatedRelation
    });
  } catch (error) {
    console.error('Error updating doctor-patient relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating doctor-patient relationship'
    });
  }
});

// @desc    Delete doctor-patient relationship (soft delete)
// @route   DELETE /api/doctor-patient-relations/:id
// @access  Private (Doctor or Admin)
router.delete('/:id', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const relation = await DoctorPatientRelation.findById(req.params.id);

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Doctor-patient relationship not found'
      });
    }

    // Soft delete by setting isActive to false and endDate
    relation.isActive = false;
    relation.endDate = new Date();
    await relation.save();

    res.json({
      success: true,
      message: 'Doctor-patient relationship ended successfully'
    });
  } catch (error) {
    console.error('Error ending doctor-patient relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending doctor-patient relationship'
    });
  }
});

// @desc    Hard delete doctor-patient relationship (Admin only)
// @route   DELETE /api/doctor-patient-relations/:id/permanent
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, authorize('admin'), async (req, res) => {
  try {
    const relation = await DoctorPatientRelation.findById(req.params.id);

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Doctor-patient relationship not found'
      });
    }

    await DoctorPatientRelation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Doctor-patient relationship permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting doctor-patient relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor-patient relationship'
    });
  }
});

// @desc    Get relationship permissions for a specific doctor-patient pair
// @route   GET /api/doctor-patient-relations/permissions/:doctorId/:patientId
// @access  Private
router.get('/permissions/:doctorId/:patientId', auth, async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    const relation = await DoctorPatientRelation.findOne({
      doctorId,
      patientId,
      isActive: true
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'No active relationship found'
      });
    }

    res.json({
      success: true,
      data: {
        relationshipType: relation.relationshipType,
        permissions: relation.permissions,
        startDate: relation.startDate
      }
    });
  } catch (error) {
    console.error('Error getting relationship permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving relationship permissions'
    });
  }
});

module.exports = router;