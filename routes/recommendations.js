const express = require('express');
const { Recommendation, AuditLog, KLGrade } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all recommendations for a user
// @route   GET /api/recommendations/user/:userId
// @access  Private
const getUserRecommendations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const klGrade = req.query.klGrade;
    const isActive = req.query.isActive;

    let query = { userId: req.params.userId };
    
    if (klGrade) {
      query.klGrade = parseInt(klGrade);
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const recommendations = await Recommendation.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ generatedAt: -1 });

    const total = await Recommendation.countDocuments(query);

    res.json({
      success: true,
      count: recommendations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single recommendation
// @route   GET /api/recommendations/:id
// @access  Private
const getRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      data: {
        recommendation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create recommendation
// @route   POST /api/recommendations
// @access  Private/Doctor/Admin
const createRecommendation = async (req, res) => {
  try {
    const {
      userId,
      klGrade,
      recommendations,
      basedOn
    } = req.body;

    // Get KL grade details for reference
    const klGradeInfo = await KLGrade.findOne({ grade: klGrade });

    const recommendation = await Recommendation.create({
      userId,
      klGrade,
      recommendations,
      basedOn: basedOn || ['klGrade']
    });

    // Deactivate previous recommendations for the same user
    await Recommendation.updateMany(
      { userId, _id: { $ne: recommendation._id } },
      { isActive: false }
    );

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'recommendation_created',
      entity: 'recommendations',
      entityId: recommendation._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Recommendation created successfully',
      data: {
        recommendation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update recommendation
// @route   PUT /api/recommendations/:id
// @access  Private/Doctor/Admin
const updateRecommendation = async (req, res) => {
  try {
    const allowedFields = [
      'recommendations',
      'basedOn',
      'isActive'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'recommendation_updated',
      entity: 'recommendations',
      entityId: recommendation._id,
      changes: updates,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Recommendation updated successfully',
      data: {
        recommendation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete recommendation
// @route   DELETE /api/recommendations/:id
// @access  Private/Doctor/Admin
const deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    await Recommendation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Recommendation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active recommendations for a user
// @route   GET /api/recommendations/active/:userId
// @access  Private
const getActiveRecommendations = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      userId: req.params.userId,
      isActive: true
    }).sort({ generatedAt: -1 });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'No active recommendations found'
      });
    }

    res.json({
      success: true,
      data: {
        recommendation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate AI-based recommendations based on KL grade
// @route   POST /api/recommendations/generate
// @access  Private/Doctor/Admin
const generateRecommendations = async (req, res) => {
  try {
    const { userId, klGrade } = req.body;

    if (!userId || klGrade === undefined) {
      return res.status(400).json({
        success: false,
        message: 'User ID and KL grade are required'
      });
    }

    // Get KL grade information
    const klGradeInfo = await KLGrade.findOne({ grade: klGrade });
    if (!klGradeInfo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KL grade'
      });
    }

    // Define rule-based recommendations based on KL grade
    const recommendationTemplates = {
      0: {
        activity: [
          { type: 'daily_steps', target: '10000-12000 steps', description: 'Maintain high activity level for joint health', priority: 'medium' },
          { type: 'low_impact_exercise', target: '45 minutes, 4-5 times/week', description: 'Regular cardio exercises like swimming or cycling', priority: 'high' }
        ],
        diet: [
          { type: 'anti_inflammatory', description: 'Include omega-3 rich foods and antioxidants', priority: 'medium' },
          { type: 'weight_management', description: 'Maintain healthy BMI (18.5-24.9)', priority: 'high' }
        ],
        reminders: [
          { type: 'posture_check', frequency: 'every 3 hours', message: 'Check your posture and do gentle stretches' }
        ]
      },
      1: {
        activity: [
          { type: 'daily_steps', target: '8000-10000 steps', description: 'Moderate activity to maintain joint mobility', priority: 'high' },
          { type: 'low_impact_exercise', target: '30 minutes, 4 times/week', description: 'Swimming, cycling, or walking', priority: 'high' },
          { type: 'flexibility', target: '15 minutes daily', description: 'Gentle stretching and range of motion exercises', priority: 'medium' }
        ],
        diet: [
          { type: 'anti_inflammatory', description: 'Focus on omega-3 fatty acids, turmeric, and green tea', priority: 'high' },
          { type: 'weight_management', description: 'Maintain or reduce weight to decrease joint stress', priority: 'high' }
        ],
        medication: [
          { type: 'supplement', name: 'Glucosamine + Chondroitin', dosage: '1500mg + 1200mg', frequency: 'daily with meals' }
        ],
        reminders: [
          { type: 'exercise_reminder', frequency: 'daily', message: 'Time for your gentle exercise routine' }
        ]
      },
      2: {
        activity: [
          { type: 'daily_steps', target: '6000-8000 steps', description: 'Moderate activity with rest periods', priority: 'high' },
          { type: 'low_impact_exercise', target: '25 minutes, 3-4 times/week', description: 'Water exercises and stationary cycling', priority: 'high' },
          { type: 'strength_training', target: '2 times/week', description: 'Light resistance exercises for muscle support', priority: 'medium' }
        ],
        diet: [
          { type: 'anti_inflammatory', description: 'Mediterranean diet with emphasis on anti-inflammatory foods', priority: 'high' },
          { type: 'weight_management', description: 'Weight loss if overweight (reduce by 5-10%)', priority: 'high' }
        ],
        medication: [
          { type: 'supplement', name: 'Glucosamine + Chondroitin', dosage: '1500mg + 1200mg', frequency: 'daily with meals' },
          { type: 'supplement', name: 'Omega-3', dosage: '1000mg', frequency: 'twice daily' }
        ],
        reminders: [
          { type: 'medication_reminder', frequency: 'twice daily', message: 'Time for your joint supplements' }
        ]
      },
      3: {
        activity: [
          { type: 'daily_steps', target: '4000-6000 steps', description: 'Gentle activity with frequent rest', priority: 'high' },
          { type: 'low_impact_exercise', target: '20 minutes, 3 times/week', description: 'Chair exercises and water therapy', priority: 'high' },
          { type: 'flexibility', target: '10 minutes, twice daily', description: 'Gentle range of motion exercises', priority: 'high' }
        ],
        diet: [
          { type: 'anti_inflammatory', description: 'Strict anti-inflammatory diet with medical supervision', priority: 'high' },
          { type: 'weight_management', description: 'Significant weight loss under medical guidance', priority: 'high' }
        ],
        medication: [
          { type: 'supplement', name: 'Glucosamine + Chondroitin', dosage: '1500mg + 1200mg', frequency: 'daily with meals' },
          { type: 'anti_inflammatory', name: 'Turmeric extract', dosage: '500mg', frequency: 'twice daily' }
        ],
        reminders: [
          { type: 'posture_check', frequency: 'every 2 hours', message: 'Change position and do gentle stretches' }
        ]
      },
      4: {
        activity: [
          { type: 'daily_steps', target: '2000-4000 steps', description: 'Very gentle activity as tolerated', priority: 'medium' },
          { type: 'low_impact_exercise', target: '15 minutes, 2-3 times/week', description: 'Seated exercises and assisted movement', priority: 'high' },
          { type: 'flexibility', target: '5-10 minutes, multiple times daily', description: 'Pain-free range of motion', priority: 'high' }
        ],
        diet: [
          { type: 'anti_inflammatory', description: 'Comprehensive anti-inflammatory nutrition plan', priority: 'high' },
          { type: 'weight_management', description: 'Medical weight management program', priority: 'high' }
        ],
        medication: [
          { type: 'supplement', name: 'Comprehensive joint formula', dosage: 'As prescribed', frequency: 'daily' }
        ],
        reminders: [
          { type: 'medication_reminder', frequency: 'as needed', message: 'Take medication as prescribed by doctor' }
        ]
      }
    };

    const template = recommendationTemplates[klGrade];
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'No recommendations available for this KL grade'
      });
    }

    // Create the recommendation
    const recommendation = await Recommendation.create({
      userId,
      klGrade,
      recommendations: template,
      basedOn: ['klGrade', 'medical_guidelines'],
      generatedAt: new Date(),
      isActive: true
    });

    // Deactivate previous recommendations
    await Recommendation.updateMany(
      { userId, _id: { $ne: recommendation._id } },
      { isActive: false }
    );

    res.status(201).json({
      success: true,
      message: 'Recommendations generated successfully',
      data: {
        recommendation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
// GET /api/recommendations - Get current user's recommendations
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const klGrade = req.query.klGrade;
    const isActive = req.query.isActive;

    let query = { userId: req.user._id };
    
    if (klGrade) {
      query.klGrade = parseInt(klGrade);
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const recommendations = await Recommendation.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ generatedAt: -1 });

    const total = await Recommendation.countDocuments(query);

    res.json({
      success: true,
      count: recommendations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/user/:userId', auth, authorizePatientAccess, getUserRecommendations);
router.get('/active/:userId', auth, authorizePatientAccess, getActiveRecommendations);
router.get('/:id', auth, getRecommendation);
router.post('/', auth, authorize('doctor', 'admin'), createRecommendation);
router.post('/generate', auth, authorize('doctor', 'admin'), generateRecommendations);
router.put('/:id', auth, authorize('doctor', 'admin'), updateRecommendation);
router.delete('/:id', auth, authorize('doctor', 'admin'), deleteRecommendation);

module.exports = router;