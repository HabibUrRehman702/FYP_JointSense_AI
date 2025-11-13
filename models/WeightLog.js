const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [20, 'Weight must be at least 20 kg'],
    max: [300, 'Weight cannot exceed 300 kg']
  },
  bmi: {
    type: Number,
    min: [10, 'BMI must be at least 10'],
    max: [60, 'BMI cannot exceed 60']
  },
  measuredAt: {
    type: Date,
    required: [true, 'Measurement date is required'],
    default: Date.now
  },
  dataSource: {
    type: String,
    enum: ['bluetooth_scale', 'manual'],
    default: 'manual'
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Virtual for BMI category
weightLogSchema.virtual('bmiCategory').get(function() {
  if (!this.bmi) return null;
  
  if (this.bmi < 18.5) return 'Underweight';
  if (this.bmi < 25) return 'Normal weight';
  if (this.bmi < 30) return 'Overweight';
  return 'Obese';
});

// Pre-save middleware to calculate BMI if height is available
weightLogSchema.pre('save', async function(next) {
  if (!this.bmi && this.weight) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId);
      if (user && user.medicalInfo && user.medicalInfo.height) {
        const heightInMeters = user.medicalInfo.height / 100;
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }
    } catch (error) {
      // Continue without BMI calculation if user not found
    }
  }
  next();
});

// Index for performance
weightLogSchema.index({ userId: 1, measuredAt: -1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);