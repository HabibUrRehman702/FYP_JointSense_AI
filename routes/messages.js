const express = require('express');
const { Message, DoctorPatientRelation, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where user is either sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { sentAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.sentAt': -1 }
      }
    ]);

    // Populate user information for the conversations
    await Message.populate(conversations, [
      { path: 'lastMessage.senderId', select: 'firstName lastName profilePicture role' },
      { path: 'lastMessage.receiverId', select: 'firstName lastName profilePicture role' }
    ]);

    res.json({
      success: true,
      count: conversations.length,
      data: {
        conversations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const conversationId = req.params.conversationId;

    // Verify user is part of this conversation
    const userInConversation = await Message.findOne({
      conversationId,
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    });

    if (!userInConversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .populate('senderId', 'firstName lastName profilePicture role')
      .populate('receiverId', 'firstName lastName profilePicture role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ sentAt: -1 });

    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false
    });

    // Mark messages as read if user is the receiver
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        messages: messages.reverse() // Return in chronological order
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      conversationId,
      messageType,
      content,
      attachments,
      replyTo,
      priority
    } = req.body;

    // Generate conversation ID if not provided
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      // Create conversation ID based on user IDs (sorted for consistency)
      const userIds = [req.user._id.toString(), receiverId].sort();
      finalConversationId = `conv_${userIds[0]}_${userIds[1]}`;
    }

    // Verify users can communicate (for patient-doctor relationships)
    if (req.user.role === 'patient') {
      const relation = await DoctorPatientRelation.findOne({
        patientId: req.user._id,
        doctorId: receiverId,
        isActive: true
      });

      if (!relation) {
        return res.status(403).json({
          success: false,
          message: 'No active relationship with this doctor'
        });
      }
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      conversationId: finalConversationId,
      messageType: messageType || 'text',
      content,
      attachments: attachments || [],
      replyTo,
      priority: priority || 'normal'
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'message_sent',
      entity: 'messages',
      entityId: message._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    // Populate user information
    await message.populate([
      { path: 'senderId', select: 'firstName lastName profilePicture role' },
      { path: 'receiverId', select: 'firstName lastName profilePicture role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only receiver can mark message as read
    if (req.user._id.toString() !== message.receiverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (req.user._id.toString() !== message.senderId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let searchQuery = {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ],
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (conversationId) {
      searchQuery.conversationId = conversationId;
    }

    const messages = await Message.find(searchQuery)
      .populate('senderId', 'firstName lastName profilePicture')
      .populate('receiverId', 'firstName lastName profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ sentAt: -1 });

    const total = await Message.countDocuments(searchQuery);

    res.json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        messages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start conversation with doctor
// @route   POST /api/messages/start-conversation
// @access  Private/Patient
const startConversation = async (req, res) => {
  try {
    const { doctorId, initialMessage } = req.body;

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can start conversations with doctors'
      });
    }

    // Verify doctor-patient relationship
    const relation = await DoctorPatientRelation.findOne({
      patientId: req.user._id,
      doctorId,
      isActive: true
    });

    if (!relation) {
      return res.status(403).json({
        success: false,
        message: 'No active relationship with this doctor'
      });
    }

    // Generate conversation ID
    const userIds = [req.user._id.toString(), doctorId].sort();
    const conversationId = `conv_${userIds[0]}_${userIds[1]}`;

    // Send initial message
    const message = await Message.create({
      senderId: req.user._id,
      receiverId: doctorId,
      conversationId,
      messageType: 'text',
      content: initialMessage
    });

    await message.populate([
      { path: 'senderId', select: 'firstName lastName profilePicture role' },
      { path: 'receiverId', select: 'firstName lastName profilePicture role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: {
        conversationId,
        message
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
// GET /api/messages - Get conversations for current user
router.get('/', auth, getConversations);

router.get('/conversations', auth, getConversations);
router.get('/conversation/:conversationId', auth, getConversationMessages);
router.get('/unread-count', auth, getUnreadCount);
router.get('/search', auth, searchMessages);
router.post('/', auth, sendMessage);
router.post('/start-conversation', auth, startConversation);
router.put('/:id/read', auth, markMessageAsRead);
router.delete('/:id', auth, deleteMessage);

module.exports = router;