const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user_login',
      'user_logout',
      'user_created',
      'user_updated',
      'user_deleted',
      'xray_uploaded',
      'ai_prediction_generated',
      'recommendation_created',
      'recommendation_updated',
      'medication_reminder_created',
      'activity_logged',
      'weight_logged',
      'diet_logged',
      'consultation_scheduled',
      'consultation_completed',
      'message_sent',
      'forum_post_created',
      'forum_comment_created',
      'notification_sent',
      'data_exported',
      'password_changed',
      'profile_updated'
    ]
  },
  entity: {
    type: String,
    required: [true, 'Entity is required'],
    enum: [
      'users',
      'xrayImages',
      'aiPredictions',
      'recommendations',
      'medicationReminders',
      'activityLogs',
      'weightLogs',
      'dietLogs',
      'consultations',
      'messages',
      'forumPosts',
      'forumComments',
      'notifications',
      'system'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Request Information
  ipAddress: {
    type: String,
    validate: {
      validator: function(v) {
        // Basic IP validation (IPv4 and IPv6)
        return !v || /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  
  // Additional Context
  sessionId: {
    type: String
  },
  requestId: {
    type: String
  },
  
  // Status and Error Information
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Static method to log activity
auditLogSchema.statics.logActivity = function(data) {
  return this.create({
    userId: data.userId,
    action: data.action,
    entity: data.entity,
    entityId: data.entityId || null,
    changes: data.changes || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    sessionId: data.sessionId || null,
    requestId: data.requestId || null,
    status: data.status || 'success',
    errorMessage: data.errorMessage || null,
    metadata: data.metadata || null
  });
};

// Method to mask sensitive data
auditLogSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove or mask sensitive information
  if (obj.changes && obj.changes.password) {
    obj.changes.password = '***masked***';
  }
  
  if (obj.userAgent) {
    obj.userAgent = obj.userAgent.substring(0, 100) + '...';
  }
  
  return obj;
};

// Index for performance and compliance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index for data retention (e.g., keep audit logs for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);