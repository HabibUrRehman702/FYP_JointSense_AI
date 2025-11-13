const express = require('express');
const { DietLog, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all diet logs for a user
// @route   GET /api/diet/user/:userId
// @access  Private
const getUserDietLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = { userId: req.params.userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dietLogs = await DietLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await DietLog.countDocuments(query);

    res.json({
      success: true,
      count: dietLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        dietLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single diet log
// @route   GET /api/diet/:id
// @access  Private
const getDietLog = async (req, res) => {
  try {
    const dietLog = await DietLog.findById(req.params.id);
    
    if (!dietLog) {
      return res.status(404).json({
        success: false,
        message: 'Diet log not found'
      });
    }

    res.json({
      success: true,
      data: {
        dietLog
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create diet log
// @route   POST /api/diet
// @access  Private
const createDietLog = async (req, res) => {
  try {
    const {
      userId,
      date,
      meals,
      dietaryScore,
      antiInflammatoryFoods,
      dataSource
    } = req.body;

    // Ensure user can only create logs for themselves (unless doctor/admin)
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only create their own diet logs'
      });
    }

    // Calculate dietary score if not provided
    let calculatedDietaryScore = dietaryScore;
    if (!calculatedDietaryScore && antiInflammatoryFoods && antiInflammatoryFoods.length > 0) {
      // Simple scoring: 10 points per anti-inflammatory food, max 100
      calculatedDietaryScore = Math.min(100, antiInflammatoryFoods.length * 10);
    }

    const dietLog = await DietLog.create({
      userId: userId || req.user._id,
      date: date ? new Date(date) : new Date(),
      meals: meals || [],
      dietaryScore: calculatedDietaryScore || 0,
      antiInflammatoryFoods: antiInflammatoryFoods || [],
      dataSource: dataSource || 'manual'
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'diet_logged',
      entity: 'dietLogs',
      entityId: dietLog._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Diet log created successfully',
      data: {
        dietLog
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update diet log
// @route   PUT /api/diet/:id
// @access  Private
const updateDietLog = async (req, res) => {
  try {
    const allowedFields = [
      'meals',
      'dietaryScore',
      'antiInflammatoryFoods'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const dietLog = await DietLog.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!dietLog) {
      return res.status(404).json({
        success: false,
        message: 'Diet log not found'
      });
    }

    res.json({
      success: true,
      message: 'Diet log updated successfully',
      data: {
        dietLog
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete diet log
// @route   DELETE /api/diet/:id
// @access  Private
const deleteDietLog = async (req, res) => {
  try {
    const dietLog = await DietLog.findById(req.params.id);
    
    if (!dietLog) {
      return res.status(404).json({
        success: false,
        message: 'Diet log not found'
      });
    }

    // Check if user can delete this diet log
    if (req.user.role === 'patient' && req.user._id.toString() !== dietLog.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this diet log'
      });
    }

    await DietLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Diet log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get diet statistics
// @route   GET /api/diet/stats/:userId
// @access  Private
const getDietStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await DietLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          averageCalories: { $avg: '$totalCalories' },
          totalCalories: { $sum: '$totalCalories' },
          averageDietaryScore: { $avg: '$dietaryScore' },
          averageProtein: { $avg: '$totalNutrients.protein' },
          averageCarbs: { $avg: '$totalNutrients.carbs' },
          averageFat: { $avg: '$totalNutrients.fat' },
          averageFiber: { $avg: '$totalNutrients.fiber' },
          averageOmega3: { $avg: '$totalNutrients.omega3' },
          antiInflammatoryFoods: { $push: '$antiInflammatoryFoods' }
        }
      }
    ]);

    // Count unique anti-inflammatory foods
    let uniqueAntiInflammatoryFoods = [];
    if (stats.length > 0 && stats[0].antiInflammatoryFoods) {
      const allFoods = stats[0].antiInflammatoryFoods.flat();
      uniqueAntiInflammatoryFoods = [...new Set(allFoods)];
    }

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        stats: stats[0] || {
          totalLogs: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageDietaryScore: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0,
          averageFiber: 0,
          averageOmega3: 0
        },
        uniqueAntiInflammatoryFoods,
        antiInflammatoryFoodCount: uniqueAntiInflammatoryFoods.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add meal to existing diet log
// @route   POST /api/diet/:id/meals
// @access  Private
const addMealToDietLog = async (req, res) => {
  try {
    const { type, time, foods } = req.body;

    if (!type || !foods || !Array.isArray(foods)) {
      return res.status(400).json({
        success: false,
        message: 'Meal type and foods array are required'
      });
    }

    const dietLog = await DietLog.findById(req.params.id);
    
    if (!dietLog) {
      return res.status(404).json({
        success: false,
        message: 'Diet log not found'
      });
    }

    // Check if user can modify this diet log
    if (req.user.role === 'patient' && req.user._id.toString() !== dietLog.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this diet log'
      });
    }

    const newMeal = {
      type,
      time: time ? new Date(time) : new Date(),
      foods
    };

    dietLog.meals.push(newMeal);
    await dietLog.save();

    res.json({
      success: true,
      message: 'Meal added successfully',
      data: {
        dietLog
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get nutrition summary for date range
// @route   GET /api/diet/nutrition/:userId
// @access  Private
const getNutritionSummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const nutritionData = await DietLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).select('date totalCalories totalNutrients dietaryScore').sort({ date: 1 });

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate
        },
        nutritionData
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
// GET /api/diet - Get current user's diet logs
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = { userId: req.user._id };

    const dietLogs = await DietLog.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await DietLog.countDocuments(query);

    res.json({
      success: true,
      count: dietLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        dietLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/user/:userId', auth, authorizePatientAccess, getUserDietLogs);
router.get('/stats/:userId', auth, authorizePatientAccess, getDietStats);
router.get('/nutrition/:userId', auth, authorizePatientAccess, getNutritionSummary);
router.get('/:id', auth, getDietLog);
router.post('/', auth, createDietLog);
router.post('/:id/meals', auth, addMealToDietLog);
router.put('/:id', auth, updateDietLog);
router.delete('/:id', auth, deleteDietLog);

module.exports = router;