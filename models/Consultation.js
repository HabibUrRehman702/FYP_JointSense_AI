const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  
  consultationType: {
    type: String,
    enum: ['virtual', 'in_person', 'review'],
    required: [true, 'Consultation type is required']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number,
    min: [15, 'Duration must be at least 15 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes'],
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  
  // Consultation Details
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  reviewedPredictions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIPrediction'
  }],
  updatedRecommendations: {
    type: Boolean,
    default: false
  },
  
  // Clinical Assessment
  clinicalAssessment: {
    painLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    mobilityScore: {
      type: Number,
      min: 0,
      max: 10
    },
    swelling: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe']
    },
    stiffness: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe']
    },
    functionalLimitation: {
      type: String,
      maxlength: [500, 'Functional limitation description cannot exceed 500 characters']
    }
  },
  
  // Prescriptions
  prescriptions: [{
    medicationName: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      maxlength: [300, 'Instructions cannot exceed 300 characters']
    }
  }],
  
  // Follow-up
  nextAppointment: {
    type: Date
  },
  actionItems: [{
    type: String,
    maxlength: [200, 'Action item cannot exceed 200 characters']
  }],
  
  // Meeting Details (for virtual consultations)
  meetingDetails: {
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'google_meet', 'in_app']
    },
    meetingId: {
      type: String
    },
    meetingPassword: {
      type: String
    }
  },
  
  completedAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Virtual for consultation duration in hours
consultationSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Pre-save middleware to set completedAt when status changes to completed
consultationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Index for performance
consultationSchema.index({ doctorId: 1, scheduledAt: 1 });
consultationSchema.index({ patientId: 1, scheduledAt: 1 });
consultationSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);