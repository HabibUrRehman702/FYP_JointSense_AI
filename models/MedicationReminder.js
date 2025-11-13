const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  medicationName: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'twice_daily', 'thrice_daily', 'weekly', 'as_needed'],
    required: [true, 'Frequency is required']
  },
  timeSlots: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time slot must be in HH:MM format'
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
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
  adherenceLog: [{
    date: {
      type: Date,
      required: true
    },
    taken: {
      type: Boolean,
      required: true
    },
    time: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for adherence percentage
medicationReminderSchema.virtual('adherencePercentage').get(function() {
  if (!this.adherenceLog || this.adherenceLog.length === 0) return 0;
  
  const takenCount = this.adherenceLog.filter(log => log.taken).length;
  return Math.round((takenCount / this.adherenceLog.length) * 100);
});

// Index for performance
medicationReminderSchema.index({ userId: 1, isActive: 1 });
medicationReminderSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);