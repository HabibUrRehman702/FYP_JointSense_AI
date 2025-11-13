const express = require('express');
const { MedicationReminder, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all medication reminders for a user
// @route   GET /api/medications/user/:userId
// @access  Private
const getUserMedicationReminders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isActive = req.query.isActive;

    let query = { userId: req.params.userId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const medications = await MedicationReminder.find(query)
      .populate('prescribedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await MedicationReminder.countDocuments(query);

    res.json({
      success: true,
      count: medications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        medications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single medication reminder
// @route   GET /api/medications/:id
// @access  Private
const getMedicationReminder = async (req, res) => {
  try {
    const medication = await MedicationReminder.findById(req.params.id)
      .populate('prescribedBy', 'firstName lastName');
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminder not found'
      });
    }

    res.json({
      success: true,
      data: {
        medication
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create medication reminder
// @route   POST /api/medications
// @access  Private
const createMedicationReminder = async (req, res) => {
  try {
    const {
      userId,
      medicationName,
      dosage,
      frequency,
      timeSlots,
      startDate,
      endDate
    } = req.body;

    // Ensure user can only create reminders for themselves (unless doctor/admin)
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only create their own medication reminders'
      });
    }

    const medication = await MedicationReminder.create({
      userId: userId || req.user._id,
      medicationName,
      dosage,
      frequency,
      timeSlots: timeSlots || [],
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      prescribedBy: req.user.role === 'doctor' ? req.user._id : null
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'medication_reminder_created',
      entity: 'medicationReminders',
      entityId: medication._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Medication reminder created successfully',
      data: {
        medication
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update medication reminder
// @route   PUT /api/medications/:id
// @access  Private
const updateMedicationReminder = async (req, res) => {
  try {
    const allowedFields = [
      'medicationName',
      'dosage',
      'frequency',
      'timeSlots',
      'startDate',
      'endDate',
      'isActive'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const medication = await MedicationReminder.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Medication reminder updated successfully',
      data: {
        medication
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete medication reminder
// @route   DELETE /api/medications/:id
// @access  Private
const deleteMedicationReminder = async (req, res) => {
  try {
    const medication = await MedicationReminder.findById(req.params.id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminder not found'
      });
    }

    // Check if user can delete this medication reminder
    if (req.user.role === 'patient' && req.user._id.toString() !== medication.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medication reminder'
      });
    }

    await MedicationReminder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Medication reminder deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Log medication taken
// @route   POST /api/medications/:id/log
// @access  Private
const logMedicationTaken = async (req, res) => {
  try {
    const { taken, time, notes } = req.body;

    const medication = await MedicationReminder.findById(req.params.id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminder not found'
      });
    }

    // Check if user can log for this medication
    if (req.user.role === 'patient' && req.user._id.toString() !== medication.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to log for this medication'
      });
    }

    const logEntry = {
      date: new Date(),
      taken: taken !== undefined ? taken : true,
      time: time ? new Date(time) : new Date(),
      notes: notes || ''
    };

    medication.adherenceLog.push(logEntry);
    await medication.save();

    res.json({
      success: true,
      message: 'Medication adherence logged successfully',
      data: {
        medication,
        logEntry
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get medication adherence statistics
// @route   GET /api/medications/stats/:userId
// @access  Private
const getMedicationStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const medications = await MedicationReminder.find({
      userId,
      isActive: true,
      startDate: { $lte: new Date() }
    });

    let totalLogs = 0;
    let takenLogs = 0;
    let adherenceByMedication = [];

    medications.forEach(medication => {
      const recentLogs = medication.adherenceLog.filter(log => 
        new Date(log.date) >= startDate
      );
      
      const medicationTaken = recentLogs.filter(log => log.taken).length;
      const medicationTotal = recentLogs.length;
      const adherencePercentage = medicationTotal > 0 ? (medicationTaken / medicationTotal) * 100 : 0;

      adherenceByMedication.push({
        medicationName: medication.medicationName,
        adherencePercentage: Math.round(adherencePercentage),
        totalLogs: medicationTotal,
        takenLogs: medicationTaken
      });

      totalLogs += medicationTotal;
      takenLogs += medicationTaken;
    });

    const overallAdherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallAdherence,
        totalMedications: medications.length,
        totalLogs,
        takenLogs,
        adherenceByMedication
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get today's medication schedule
// @route   GET /api/medications/today/:userId
// @access  Private
const getTodaysMedications = async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medications = await MedicationReminder.find({
      userId,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: null },
        { endDate: { $gte: today } }
      ]
    });

    const todaysSchedule = medications.map(medication => {
      // Check if medication was already taken today
      const todaysLogs = medication.adherenceLog.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= today && logDate < tomorrow;
      });

      return {
        medicationId: medication._id,
        medicationName: medication.medicationName,
        dosage: medication.dosage,
        frequency: medication.frequency,
        timeSlots: medication.timeSlots,
        taken: todaysLogs.some(log => log.taken),
        logs: todaysLogs
      };
    });

    res.json({
      success: true,
      data: {
        date: today,
        schedule: todaysSchedule
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
router.get('/user/:userId', auth, authorizePatientAccess, getUserMedicationReminders);
router.get('/stats/:userId', auth, authorizePatientAccess, getMedicationStats);
router.get('/today/:userId', auth, authorizePatientAccess, getTodaysMedications);
router.get('/:id', auth, getMedicationReminder);
router.post('/', auth, createMedicationReminder);
router.post('/:id/log', auth, logMedicationTaken);
router.put('/:id', auth, updateMedicationReminder);
router.delete('/:id', auth, deleteMedicationReminder);

module.exports = router;