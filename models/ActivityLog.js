const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  
  // Step and Movement Data
  steps: {
    type: Number,
    min: 0,
    default: 0
  },
  distance: {
    type: Number,
    min: 0,
    default: 0
  },
  caloriesBurned: {
    type: Number,
    min: 0,
    default: 0
  },
  activeMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Knee Band Sensor Data
  kneeBandData: {
    flexionExtension: {
      totalFlexions: {
        type: Number,
        min: 0,
        default: 0
      },
      averageAngle: {
        type: Number,
        min: 0,
        max: 180
      },
      maxAngle: {
        type: Number,
        min: 0,
        max: 180
      },
      minAngle: {
        type: Number,
        min: 0,
        max: 180
      }
    },
    loadPressure: {
      averageLoad: {
        type: Number,
        min: 0
      },
      maxLoad: {
        type: Number,
        min: 0
      },
      loadDistribution: {
        type: String,
        enum: ['even', 'uneven', 'left-heavy', 'right-heavy']
      }
    },
    temperature: {
      averageTemp: {
        type: Number,
        min: 30,
        max: 45
      },
      maxTemp: {
        type: Number,
        min: 30,
        max: 45
      },
      inflammationDetected: {
        type: Boolean,
        default: false
      }
    },
    pulseData: {
      averageHeartRate: {
        type: Number,
        min: 40,
        max: 200
      },
      maxHeartRate: {
        type: Number,
        min: 40,
        max: 200
      },
      restingHeartRate: {
        type: Number,
        min: 40,
        max: 120
      }
    }
  },
  
  // Adherence Scoring
  adherenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  targetSteps: {
    type: Number,
    min: 0,
    default: 10000
  },
  targetActiveMinutes: {
    type: Number,
    min: 0,
    default: 60
  },
  
  syncedAt: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    enum: ['knee_band', 'mobile_app', 'manual'],
    default: 'mobile_app'
  }
}, {
  timestamps: true
});

// Virtual for BMI if height is available
activityLogSchema.virtual('stepGoalAchievement').get(function() {
  if (!this.targetSteps || this.targetSteps === 0) return 0;
  return Math.min(100, (this.steps / this.targetSteps) * 100);
});

// Index for performance
activityLogSchema.index({ userId: 1, date: -1 });
activityLogSchema.index({ dataSource: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);