const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  klGrade: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    required: [true, 'KL Grade is required']
  },
  
  // Generated Recommendations
  recommendations: {
    activity: [{
      type: {
        type: String,
        enum: ['daily_steps', 'low_impact_exercise', 'strength_training', 'flexibility'],
        required: true
      },
      target: {
        type: String,
        required: [true, 'Target is required']
      },
      description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    diet: [{
      type: {
        type: String,
        enum: ['anti_inflammatory', 'weight_management', 'supplement', 'hydration'],
        required: true
      },
      description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    medication: [{
      type: {
        type: String,
        enum: ['supplement', 'pain_relief', 'anti_inflammatory'],
        required: true
      },
      name: {
        type: String,
        required: [true, 'Medication name is required']
      },
      dosage: {
        type: String,
        required: [true, 'Dosage is required']
      },
      frequency: {
        type: String,
        required: [true, 'Frequency is required']
      }
    }],
    reminders: [{
      type: {
        type: String,
        enum: ['posture_check', 'exercise_reminder', 'medication_reminder', 'hydration'],
        required: true
      },
      frequency: {
        type: String,
        required: [true, 'Frequency is required']
      },
      message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [200, 'Message cannot exceed 200 characters']
      }
    }]
  },
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  basedOn: [{
    type: String,
    enum: ['klGrade', 'bmi', 'activityLevel', 'age', 'medicalHistory']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
recommendationSchema.index({ userId: 1, isActive: 1 });
recommendationSchema.index({ klGrade: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);