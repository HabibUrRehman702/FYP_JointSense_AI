const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  reportType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: [true, 'Report type is required']
  },
  period: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(v) {
          return v > this.period.startDate;
        },
        message: 'End date must be after start date'
      }
    }
  },
  
  // Progress Metrics
  metrics: {
    adherenceScore: {
      average: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      trend: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
        default: 'stable'
      }
    },
    activityLevel: {
      averageSteps: {
        type: Number,
        min: 0,
        default: 0
      },
      activeMinutes: {
        type: Number,
        min: 0,
        default: 0
      },
      improvement: {
        type: String,
        default: '0%'
      }
    },
    weightManagement: {
      weightChange: {
        type: Number,
        default: 0
      },
      bmiChange: {
        type: Number,
        default: 0
      },
      trend: {
        type: String,
        enum: ['losing', 'stable', 'gaining'],
        default: 'stable'
      }
    },
    symptomReduction: {
      painScore: {
        type: Number,
        min: 1,
        max: 10
      },
      mobilityScore: {
        type: Number,
        min: 1,
        max: 10
      },
      improvementPercentage: {
        type: Number,
        min: -100,
        max: 100,
        default: 0
      }
    }
  },
  
  // AI-Generated Insights
  insights: {
    achievements: [{
      type: String,
      maxlength: [200, 'Achievement cannot exceed 200 characters']
    }],
    concerns: [{
      type: String,
      maxlength: [200, 'Concern cannot exceed 200 characters']
    }],
    recommendations: [{
      type: String,
      maxlength: [300, 'Recommendation cannot exceed 300 characters']
    }]
  },
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  reportUrl: {
    type: String
  },
  generatedBy: {
    type: String,
    enum: ['ai_system', 'doctor', 'manual'],
    default: 'ai_system'
  }
}, {
  timestamps: true
});

// Index for performance
progressReportSchema.index({ userId: 1, generatedAt: -1 });
progressReportSchema.index({ reportType: 1 });

module.exports = mongoose.model('ProgressReport', progressReportSchema);