const mongoose = require('mongoose');

const xrayImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be greater than 0']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    captureDate: {
      type: Date,
      default: Date.now
    },
    equipment: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      enum: ['AP', 'PA', 'Lateral', 'Oblique'],
      default: 'AP'
    },
    technique: {
      kVp: {
        type: Number,
        min: 40,
        max: 150
      },
      mAs: {
        type: Number,
        min: 1,
        max: 100
      }
    }
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for performance
xrayImageSchema.index({ userId: 1, uploadedAt: -1 });
xrayImageSchema.index({ processingStatus: 1 });

module.exports = mongoose.model('XRayImage', xrayImageSchema);