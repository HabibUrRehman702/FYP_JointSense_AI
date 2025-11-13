const mongoose = require('mongoose');

const doctorPatientRelationSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    validate: {
      validator: async function(v) {
        const User = mongoose.model('User');
        const doctor = await User.findById(v);
        return doctor && doctor.role === 'doctor';
      },
      message: 'Referenced user must be a doctor'
    }
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required'],
    validate: {
      validator: async function(v) {
        const User = mongoose.model('User');
        const patient = await User.findById(v);
        return patient && patient.role === 'patient';
      },
      message: 'Referenced user must be a patient'
    }
  },
  relationshipType: {
    type: String,
    enum: ['primary_care', 'specialist', 'consultant'],
    default: 'primary_care'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    viewPredictions: {
      type: Boolean,
      default: true
    },
    viewActivityData: {
      type: Boolean,
      default: true
    },
    modifyRecommendations: {
      type: Boolean,
      default: true
    },
    prescribeMedications: {
      type: Boolean,
      default: true
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure one active relationship per doctor-patient pair
doctorPatientRelationSchema.index({ doctorId: 1, patientId: 1, isActive: 1 }, { unique: true });

// Index for performance
doctorPatientRelationSchema.index({ doctorId: 1, isActive: 1 });
doctorPatientRelationSchema.index({ patientId: 1, isActive: 1 });

module.exports = mongoose.model('DoctorPatientRelation', doctorPatientRelationSchema);