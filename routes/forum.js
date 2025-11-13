const express = require('express');
const { ForumPost, ForumComment, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all forum posts
// @route   GET /api/forum/posts
// @access  Private
const getForumPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort || 'recent'; // recent, popular, activity

    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortQuery = {};
    switch (sort) {
      case 'popular':
        sortQuery = { likes: -1, createdAt: -1 };
        break;
      case 'activity':
        sortQuery = { lastActivityAt: -1 };
        break;
      default:
        sortQuery = { isPinned: -1, createdAt: -1 };
    }

    const posts = await ForumPost.find(query)
      .populate('userId', 'firstName lastName profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortQuery);

    const total = await ForumPost.countDocuments(query);

    res.json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        posts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single forum post
// @route   GET /api/forum/posts/:id
// @access  Private
const getForumPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('userId', 'firstName lastName profilePicture');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    // Increment views
    await post.incrementViews();

    res.json({
      success: true,
      data: {
        post
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create forum post
// @route   POST /api/forum/posts
// @access  Private
const createForumPost = async (req, res) => {
  try {
    const {
      title,
      body,
      category,
      tags
    } = req.body;

    const post = await ForumPost.create({
      userId: req.user._id,
      title,
      body,
      category,
      tags: tags || []
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'forum_post_created',
      entity: 'forumPosts',
      entityId: post._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    // Populate user data
    await post.populate('userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Forum post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update forum post
// @route   PUT /api/forum/posts/:id
// @access  Private
const updateForumPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    // Check if user owns the post or is admin/moderator
    if (req.user._id.toString() !== post.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const allowedFields = ['title', 'body', 'category', 'tags'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedPost = await ForumPost.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Forum post updated successfully',
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete forum post
// @route   DELETE /api/forum/posts/:id
// @access  Private
const deleteForumPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    // Check if user owns the post or is admin
    if (req.user._id.toString() !== post.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await ForumPost.findByIdAndDelete(req.params.id);

    // Also delete associated comments
    await ForumComment.deleteMany({ postId: req.params.id });

    res.json({
      success: true,
      message: 'Forum post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike forum post
// @route   PUT /api/forum/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    await post.toggleLike(req.user._id);

    res.json({
      success: true,
      message: 'Post like toggled successfully',
      data: {
        likes: post.likes,
        isLiked: post.likedBy.includes(req.user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get comments for a post
// @route   GET /api/forum/posts/:id/comments
// @access  Private
const getPostComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const comments = await ForumComment.find({
      postId: req.params.id,
      isActive: true,
      parentCommentId: null // Top-level comments only
    })
      .populate('userId', 'firstName lastName profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'userId',
          select: 'firstName lastName profilePicture'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: 1 });

    // Get replies for each comment
    for (let comment of comments) {
      const replies = await ForumComment.find({
        parentCommentId: comment._id,
        isActive: true
      })
        .populate('userId', 'firstName lastName profilePicture')
        .sort({ createdAt: 1 });
      
      comment._doc.replies = replies;
    }

    const total = await ForumComment.countDocuments({
      postId: req.params.id,
      isActive: true,
      parentCommentId: null
    });

    res.json({
      success: true,
      count: comments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        comments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create comment on post
// @route   POST /api/forum/posts/:id/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { body, parentCommentId } = req.body;

    const comment = await ForumComment.create({
      postId: req.params.id,
      userId: req.user._id,
      parentCommentId: parentCommentId || null,
      body
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'forum_comment_created',
      entity: 'forumComments',
      entityId: comment._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    // Populate user data
    await comment.populate('userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/forum/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (req.user._id.toString() !== comment.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    const { body } = req.body;
    if (body) comment.body = body;

    await comment.save();

    await comment.populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/forum/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (req.user._id.toString() !== comment.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await ForumComment.findByIdAndDelete(req.params.id);

    // Also delete all replies to this comment
    await ForumComment.deleteMany({ parentCommentId: req.params.id });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike comment
// @route   PUT /api/forum/comments/:id/like
// @access  Private
const toggleLikeComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked the comment
    const likedIndex = comment.likedBy ? comment.likedBy.indexOf(req.user._id) : -1;
    
    if (likedIndex > -1) {
      // Unlike
      comment.likedBy.splice(likedIndex, 1);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Like
      if (!comment.likedBy) comment.likedBy = [];
      comment.likedBy.push(req.user._id);
      comment.likes = (comment.likes || 0) + 1;
    }

    await comment.save();

    res.json({
      success: true,
      message: 'Comment like toggled successfully',
      data: {
        likes: comment.likes,
        isLiked: comment.likedBy.includes(req.user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get forum categories and stats
// @route   GET /api/forum/categories
// @access  Private
const getForumCategories = async (req, res) => {
  try {
    const categories = await ForumPost.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          postCount: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          lastActivity: { $max: '$lastActivityAt' }
        }
      },
      { $sort: { postCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
// GET /api/forum - Get all forum posts (redirects to /posts for consistency)
router.get('/', auth, getForumPosts);

router.get('/posts', auth, getForumPosts);
router.get('/posts/:id', auth, getForumPost);
router.get('/posts/:id/comments', auth, getPostComments);
router.get('/categories', auth, getForumCategories);
router.post('/posts', auth, createForumPost);
router.post('/posts/:id/comments', auth, createComment);

// POST /api/forum - Create forum post (alternative to /posts)
router.post('/', auth, createForumPost);

router.put('/posts/:id', auth, updateForumPost);
router.put('/posts/:id/like', auth, toggleLikePost);
router.put('/comments/:id', auth, updateComment);
router.put('/comments/:id/like', auth, toggleLikeComment);
router.delete('/posts/:id', auth, deleteForumPost);
router.delete('/comments/:id', auth, deleteComment);

module.exports = router;