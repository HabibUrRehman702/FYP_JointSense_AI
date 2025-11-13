const express = require('express');
const { ProgressReport, DiseaseProgression, AuditLog } = require('../models');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all progress reports for a user
// @route   GET /api/progress/reports/:userId
// @access  Private
const getUserProgressReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const reportType = req.query.reportType;

    let query = { userId: req.params.userId };
    
    if (reportType) {
      query.reportType = reportType;
    }

    const reports = await ProgressReport.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ generatedAt: -1 });

    const total = await ProgressReport.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        reports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single progress report
// @route   GET /api/progress/reports/:id
// @access  Private
const getProgressReport = async (req, res) => {
  try {
    const report = await ProgressReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    res.json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate progress report
// @route   POST /api/progress/reports/generate
// @access  Private/Doctor/Admin
const generateProgressReport = async (req, res) => {
  try {
    const {
      userId,
      reportType,
      startDate,
      endDate
    } = req.body;

    if (!userId || !reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, report type, start date, and end date are required'
      });
    }

    // Here you would implement the logic to generate progress metrics
    // For now, we'll create a basic structure
    const report = await ProgressReport.create({
      userId,
      reportType,
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      metrics: {
        adherenceScore: {
          average: 75,
          trend: 'improving'
        },
        activityLevel: {
          averageSteps: 7500,
          activeMinutes: 45,
          improvement: '+12%'
        },
        weightManagement: {
          weightChange: -1.5,
          bmiChange: -0.5,
          trend: 'losing'
        },
        symptomReduction: {
          painScore: 5,
          mobilityScore: 7,
          improvementPercentage: 15
        }
      },
      insights: {
        achievements: [
          'Consistent daily exercise routine',
          'Improved medication adherence'
        ],
        concerns: [
          'Occasional missed meals'
        ],
        recommendations: [
          'Continue current exercise routine',
          'Consider meal planning for consistency'
        ]
      },
      generatedBy: 'ai_system'
    });

    res.status(201).json({
      success: true,
      message: 'Progress report generated successfully',
      data: {
        report
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete progress report
// @route   DELETE /api/progress/reports/:id
// @access  Private/Admin
const deleteProgressReport = async (req, res) => {
  try {
    const report = await ProgressReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    await ProgressReport.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Progress report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get disease progression for a user
// @route   GET /api/progress/progression/:userId
// @access  Private
const getDiseaseProgression = async (req, res) => {
  try {
    const progression = await DiseaseProgression.findOne({
      userId: req.params.userId
    }).populate('klGradeHistory.predictionId', 'predictedAt confidence');
    
    if (!progression) {
      return res.status(404).json({
        success: false,
        message: 'Disease progression data not found'
      });
    }

    res.json({
      success: true,
      data: {
        progression
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update disease progression
// @route   PUT /api/progress/progression/:userId
// @access  Private/Doctor/Admin
const updateDiseaseProgression = async (req, res) => {
  try {
    const allowedFields = [
      'progression',
      'riskFactors'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.lastUpdated = new Date();

    const progression = await DiseaseProgression.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      {
        new: true,
        runValidators: true,
        upsert: true
      }
    );

    res.json({
      success: true,
      message: 'Disease progression updated successfully',
      data: {
        progression
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete disease progression
// @route   DELETE /api/progress/progression/:userId
// @access  Private/Admin
const deleteDiseaseProgression = async (req, res) => {
  try {
    const progression = await DiseaseProgression.findOne({ userId: req.params.userId });
    
    if (!progression) {
      return res.status(404).json({
        success: false,
        message: 'Disease progression not found'
      });
    }

    await DiseaseProgression.findOneAndDelete({ userId: req.params.userId });

    res.json({
      success: true,
      message: 'Disease progression deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get progression analytics
// @route   GET /api/progress/analytics/:userId
// @access  Private
const getProgressionAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get disease progression
    const progression = await DiseaseProgression.findOne({ userId });
    
    if (!progression) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          message: 'No progression data available'
        }
      });
    }

    // Calculate progression rate
    const history = progression.klGradeHistory.sort((a, b) => 
      new Date(a.predictedAt) - new Date(b.predictedAt)
    );

    let progressionRate = 'stable';
    let riskLevel = 'low';

    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const timeDiff = new Date(last.predictedAt) - new Date(first.predictedAt);
      const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30);
      const gradeChange = last.grade - first.grade;

      if (gradeChange > 0 && monthsDiff > 0) {
        const ratePerYear = (gradeChange / monthsDiff) * 12;
        if (ratePerYear > 1) progressionRate = 'rapid';
        else if (ratePerYear > 0.5) progressionRate = 'moderate';
        else progressionRate = 'slow';
      }

      // Determine risk level
      if (progression.progression.currentGrade >= 3) riskLevel = 'high';
      else if (progression.progression.currentGrade >= 2) riskLevel = 'medium';
    }

    const analytics = {
      hasData: true,
      currentGrade: progression.progression.currentGrade,
      progressionRate,
      riskLevel,
      totalPredictions: history.length,
      timespan: history.length >= 2 ? {
        start: history[0].predictedAt,
        end: history[history.length - 1].predictedAt
      } : null,
      trend: progression.progressionTrend,
      projectedGrade: progression.progression.projectedGrade,
      riskFactors: progression.riskFactors
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
// GET /api/progress - Get progress reports for current user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = {};
    
    // Patients see their own reports
    if (req.user.role === 'patient') {
      query.userId = req.user._id;
    }
    // Doctors see reports they created
    else if (req.user.role === 'doctor') {
      query.generatedBy = req.user._id;
    }
    // Admins see all reports

    const reports = await ProgressReport.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('generatedBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ generatedDate: -1 });

    const total = await ProgressReport.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        reports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reports/:userId', auth, authorizePatientAccess, getUserProgressReports);
router.get('/reports/single/:id', auth, getProgressReport);
router.get('/progression/:userId', auth, authorizePatientAccess, getDiseaseProgression);
router.get('/analytics/:userId', auth, authorizePatientAccess, getProgressionAnalytics);
router.post('/reports/generate', auth, authorize('doctor', 'admin'), generateProgressReport);
router.put('/progression/:userId', auth, authorize('doctor', 'admin'), updateDiseaseProgression);
router.delete('/reports/:id', auth, authorize('admin'), deleteProgressReport);
router.delete('/progression/:userId', auth, authorize('admin'), deleteDiseaseProgression);

module.exports = router;