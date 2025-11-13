const mongoose = require('mongoose');

const diseaseProgressionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  
  // Historical KL Grades
  klGradeHistory: [{
    grade: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      required: true
    },
    predictedAt: {
      type: Date,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    predictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIPrediction'
    }
  }],
  
  // Progression Analysis
  progression: {
    currentGrade: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      required: [true, 'Current grade is required']
    },
    rateOfProgression: {
      type: String,
      enum: ['slow', 'moderate', 'rapid'],
      default: 'slow'
    },
    projectedGrade: {
      grade: {
        type: Number,
        enum: [0, 1, 2, 3, 4]
      },
      timeFrame: {
        type: String,
        enum: ['3 months', '6 months', '1 year', '2 years']
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      factors: [{
        type: String,
        enum: ['good adherence', 'poor adherence', 'weight loss', 'weight gain', 'regular exercise', 'sedentary lifestyle', 'age', 'genetics']
      }]
    }
  },
  
  // Risk Factors
  riskFactors: {
    modifiable: [{
      type: String,
      enum: ['weight', 'activity_level', 'diet', 'smoking', 'alcohol']
    }],
    nonModifiable: [{
      type: String,
      enum: ['age', 'genetics', 'gender', 'previous_injury']
    }],
    current: {
      age: {
        type: Number,
        min: 0,
        max: 120
      },
      bmi: {
        type: Number,
        min: 10,
        max: 60
      },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'low', 'moderate', 'high'],
        default: 'moderate'
      },
      adherenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    }
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for progression trend
diseaseProgressionSchema.virtual('progressionTrend').get(function() {
  if (!this.klGradeHistory || this.klGradeHistory.length < 2) return 'insufficient_data';
  
  const history = this.klGradeHistory.sort((a, b) => new Date(a.predictedAt) - new Date(b.predictedAt));
  const first = history[0];
  const last = history[history.length - 1];
  
  if (last.grade > first.grade) return 'worsening';
  if (last.grade < first.grade) return 'improving';
  return 'stable';
});

// Method to add new KL grade to history
diseaseProgressionSchema.methods.addKLGrade = function(grade, confidence, predictionId) {
  this.klGradeHistory.push({
    grade,
    predictedAt: new Date(),
    confidence,
    predictionId
  });
  
  this.progression.currentGrade = grade;
  this.lastUpdated = new Date();
  
  return this.save();
};

// Index for performance
diseaseProgressionSchema.index({ userId: 1 });
diseaseProgressionSchema.index({ 'progression.currentGrade': 1 });

module.exports = mongoose.model('DiseaseProgression', diseaseProgressionSchema);