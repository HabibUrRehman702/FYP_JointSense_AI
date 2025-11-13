const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required']
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Conversation ID is required'],
    index: true
  },
  
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'ai_report'],
    default: 'text'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'report'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      min: 0
    },
    mimeType: {
      type: String
    }
  }],
  
  // Message Status
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  
  // For AI-generated messages
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  aiContext: {
    type: String,
    enum: ['reminder', 'alert', 'recommendation', 'report'],
    default: null
  },
  
  // Message priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // For threaded conversations
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save middleware to set deliveredAt
messageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.deliveredAt = new Date();
  }
  
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// Index for performance
messageSchema.index({ conversationId: 1, sentAt: 1 });
messageSchema.index({ senderId: 1, sentAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ sentAt: -1 });

module.exports = mongoose.model('Message', messageSchema);