const express = require('express');
const mongoose = require('mongoose');
const { AIPrediction, XRayImage, DiseaseProgression, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Predictions
 *   description: AI prediction management endpoints for KL grading
 */

/**
 * @swagger
 * /api/predictions/user/{userId}:
 *   get:
 *     summary: Get all AI predictions for a specific user
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: klGrade
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 4
 *       - in: query
 *         name: oaStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of predictions for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     predictions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AIPrediction'
 */
// GET /api/predictions/user/:userId - Get all AI predictions for a user
const getUserPredictions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const klGrade = req.query.klGrade;
    const oaStatus = req.query.oaStatus;

    let query = { userId: req.params.userId };
    
    if (klGrade) {
      query.klGrade = parseInt(klGrade);
    }
    
    if (oaStatus) {
      query.oaStatus = oaStatus;
    }

    const predictions = await AIPrediction.find(query)
      .populate('xrayImageId', 'fileName uploadedAt')
      .populate('reviewedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ predictedAt: -1 });

    const total = await AIPrediction.countDocuments(query);

    res.json({
      success: true,
      count: predictions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        predictions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/predictions/:id - Get single AI prediction
const getPrediction = async (req, res) => {
  try {
    const prediction = await AIPrediction.findById(req.params.id)
      .populate('xrayImageId')
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName');
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // return the found prediction
    return res.json({
      success: true,
      data: {
        prediction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createPrediction = async (req, res) => {
  try {
    const {
      xrayImageId,
      userId,
      oaStatus,
      klGrade,
      confidence,
      riskScore,
      analysis,
      modelInfo,
      gradCamUrl,
      explanation
    } = req.body;

    // Verify X-ray image exists
    const xrayImage = await XRayImage.findById(xrayImageId);
    if (!xrayImage) {
      return res.status(404).json({
        success: false,
        message: 'X-ray image not found'
      });
    }

    const prediction = await AIPrediction.create({
      xrayImageId,
      userId,
      oaStatus,
      klGrade,
      confidence,
      riskScore,
      analysis,
      modelInfo,
      gradCamUrl,
      explanation
    });

    // Update X-ray processing status
    await XRayImage.findByIdAndUpdate(xrayImageId, {
      processingStatus: 'completed',
      isProcessed: true
    });

    // Update disease progression
    let diseaseProgression = await DiseaseProgression.findOne({ userId });
    if (diseaseProgression) {
      await diseaseProgression.addKLGrade(klGrade, confidence, prediction._id);
    } else {
      // Create new disease progression record
      await DiseaseProgression.create({
        userId,
        klGradeHistory: [{
          grade: klGrade,
          predictedAt: new Date(),
          confidence,
          predictionId: prediction._id
        }],
        progression: {
          currentGrade: klGrade,
          rateOfProgression: 'slow'
        }
      });
    }

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'ai_prediction_generated',
      entity: 'aiPredictions',
      entityId: prediction._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'AI prediction created successfully',
      data: {
        prediction
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update prediction (Review by doctor)
// @route   PUT /api/predictions/:id
// @access  Private/Doctor
const updatePrediction = async (req, res) => {
  try {
    const allowedFields = [
      'reviewNotes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Add review information
    updates.reviewedBy = req.user._id;
    updates.reviewedAt = new Date();

    const prediction = await AIPrediction.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('reviewedBy', 'firstName lastName');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      message: 'Prediction reviewed successfully',
      data: {
        prediction
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete prediction
// @route   DELETE /api/predictions/:id
// @access  Private/Admin
const deletePrediction = async (req, res) => {
  try {
    const prediction = await AIPrediction.findById(req.params.id);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    await AIPrediction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get prediction statistics
// @route   GET /api/predictions/stats/:userId
// @access  Private
const getPredictionStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    const stats = await AIPrediction.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          averageRiskScore: { $avg: '$riskScore' },
          averageConfidence: { $avg: '$confidence' },
          klGradeDistribution: {
            $push: '$klGrade'
          },
          oaStatusDistribution: {
            $push: '$oaStatus'
          }
        }
      }
    ]);

    const klGradeCounts = {};
    const oaStatusCounts = {};

    if (stats.length > 0) {
      stats[0].klGradeDistribution.forEach(grade => {
        klGradeCounts[grade] = (klGradeCounts[grade] || 0) + 1;
      });

      stats[0].oaStatusDistribution.forEach(status => {
        oaStatusCounts[status] = (oaStatusCounts[status] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalPredictions: 0,
          averageRiskScore: 0,
          averageConfidence: 0
        },
        klGradeDistribution: klGradeCounts,
        oaStatusDistribution: oaStatusCounts
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
router.get('/user/:userId', auth, authorizePatientAccess, getUserPredictions);
router.get('/stats/:userId', auth, authorizePatientAccess, getPredictionStats);
router.get('/:id', auth, getPrediction);
router.post('/', auth, authorize('doctor', 'admin'), createPrediction);
router.put('/:id', auth, authorize('doctor', 'admin'), updatePrediction);
router.delete('/:id', auth, authorize('admin'), deletePrediction);

module.exports = router;