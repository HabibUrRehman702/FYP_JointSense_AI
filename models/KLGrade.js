const mongoose = require('mongoose');

const klGradeSchema = new mongoose.Schema({
  grade: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['Normal', 'Mild', 'Moderate', 'Severe', 'Very Severe'],
    required: true
  },
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each recommendation cannot exceed 200 characters']
  }]
}, {
  timestamps: true
});

// Index for performance
klGradeSchema.index({ grade: 1 });

module.exports = mongoose.model('KLGrade', klGradeSchema);