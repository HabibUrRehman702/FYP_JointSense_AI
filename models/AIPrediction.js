const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  xrayImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'XRayImage',
    required: [true, 'X-ray image ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Primary Prediction Results
  oaStatus: {
    type: String,
    enum: ['OA', 'No_OA'],
    required: [true, 'OA status is required']
  },
  klGrade: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    required: [true, 'KL Grade is required']
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: [true, 'Confidence score is required']
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Risk score is required']
  },
  
  // Detailed Analysis
  analysis: {
    jointSpaceNarrowing: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      required: true
    },
    osteophytes: {
      type: String,
      enum: ['absent', 'present', 'multiple'],
      required: true
    },
    sclerosis: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      required: true
    },
    boneDeformity: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      required: true
    }
  },
  
  // AI Model Information
  modelInfo: {
    version: {
      type: String,
      required: true
    },
    algorithm: {
      type: String,
      required: true
    },
    trainedOn: {
      type: String,
      required: true
    }
  },
  
  // Visual Explanations
  gradCamUrl: {
    type: String,
    required: [true, 'Grad-CAM URL is required']
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    maxlength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  
  predictedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Virtual for severity description
aiPredictionSchema.virtual('severityDescription').get(function() {
  const descriptions = {
    0: 'Normal',
    1: 'Mild',
    2: 'Moderate',
    3: 'Severe',
    4: 'Very Severe'
  };
  return descriptions[this.klGrade];
});

// Index for performance
aiPredictionSchema.index({ userId: 1, predictedAt: -1 });
aiPredictionSchema.index({ klGrade: 1 });
aiPredictionSchema.index({ xrayImageId: 1 });

module.exports = mongoose.model('AIPrediction', aiPredictionSchema);