const express = require('express');
const { WeightLog, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all weight logs for a user
// @route   GET /api/weight/user/:userId
// @access  Private
const getUserWeightLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = { userId: req.params.userId };
    
    if (startDate && endDate) {
      query.measuredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const weightLogs = await WeightLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ measuredAt: -1 });

    const total = await WeightLog.countDocuments(query);

    res.json({
      success: true,
      count: weightLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        weightLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single weight log
// @route   GET /api/weight/:id
// @access  Private
const getWeightLog = async (req, res) => {
  try {
    const weightLog = await WeightLog.findById(req.params.id);
    
    if (!weightLog) {
      return res.status(404).json({
        success: false,
        message: 'Weight log not found'
      });
    }

    res.json({
      success: true,
      data: {
        weightLog
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create weight log
// @route   POST /api/weight
// @access  Private
const createWeightLog = async (req, res) => {
  try {
    const {
      userId,
      weight,
      bmi,
      measuredAt,
      dataSource,
      notes
    } = req.body;

    // Ensure user can only create logs for themselves (unless doctor/admin)
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only create their own weight logs'
      });
    }

    const weightLog = await WeightLog.create({
      userId: userId || req.user._id,
      weight,
      bmi,
      measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
      dataSource: dataSource || 'manual',
      notes
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'weight_logged',
      entity: 'weightLogs',
      entityId: weightLog._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Weight log created successfully',
      data: {
        weightLog
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update weight log
// @route   PUT /api/weight/:id
// @access  Private
const updateWeightLog = async (req, res) => {
  try {
    const allowedFields = [
      'weight',
      'bmi',
      'measuredAt',
      'notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const weightLog = await WeightLog.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!weightLog) {
      return res.status(404).json({
        success: false,
        message: 'Weight log not found'
      });
    }

    res.json({
      success: true,
      message: 'Weight log updated successfully',
      data: {
        weightLog
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete weight log
// @route   DELETE /api/weight/:id
// @access  Private
const deleteWeightLog = async (req, res) => {
  try {
    const weightLog = await WeightLog.findById(req.params.id);
    
    if (!weightLog) {
      return res.status(404).json({
        success: false,
        message: 'Weight log not found'
      });
    }

    // Check if user can delete this weight log
    if (req.user.role === 'patient' && req.user._id.toString() !== weightLog.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this weight log'
      });
    }

    await WeightLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Weight log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get weight statistics and trends
// @route   GET /api/weight/stats/:userId
// @access  Private
const getWeightStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get weight logs for the period
    const weightLogs = await WeightLog.find({
      userId,
      measuredAt: { $gte: startDate }
    }).sort({ measuredAt: 1 });

    if (weightLogs.length === 0) {
      return res.json({
        success: true,
        data: {
          period: `${days} days`,
          stats: {
            totalLogs: 0,
            currentWeight: null,
            weightChange: 0,
            averageWeight: 0,
            currentBMI: null,
            bmiChange: 0,
            averageBMI: 0,
            trend: 'no_data'
          },
          chartData: []
        }
      });
    }

    // Calculate statistics
    const totalLogs = weightLogs.length;
    const currentWeight = weightLogs[weightLogs.length - 1].weight;
    const initialWeight = weightLogs[0].weight;
    const weightChange = currentWeight - initialWeight;
    const averageWeight = weightLogs.reduce((sum, log) => sum + log.weight, 0) / totalLogs;

    const currentBMI = weightLogs[weightLogs.length - 1].bmi;
    const initialBMI = weightLogs[0].bmi;
    const bmiChange = currentBMI ? (currentBMI - (initialBMI || 0)) : 0;
    const averageBMI = weightLogs.filter(log => log.bmi).reduce((sum, log) => sum + log.bmi, 0) / 
                       weightLogs.filter(log => log.bmi).length || 0;

    // Determine trend
    let trend = 'stable';
    if (weightChange > 1) trend = 'gaining';
    else if (weightChange < -1) trend = 'losing';

    // Prepare chart data
    const chartData = weightLogs.map(log => ({
      date: log.measuredAt,
      weight: log.weight,
      bmi: log.bmi
    }));

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        stats: {
          totalLogs,
          currentWeight: Math.round(currentWeight * 10) / 10,
          weightChange: Math.round(weightChange * 10) / 10,
          averageWeight: Math.round(averageWeight * 10) / 10,
          currentBMI: currentBMI ? Math.round(currentBMI * 10) / 10 : null,
          bmiChange: Math.round(bmiChange * 10) / 10,
          averageBMI: Math.round(averageBMI * 10) / 10,
          trend
        },
        chartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get latest weight log for a user
// @route   GET /api/weight/latest/:userId
// @access  Private
const getLatestWeight = async (req, res) => {
  try {
    const weightLog = await WeightLog.findOne({
      userId: req.params.userId
    }).sort({ measuredAt: -1 });

    if (!weightLog) {
      return res.status(404).json({
        success: false,
        message: 'No weight logs found for this user'
      });
    }

    res.json({
      success: true,
      data: {
        weightLog
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
router.get('/user/:userId', auth, authorizePatientAccess, getUserWeightLogs);
router.get('/stats/:userId', auth, authorizePatientAccess, getWeightStats);
router.get('/latest/:userId', auth, authorizePatientAccess, getLatestWeight);
router.get('/:id', auth, getWeightLog);
router.post('/', auth, createWeightLog);
router.put('/:id', auth, updateWeightLog);
router.delete('/:id', auth, deleteWeightLog);

module.exports = router;