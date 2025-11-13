const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: [true, 'Post ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumComment',
    default: null
  },
  
  body: {
    type: String,
    required: [true, 'Comment body is required'],
    maxlength: [1000, 'Comment body cannot exceed 1000 characters']
  },
  
  // Engagement Metrics
  likes: {
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
  
  // Comment Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  
  // For tracking replies
  hasReplies: {
    type: Boolean,
    default: false
  },
  replyCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Method to toggle like
forumCommentSchema.methods.toggleLike = function(userId) {
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

// Pre-save middleware to mark as edited
forumCommentSchema.pre('save', function(next) {
  if (this.isModified('body') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Post-save middleware to update parent comment reply count
forumCommentSchema.post('save', async function(doc) {
  if (doc.parentCommentId) {
    try {
      const parentComment = await this.constructor.findById(doc.parentCommentId);
      if (parentComment) {
        const replyCount = await this.constructor.countDocuments({
          parentCommentId: doc.parentCommentId,
          isActive: true
        });
        
        parentComment.replyCount = replyCount;
        parentComment.hasReplies = replyCount > 0;
        await parentComment.save();
      }
    } catch (error) {
      console.error('Error updating parent comment reply count:', error);
    }
  }
  
  // Update post reply count
  try {
    const ForumPost = mongoose.model('ForumPost');
    const post = await ForumPost.findById(doc.postId);
    if (post) {
      const totalReplies = await this.constructor.countDocuments({
        postId: doc.postId,
        isActive: true
      });
      
      post.replies = totalReplies;
      post.lastActivityAt = new Date();
      await post.save();
    }
  } catch (error) {
    console.error('Error updating post reply count:', error);
  }
});

// Index for performance
forumCommentSchema.index({ postId: 1, createdAt: 1 });
forumCommentSchema.index({ userId: 1, createdAt: -1 });
forumCommentSchema.index({ parentCommentId: 1, createdAt: 1 });
forumCommentSchema.index({ isActive: 1 });

module.exports = mongoose.model('ForumComment', forumCommentSchema);