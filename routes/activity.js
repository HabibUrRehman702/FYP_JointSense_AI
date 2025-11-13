const express = require('express');
const { ActivityLog, AuditLog } = require('../models');
const { auth, authorizePatientAccess } = require('../middleware/auth');
const { getClientIP } = require('../utils/ipUtils');

const router = express.Router();

// @desc    Get all activity logs for a user
// @route   GET /api/activity/user/:userId
// @access  Private
const getUserActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const dataSource = req.query.dataSource;

    let query = { userId: req.params.userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (dataSource) {
      query.dataSource = dataSource;
    }

    const activities = await ActivityLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        activities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single activity log
// @route   GET /api/activity/:id
// @access  Private
const getActivityLog = async (req, res) => {
  try {
    const activity = await ActivityLog.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    res.json({
      success: true,
      data: {
        activity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create activity log
// @route   POST /api/activity
// @access  Private
const createActivityLog = async (req, res) => {
  try {
    const {
      userId,
      date,
      steps,
      distance,
      caloriesBurned,
      activeMinutes,
      kneeBandData,
      targetSteps,
      targetActiveMinutes,
      dataSource
    } = req.body;

    // Ensure user can only create logs for themselves (unless doctor/admin)
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only create their own activity logs'
      });
    }

    // Calculate adherence score
    let adherenceScore = 0;
    const targetStepsValue = targetSteps || 10000;
    const targetActiveMinutesValue = targetActiveMinutes || 60;
    
    const stepScore = Math.min(100, (steps / targetStepsValue) * 100);
    const activeMinutesScore = Math.min(100, (activeMinutes / targetActiveMinutesValue) * 100);
    adherenceScore = Math.round((stepScore + activeMinutesScore) / 2);

    const activity = await ActivityLog.create({
      userId: userId || req.user._id,
      date: date ? new Date(date) : new Date(),
      steps,
      distance,
      caloriesBurned,
      activeMinutes,
      kneeBandData,
      adherenceScore,
      targetSteps: targetStepsValue,
      targetActiveMinutes: targetActiveMinutesValue,
      dataSource: dataSource || 'manual'
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'activity_logged',
      entity: 'activityLogs',
      entityId: activity._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: {
        activity
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update activity log
// @route   PUT /api/activity/:id
// @access  Private
const updateActivityLog = async (req, res) => {
  try {
    const allowedFields = [
      'steps',
      'distance',
      'caloriesBurned',
      'activeMinutes',
      'kneeBandData',
      'targetSteps',
      'targetActiveMinutes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Recalculate adherence score if relevant fields are updated
    if (updates.steps || updates.activeMinutes || updates.targetSteps || updates.targetActiveMinutes) {
      const activity = await ActivityLog.findById(req.params.id);
      if (activity) {
        const steps = updates.steps || activity.steps;
        const activeMinutes = updates.activeMinutes || activity.activeMinutes;
        const targetSteps = updates.targetSteps || activity.targetSteps;
        const targetActiveMinutes = updates.targetActiveMinutes || activity.targetActiveMinutes;
        
        const stepScore = Math.min(100, (steps / targetSteps) * 100);
        const activeMinutesScore = Math.min(100, (activeMinutes / targetActiveMinutes) * 100);
        updates.adherenceScore = Math.round((stepScore + activeMinutesScore) / 2);
      }
    }

    const activity = await ActivityLog.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity log updated successfully',
      data: {
        activity
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete activity log
// @route   DELETE /api/activity/:id
// @access  Private
const deleteActivityLog = async (req, res) => {
  try {
    const activity = await ActivityLog.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    // Check if user can delete this activity log
    if (req.user.role === 'patient' && req.user._id.toString() !== activity.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity log'
      });
    }

    await ActivityLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Activity log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/activity/stats/:userId
// @access  Private
const getActivityStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          averageSteps: { $avg: '$steps' },
          totalSteps: { $sum: '$steps' },
          averageDistance: { $avg: '$distance' },
          totalDistance: { $sum: '$distance' },
          averageCalories: { $avg: '$caloriesBurned' },
          totalCalories: { $sum: '$caloriesBurned' },
          averageActiveMinutes: { $avg: '$activeMinutes' },
          totalActiveMinutes: { $sum: '$activeMinutes' },
          averageAdherenceScore: { $avg: '$adherenceScore' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        stats: stats[0] || {
          totalDays: 0,
          averageSteps: 0,
          totalSteps: 0,
          averageDistance: 0,
          totalDistance: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageActiveMinutes: 0,
          totalActiveMinutes: 0,
          averageAdherenceScore: 0
        }
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
// GET /api/activity - Get current user's activity logs
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = { userId: req.user._id };

    const activityLogs = await ActivityLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      count: activityLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        activityLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/user/:userId', auth, authorizePatientAccess, getUserActivityLogs);
router.get('/stats/:userId', auth, authorizePatientAccess, getActivityStats);
router.get('/:id', auth, getActivityLog);
router.post('/', auth, createActivityLog);
router.put('/:id', auth, updateActivityLog);
router.delete('/:id', auth, deleteActivityLog);

module.exports = router;