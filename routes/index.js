const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const xrayRoutes = require('./xrays');
const predictionRoutes = require('./predictions');
const activityRoutes = require('./activity');
const dietRoutes = require('./diet');
const weightRoutes = require('./weight');
const recommendationRoutes = require('./recommendations');
const medicationRoutes = require('./medications');
const progressRoutes = require('./progress');
const consultationRoutes = require('./consultations');
const messageRoutes = require('./messages');
const forumRoutes = require('./forum');
const notificationRoutes = require('./notifications');
const doctorPatientRoutes = require('./doctor-patient-relations');
const klGradeRoutes = require('./kl-grades');
const auditLogRoutes = require('./audit-logs');

const router = express.Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/xrays', xrayRoutes);
router.use('/predictions', predictionRoutes);
router.use('/activity', activityRoutes);
router.use('/diet', dietRoutes);
router.use('/weight', weightRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/medications', medicationRoutes);
router.use('/progress', progressRoutes);
router.use('/consultations', consultationRoutes);
router.use('/messages', messageRoutes);
router.use('/forum', forumRoutes);
router.use('/notifications', notificationRoutes);
router.use('/doctor-patient-relations', doctorPatientRoutes);
router.use('/kl-grades', klGradeRoutes);
router.use('/audit-logs', auditLogRoutes);

module.exports = router;