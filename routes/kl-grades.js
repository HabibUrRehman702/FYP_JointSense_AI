const express = require('express');
const router = express.Router();
const { KLGrade } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// @desc    Get all KL grades (reference data)
// @route   GET /api/kl-grades
// @access  Public
router.get('/', async (req, res) => {
  try {
    const klGrades = await KLGrade.find().sort({ grade: 1 });

    res.json({
      success: true,
      data: klGrades
    });
  } catch (error) {
    console.error('Error getting KL grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving KL grades'
    });
  }
});

// @desc    Get single KL grade by grade number
// @route   GET /api/kl-grades/:grade
// @access  Public
router.get('/:grade', async (req, res) => {
  try {
    const { grade } = req.params;

    // Validate grade is a number between 0-4
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a number between 0 and 4'
      });
    }

    const klGrade = await KLGrade.findOne({ grade: gradeNum });

    if (!klGrade) {
      return res.status(404).json({
        success: false,
        message: 'KL grade not found'
      });
    }

    res.json({
      success: true,
      data: klGrade
    });
  } catch (error) {
    console.error('Error getting KL grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving KL grade'
    });
  }
});

// @desc    Create new KL grade (Admin only)
// @route   POST /api/kl-grades
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { grade, description, severity, recommendations } = req.body;

    // Validate grade
    if (grade < 0 || grade > 4) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be between 0 and 4'
      });
    }

    // Check if grade already exists
    const existingGrade = await KLGrade.findOne({ grade });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: 'KL grade already exists'
      });
    }

    const klGrade = new KLGrade({
      grade,
      description,
      severity,
      recommendations: recommendations || []
    });

    await klGrade.save();

    res.status(201).json({
      success: true,
      data: klGrade
    });
  } catch (error) {
    console.error('Error creating KL grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating KL grade'
    });
  }
});

// @desc    Update KL grade (Admin only)
// @route   PUT /api/kl-grades/:grade
// @access  Private (Admin)
router.put('/:grade', auth, authorize('admin'), async (req, res) => {
  try {
    const { grade } = req.params;
    const { description, severity, recommendations } = req.body;

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a number between 0 and 4'
      });
    }

    const klGrade = await KLGrade.findOne({ grade: gradeNum });

    if (!klGrade) {
      return res.status(404).json({
        success: false,
        message: 'KL grade not found'
      });
    }

    // Update fields
    if (description) klGrade.description = description;
    if (severity) klGrade.severity = severity;
    if (recommendations) klGrade.recommendations = recommendations;

    await klGrade.save();

    res.json({
      success: true,
      data: klGrade
    });
  } catch (error) {
    console.error('Error updating KL grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KL grade'
    });
  }
});

// @desc    Delete KL grade (Admin only)
// @route   DELETE /api/kl-grades/:grade
// @access  Private (Admin)
router.delete('/:grade', auth, authorize('admin'), async (req, res) => {
  try {
    const { grade } = req.params;

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a number between 0 and 4'
      });
    }

    const klGrade = await KLGrade.findOne({ grade: gradeNum });

    if (!klGrade) {
      return res.status(404).json({
        success: false,
        message: 'KL grade not found'
      });
    }

    await KLGrade.deleteOne({ grade: gradeNum });

    res.json({
      success: true,
      message: 'KL grade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting KL grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting KL grade'
    });
  }
});

// @desc    Initialize default KL grades (Setup endpoint)
// @route   POST /api/kl-grades/initialize
// @access  Private (Admin)
router.post('/initialize', auth, authorize('admin'), async (req, res) => {
  try {
    // Check if KL grades already exist
    const existingGrades = await KLGrade.countDocuments();
    if (existingGrades > 0) {
      return res.status(400).json({
        success: false,
        message: 'KL grades already initialized'
      });
    }

    // Default KL grades data
    const defaultGrades = [
      {
        grade: 0,
        description: 'No radiographic features of OA',
        severity: 'Normal',
        recommendations: ['Maintain healthy lifestyle', 'Regular exercise', 'Balanced diet']
      },
      {
        grade: 1,
        description: 'Doubtful narrowing of joint space and possible osteophytic lipping',
        severity: 'Mild',
        recommendations: ['Low-impact exercises', 'Weight management', 'Joint supplements', 'Regular monitoring']
      },
      {
        grade: 2,
        description: 'Definite osteophytes and possible narrowing of joint space',
        severity: 'Moderate',
        recommendations: ['Physical therapy', 'Anti-inflammatory diet', 'Strength training', 'Pain management']
      },
      {
        grade: 3,
        description: 'Moderate multiple osteophytes, definite narrowing of joint space, some sclerosis and possible deformity of bone ends',
        severity: 'Severe',
        recommendations: ['Supervised exercise', 'Pain management', 'Medical consultation', 'Activity modification']
      },
      {
        grade: 4,
        description: 'Large osteophytes, marked narrowing of joint space, severe sclerosis and definite deformity of bone ends',
        severity: 'Very Severe',
        recommendations: ['Surgical consultation', 'Intensive therapy', 'Mobility aids', 'Comprehensive pain management']
      }
    ];

    await KLGrade.insertMany(defaultGrades);

    const createdGrades = await KLGrade.find().sort({ grade: 1 });

    res.status(201).json({
      success: true,
      message: 'KL grades initialized successfully',
      data: createdGrades
    });
  } catch (error) {
    console.error('Error initializing KL grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing KL grades'
    });
  }
});

// @desc    Get recommendations for a specific KL grade
// @route   GET /api/kl-grades/:grade/recommendations
// @access  Public
router.get('/:grade/recommendations', async (req, res) => {
  try {
    const { grade } = req.params;

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a number between 0 and 4'
      });
    }

    const klGrade = await KLGrade.findOne({ grade: gradeNum });

    if (!klGrade) {
      return res.status(404).json({
        success: false,
        message: 'KL grade not found'
      });
    }

    res.json({
      success: true,
      data: {
        grade: klGrade.grade,
        severity: klGrade.severity,
        recommendations: klGrade.recommendations
      }
    });
  } catch (error) {
    console.error('Error getting KL grade recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving KL grade recommendations'
    });
  }
});

module.exports = router;