// Central model index file for Joint Sense AI

// User Management Models
const User = require('./User');
const DoctorPatientRelation = require('./DoctorPatientRelation');

// AI Prediction Models
const XRayImage = require('./XRayImage');
const AIPrediction = require('./AIPrediction');
const KLGrade = require('./KLGrade');

// Lifestyle Tracking Models
const ActivityLog = require('./ActivityLog');
const WeightLog = require('./WeightLog');
const DietLog = require('./DietLog');

// Recommendation Models
const Recommendation = require('./Recommendation');
const MedicationReminder = require('./MedicationReminder');

// Progress Tracking Models
const ProgressReport = require('./ProgressReport');
const DiseaseProgression = require('./DiseaseProgression');

// Communication Models
const Consultation = require('./Consultation');
const Message = require('./Message');

// Community Models
const ForumPost = require('./ForumPost');
const ForumComment = require('./ForumComment');

// System Models
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

module.exports = {
  // User Management
  User,
  DoctorPatientRelation,
  
  // AI Prediction
  XRayImage,
  AIPrediction,
  KLGrade,
  
  // Lifestyle Tracking
  ActivityLog,
  WeightLog,
  DietLog,
  
  // Recommendations
  Recommendation,
  MedicationReminder,
  
  // Progress Tracking
  ProgressReport,
  DiseaseProgression,
  
  // Communication
  Consultation,
  Message,
  
  // Community
  ForumPost,
  ForumComment,
  
  // System
  Notification,
  AuditLog
};