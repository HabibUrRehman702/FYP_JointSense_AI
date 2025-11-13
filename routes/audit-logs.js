const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// @desc    Get audit logs with filtering and pagination
// @route   GET /api/audit-logs
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entity,
      status,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    // Convert to safe objects (mask sensitive data)
    const safeAuditLogs = auditLogs.map(log => log.toSafeObject());

    res.json({
      success: true,
      data: safeAuditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs'
    });
  }
});

// @desc    Get single audit log
// @route   GET /api/audit-logs/:id
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate('userId', 'firstName lastName email role');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog.toSafeObject()
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit log'
    });
  }
});

// @desc    Create audit log entry
// @route   POST /api/audit-logs
// @access  Private (System/Admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      userId,
      action,
      entity,
      entityId,
      changes,
      ipAddress,
      userAgent,
      sessionId,
      requestId,
      status,
      errorMessage,
      metadata
    } = req.body;

    const auditLogData = {
      userId,
      action,
      entity,
      entityId,
      changes,
      ipAddress,
      userAgent,
      sessionId,
      requestId,
      status: status || 'success',
      errorMessage,
      metadata
    };

    const auditLog = await AuditLog.logActivity(auditLogData);

    res.status(201).json({
      success: true,
      data: auditLog.toSafeObject()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating audit log'
    });
  }
});

// @desc    Get audit logs for specific user
// @route   GET /api/audit-logs/user/:userId
// @access  Private (Admin or User themselves)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      action,
      entity,
      startDate,
      endDate
    } = req.query;

    const query = { userId };

    if (action) query.action = action;
    if (entity) query.entity = entity;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    const safeAuditLogs = auditLogs.map(log => log.toSafeObject());

    res.json({
      success: true,
      data: safeAuditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user audit logs'
    });
  }
});

// @desc    Get audit log statistics
// @route   GET /api/audit-logs/stats
// @access  Private (Admin only)
router.get('/stats/summary', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const [
      totalLogs,
      actionStats,
      entityStats,
      statusStats,
      userStats
    ] = await Promise.all([
      // Total logs count
      AuditLog.countDocuments(dateFilter),

      // Action statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Entity statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Status statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Most active users
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            count: 1,
            'user.firstName': 1,
            'user.lastName': 1,
            'user.email': 1,
            'user.role': 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalLogs,
          period: {
            startDate: startDate || 'N/A',
            endDate: endDate || 'N/A'
          }
        },
        actionStats,
        entityStats,
        statusStats,
        mostActiveUsers: userStats
      }
    });
  } catch (error) {
    console.error('Error getting audit log statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit log statistics'
    });
  }
});

// @desc    Get audit logs by entity and entity ID
// @route   GET /api/audit-logs/entity/:entity/:entityId
// @access  Private (Admin only)
router.get('/entity/:entity/:entityId', auth, authorize('admin'), async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const auditLogs = await AuditLog.find({ entity, entityId })
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments({ entity, entityId });

    const safeAuditLogs = auditLogs.map(log => log.toSafeObject());

    res.json({
      success: true,
      data: safeAuditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting entity audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving entity audit logs'
    });
  }
});

// @desc    Delete old audit logs (Admin only)
// @route   DELETE /api/audit-logs/cleanup
// @access  Private (Admin only)
router.delete('/cleanup', auth, authorize('admin'), async (req, res) => {
  try {
    const { olderThanDays = 365 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} audit logs older than ${olderThanDays} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up audit logs'
    });
  }
});

// @desc    Export audit logs
// @route   GET /api/audit-logs/export
// @access  Private (Admin only)
router.get('/export', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      format = 'json',
      userId,
      action,
      entity,
      startDate,
      endDate,
      limit = 1000
    } = req.query;

    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entity) query.entity = entity;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const safeAuditLogs = auditLogs.map(log => log.toSafeObject());

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'Timestamp,User,Action,Entity,Status,IP Address\n';
      const csvData = safeAuditLogs.map(log => 
        `${log.timestamp},${log.userId?.firstName || 'Unknown'} ${log.userId?.lastName || ''},${log.action},${log.entity},${log.status},${log.ipAddress || 'N/A'}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csvHeaders + csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        totalRecords: safeAuditLogs.length,
        data: safeAuditLogs
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs'
    });
  }
});

module.exports = router;