const express = require('express');
const { Notification, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorize, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all notifications for a user
// @route   GET /api/notifications/user/:userId
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isRead = req.query.isRead;
    const type = req.query.type;

    let query = { userId: req.params.userId, isActive: true };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    if (type) {
      query.type = type;
    }

    // Filter out expired notifications
    query.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const notifications = await Notification.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledFor: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.params.userId,
      isRead: false,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
      data: {
        notifications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      priority,
      channels,
      scheduledFor,
      relatedEntity,
      actionRequired,
      actionUrl,
      actionText,
      expiresAt
    } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      priority: priority || 'medium',
      channels: channels || ['in_app'],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      relatedEntity,
      actionRequired: actionRequired || false,
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'notification_sent',
      entity: 'notifications',
      entityId: notification._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notification
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can mark this notification as read
    if (req.user._id.toString() !== notification.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this notification as read'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read for a user
// @route   PUT /api/notifications/read-all/:userId
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check authorization
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark notifications for this user'
      });
    }

    const result = await Notification.updateMany(
      { 
        userId, 
        isRead: false,
        isActive: true
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can delete this notification
    if (req.user.role !== 'admin' && req.user._id.toString() !== notification.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats/:userId
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Notification.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          readNotifications: {
            $sum: { $cond: ['$isRead', 1, 0] }
          },
          typeDistribution: {
            $push: '$type'
          },
          priorityDistribution: {
            $push: '$priority'
          }
        }
      }
    ]);

    // Count by type and priority
    let typeCount = {};
    let priorityCount = {};

    if (stats.length > 0) {
      stats[0].typeDistribution.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      stats[0].priorityDistribution.forEach(priority => {
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
    }

    const totalNotifications = stats[0]?.totalNotifications || 0;
    const readNotifications = stats[0]?.readNotifications || 0;
    const readPercentage = totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0;

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalNotifications,
        readNotifications,
        unreadNotifications: totalNotifications - readNotifications,
        readPercentage,
        typeDistribution: typeCount,
        priorityDistribution: priorityCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send system notification to multiple users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res) => {
  try {
    const {
      userIds,
      type,
      title,
      message,
      priority,
      channels,
      scheduledFor,
      expiresAt
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      priority: priority || 'medium',
      channels: channels || ['in_app'],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} notifications sent successfully`,
      data: {
        notificationCount: createdNotifications.length
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
// GET /api/notifications - Get current user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isRead = req.query.isRead;
    const type = req.query.type;

    let query = { userId: req.user._id, isActive: true };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    if (type) {
      query.type = type;
    }

    // Filter out expired notifications
    query.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const notifications = await Notification.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledFor: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
      data: {
        notifications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/notifications - Mark multiple notifications as read
router.put('/', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds array is required'
      });
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        userId: req.user._id
      },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/user/:userId', auth, authorizePatientAccess, getUserNotifications);
router.get('/stats/:userId', auth, authorizePatientAccess, getNotificationStats);
router.get('/:id', auth, getNotification);
router.post('/', auth, authorize('admin'), createNotification);
router.post('/broadcast', auth, authorize('admin'), broadcastNotification);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all/:userId', auth, markAllAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;