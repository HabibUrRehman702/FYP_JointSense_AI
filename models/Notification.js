const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  type: {
    type: String,
    enum: [
      'medication_reminder', 
      'appointment', 
      'achievement', 
      'system', 
      'ai_prediction', 
      'forum_reply',
      'doctor_message',
      'progress_report'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Notification Settings
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: 'in_app'
  }],
  
  // Scheduling
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Related Data
  relatedEntity: {
    type: {
      type: String,
      enum: ['medication', 'consultation', 'forum_post', 'ai_prediction', 'progress_report'],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  
  // Action Data (for actionable notifications)
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionText: {
    type: String,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  
  // Notification Status
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Delivery Status
  deliveryStatus: {
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null }
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to set readAt when marked as read
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark delivery status
notificationSchema.methods.markDelivered = function(channel, success, error = null) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].sent = success;
    this.deliveryStatus[channel].sentAt = success ? new Date() : null;
    this.deliveryStatus[channel].error = error;
    
    // Mark overall sentAt if any channel is successful
    if (success && !this.sentAt) {
      this.sentAt = new Date();
    }
  }
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return new this({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    channels: data.channels || ['in_app'],
    scheduledFor: data.scheduledFor || new Date(),
    relatedEntity: data.relatedEntity || {},
    actionRequired: data.actionRequired || false,
    actionUrl: data.actionUrl || null,
    actionText: data.actionText || null,
    expiresAt: data.expiresAt || null
  });
};

// Index for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1, isActive: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);