const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Post body is required'],
    maxlength: [5000, 'Post body cannot exceed 5000 characters']
  },
  category: {
    type: String,
    enum: ['exercise', 'diet', 'pain_management', 'success_stories', 'general', 'medication', 'lifestyle'],
    required: [true, 'Category is required']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Engagement Metrics
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  replies: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // User interactions
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Content Moderation
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  moderationReason: {
    type: String,
    maxlength: [200, 'Moderation reason cannot exceed 200 characters']
  },
  
  // Post Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  
  // For featured posts
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date,
    default: null
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for excerpt
forumPostSchema.virtual('excerpt').get(function() {
  return this.body.length > 200 ? this.body.substring(0, 200) + '...' : this.body;
});

// Method to increment views
forumPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to toggle like
forumPostSchema.methods.toggleLike = function(userId) {
  const userIndex = this.likedBy.indexOf(userId);
  
  if (userIndex > -1) {
    // Unlike
    this.likedBy.splice(userIndex, 1);
    this.likes = Math.max(0, this.likes - 1);
  } else {
    // Like
    this.likedBy.push(userId);
    this.likes += 1;
  }
  
  return this.save();
};

// Pre-save middleware to update lastActivityAt
forumPostSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Index for performance
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ tags: 1 });
forumPostSchema.index({ isActive: 1, isPinned: -1, lastActivityAt: -1 });
forumPostSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ForumPost', forumPostSchema);