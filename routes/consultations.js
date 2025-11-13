const express = require('express');
const { Consultation, DoctorPatientRelation, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all consultations for a user
// @route   GET /api/consultations/user/:userId
// @access  Private
const getUserConsultations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;

    let query = {};
    
    // Determine user type and set appropriate query
    if (req.user.role === 'doctor') {
      query.doctorId = req.params.userId;
    } else if (req.user.role === 'patient') {
      query.patientId = req.params.userId;
    } else {
      // Admin can see all
      query.$or = [
        { doctorId: req.params.userId },
        { patientId: req.params.userId }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.consultationType = type;
    }

    const consultations = await Consultation.find(query)
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('patientId', 'firstName lastName medicalInfo')
      .populate('reviewedPredictions', 'klGrade oaStatus predictedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledAt: -1 });

    const total = await Consultation.countDocuments(query);

    res.json({
      success: true,
      count: consultations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        consultations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Private
const getConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('patientId', 'firstName lastName medicalInfo')
      .populate('reviewedPredictions');
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if user has access to this consultation
    const hasAccess = req.user.role === 'admin' ||
                     req.user._id.toString() === consultation.doctorId._id.toString() ||
                     req.user._id.toString() === consultation.patientId._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this consultation'
      });
    }

    res.json({
      success: true,
      data: {
        consultation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Schedule consultation
// @route   POST /api/consultations
// @access  Private
const scheduleConsultation = async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      consultationType,
      scheduledAt,
      duration,
      notes,
      meetingDetails
    } = req.body;

    // Verify doctor-patient relationship exists if user is patient
    if (req.user.role === 'patient') {
      const relation = await DoctorPatientRelation.findOne({
        doctorId,
        patientId: req.user._id,
        isActive: true
      });

      if (!relation) {
        return res.status(403).json({
          success: false,
          message: 'No active relationship with this doctor'
        });
      }
    }

    const consultation = await Consultation.create({
      doctorId,
      patientId: patientId || req.user._id,
      consultationType,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      notes,
      meetingDetails
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'consultation_scheduled',
      entity: 'consultations',
      entityId: consultation._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    // Populate the consultation
    await consultation.populate([
      { path: 'doctorId', select: 'firstName lastName doctorInfo' },
      { path: 'patientId', select: 'firstName lastName medicalInfo' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Consultation scheduled successfully',
      data: {
        consultation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' ||
                     req.user._id.toString() === consultation.doctorId.toString() ||
                     (req.user.role === 'patient' && req.user._id.toString() === consultation.patientId.toString());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this consultation'
      });
    }

    const allowedFields = [
      'consultationType',
      'scheduledAt',
      'duration',
      'status',
      'notes',
      'clinicalAssessment',
      'prescriptions',
      'nextAppointment',
      'actionItems',
      'meetingDetails',
      'cancellationReason'
    ];

    // Doctors can update more fields
    if (req.user.role === 'doctor') {
      allowedFields.push('reviewedPredictions', 'updatedRecommendations');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedConsultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'doctorId', select: 'firstName lastName doctorInfo' },
      { path: 'patientId', select: 'firstName lastName medicalInfo' }
    ]);

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'consultation_updated',
      entity: 'consultations',
      entityId: consultation._id,
      changes: updates,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Consultation updated successfully',
      data: {
        consultation: updatedConsultation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel consultation
// @route   PUT /api/consultations/:id/cancel
// @access  Private
const cancelConsultation = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const canCancel = req.user.role === 'admin' ||
                     req.user._id.toString() === consultation.doctorId.toString() ||
                     req.user._id.toString() === consultation.patientId.toString();

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this consultation'
      });
    }

    consultation.status = 'cancelled';
    consultation.cancellationReason = cancellationReason || 'No reason provided';
    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation cancelled successfully',
      data: {
        consultation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete consultation
// @route   PUT /api/consultations/:id/complete
// @access  Private/Doctor
const completeConsultation = async (req, res) => {
  try {
    const {
      notes,
      clinicalAssessment,
      prescriptions,
      nextAppointment,
      actionItems
    } = req.body;

    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Only doctor can complete consultation
    if (req.user._id.toString() !== consultation.doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned doctor can complete this consultation'
      });
    }

    consultation.status = 'completed';
    consultation.completedAt = new Date();
    consultation.notes = notes || consultation.notes;
    consultation.clinicalAssessment = clinicalAssessment || consultation.clinicalAssessment;
    consultation.prescriptions = prescriptions || consultation.prescriptions;
    consultation.nextAppointment = nextAppointment ? new Date(nextAppointment) : consultation.nextAppointment;
    consultation.actionItems = actionItems || consultation.actionItems;

    await consultation.save();

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'consultation_completed',
      entity: 'consultations',
      entityId: consultation._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Consultation completed successfully',
      data: {
        consultation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get upcoming consultations
// @route   GET /api/consultations/upcoming/:userId
// @access  Private
const getUpcomingConsultations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const now = new Date();

    let query = {
      scheduledAt: { $gte: now },
      status: { $in: ['scheduled', 'in_progress'] }
    };

    if (req.user.role === 'doctor') {
      query.doctorId = userId;
    } else if (req.user.role === 'patient') {
      query.patientId = userId;
    }

    const consultations = await Consultation.find(query)
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('patientId', 'firstName lastName')
      .sort({ scheduledAt: 1 })
      .limit(10);

    res.json({
      success: true,
      count: consultations.length,
      data: {
        consultations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete consultation (Admin only)
// @route   DELETE /api/consultations/:id
// @access  Private/Admin
const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    await Consultation.findByIdAndDelete(req.params.id);

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'consultation_deleted',
      entity: 'consultations',
      entityId: req.params.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Consultation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
router.get('/user/:userId', auth, getUserConsultations);
router.get('/upcoming/:userId', auth, getUpcomingConsultations);
router.get('/:id', auth, getConsultation);
router.post('/', auth, scheduleConsultation);
router.put('/:id', auth, updateConsultation);
router.put('/:id/cancel', auth, cancelConsultation);
router.put('/:id/complete', auth, authorize('doctor'), completeConsultation);
router.delete('/:id', auth, authorize('admin'), deleteConsultation);

module.exports = router;