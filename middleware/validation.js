const Joi = require('joi');

// User schemas
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  role: Joi.string().valid('patient', 'doctor', 'admin').default('patient'),
  adminSecret: Joi.string().when('role', {
    is: 'admin',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  medicalInfo: Joi.object({
    height: Joi.number().min(100).max(250).optional(),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    allergies: Joi.array().items(Joi.string()).optional(),
    chronicConditions: Joi.array().items(Joi.string()).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().optional(),
      relationship: Joi.string().optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    }).optional()
  }).optional(),
  doctorInfo: Joi.object({
    licenseNumber: Joi.string().when('$role', {
      is: 'doctor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    specialization: Joi.string().when('$role', {
      is: 'doctor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    experience: Joi.number().min(0).max(50).optional(),
    hospital: Joi.string().optional()
  }).optional()
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  medicalInfo: Joi.object({
    height: Joi.number().min(100).max(250).optional(),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    allergies: Joi.array().items(Joi.string()).optional(),
    chronicConditions: Joi.array().items(Joi.string()).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().optional(),
      relationship: Joi.string().optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    }).optional()
  }).optional()
});

// AI Prediction schemas
const aiPredictionSchema = Joi.object({
  xrayImageId: Joi.string().required(),
  userId: Joi.string().required(),
  oaStatus: Joi.string().valid('OA', 'No_OA').required(),
  klGrade: Joi.number().integer().min(0).max(4).required(),
  confidence: Joi.number().min(0).max(1).required(),
  riskScore: Joi.number().min(0).max(100).required(),
  analysis: Joi.object({
    jointSpaceNarrowing: Joi.string().valid('none', 'mild', 'moderate', 'severe').required(),
    osteophytes: Joi.string().valid('absent', 'present', 'multiple').required(),
    sclerosis: Joi.string().valid('none', 'mild', 'moderate', 'severe').required(),
    boneDeformity: Joi.string().valid('none', 'mild', 'moderate', 'severe').required()
  }).required(),
  modelInfo: Joi.object({
    version: Joi.string().required(),
    algorithm: Joi.string().required(),
    trainedOn: Joi.string().required()
  }).required(),
  gradCamUrl: Joi.string().uri().required(),
  explanation: Joi.string().max(2000).required(),
  reviewNotes: Joi.string().max(1000).optional()
});

// Activity Log schemas
const activityLogSchema = Joi.object({
  userId: Joi.string().required(),
  date: Joi.date().default(Date.now),
  steps: Joi.number().min(0).default(0),
  distance: Joi.number().min(0).default(0),
  caloriesBurned: Joi.number().min(0).default(0),
  activeMinutes: Joi.number().min(0).default(0),
  kneeBandData: Joi.object({
    flexionExtension: Joi.object({
      totalFlexions: Joi.number().min(0).default(0),
      averageAngle: Joi.number().min(0).max(180).optional(),
      maxAngle: Joi.number().min(0).max(180).optional(),
      minAngle: Joi.number().min(0).max(180).optional()
    }).optional(),
    loadPressure: Joi.object({
      averageLoad: Joi.number().min(0).optional(),
      maxLoad: Joi.number().min(0).optional(),
      loadDistribution: Joi.string().valid('even', 'uneven', 'left-heavy', 'right-heavy').optional()
    }).optional(),
    temperature: Joi.object({
      averageTemp: Joi.number().min(30).max(45).optional(),
      maxTemp: Joi.number().min(30).max(45).optional(),
      inflammationDetected: Joi.boolean().default(false)
    }).optional(),
    pulseData: Joi.object({
      averageHeartRate: Joi.number().min(40).max(200).optional(),
      maxHeartRate: Joi.number().min(40).max(200).optional(),
      restingHeartRate: Joi.number().min(40).max(120).optional()
    }).optional()
  }).optional(),
  adherenceScore: Joi.number().min(0).max(100).default(0),
  targetSteps: Joi.number().min(0).default(10000),
  targetActiveMinutes: Joi.number().min(0).default(60),
  dataSource: Joi.string().valid('knee_band', 'mobile_app', 'manual').default('mobile_app')
});

// Weight Log schemas
const weightLogSchema = Joi.object({
  userId: Joi.string().required(),
  weight: Joi.number().min(20).max(300).required(),
  bmi: Joi.number().min(10).max(60).optional(),
  measuredAt: Joi.date().default(Date.now),
  dataSource: Joi.string().valid('bluetooth_scale', 'manual').default('manual'),
  notes: Joi.string().max(200).optional()
});

// Diet Log schemas
const dietLogSchema = Joi.object({
  userId: Joi.string().required(),
  date: Joi.date().default(Date.now),
  meals: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
      time: Joi.date().required(),
      foods: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          calories: Joi.number().min(0).required(),
          nutrients: Joi.object({
            protein: Joi.number().min(0).default(0),
            carbs: Joi.number().min(0).default(0),
            fat: Joi.number().min(0).default(0),
            fiber: Joi.number().min(0).default(0),
            omega3: Joi.number().min(0).default(0)
          }).optional()
        })
      ).required()
    })
  ).required(),
  dietaryScore: Joi.number().min(0).max(100).default(0),
  antiInflammatoryFoods: Joi.array().items(Joi.string()).optional(),
  dataSource: Joi.string().valid('api_integration', 'manual').default('manual')
});

// Medication Reminder schemas
const medicationReminderSchema = Joi.object({
  userId: Joi.string().required(),
  medicationName: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().valid('daily', 'twice_daily', 'thrice_daily', 'weekly', 'as_needed').required(),
  timeSlots: Joi.array().items(
    Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ).optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  prescribedBy: Joi.string().optional()
});

// Consultation schemas
const consultationSchema = Joi.object({
  doctorId: Joi.string().required(),
  patientId: Joi.string().required(),
  consultationType: Joi.string().valid('virtual', 'in_person', 'review').required(),
  scheduledAt: Joi.date().required(),
  duration: Joi.number().min(15).max(180).default(30),
  notes: Joi.string().max(2000).optional(),
  clinicalAssessment: Joi.object({
    painLevel: Joi.number().min(0).max(10).optional(),
    mobilityScore: Joi.number().min(0).max(10).optional(),
    swelling: Joi.string().valid('none', 'mild', 'moderate', 'severe').optional(),
    stiffness: Joi.string().valid('none', 'mild', 'moderate', 'severe').optional(),
    functionalLimitation: Joi.string().max(500).optional()
  }).optional(),
  prescriptions: Joi.array().items(
    Joi.object({
      medicationName: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().required(),
      duration: Joi.string().required(),
      instructions: Joi.string().max(300).optional()
    })
  ).optional(),
  nextAppointment: Joi.date().optional(),
  actionItems: Joi.array().items(Joi.string().max(200)).optional()
});

// Forum Post schemas
const forumPostSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().max(200).required(),
  body: Joi.string().max(5000).required(),
  category: Joi.string().valid('exercise', 'diet', 'pain_management', 'success_stories', 'general', 'medication', 'lifestyle').required(),
  tags: Joi.array().items(Joi.string().max(30)).optional()
});

const forumCommentSchema = Joi.object({
  postId: Joi.string().required(),
  userId: Joi.string().required(),
  parentCommentId: Joi.string().optional(),
  body: Joi.string().max(1000).required()
});

// Notification schemas
const notificationSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().valid(
    'medication_reminder', 
    'appointment', 
    'achievement', 
    'system', 
    'ai_prediction', 
    'forum_reply',
    'doctor_message',
    'progress_report'
  ).required(),
  title: Joi.string().max(100).required(),
  message: Joi.string().max(500).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'sms', 'in_app')).default(['in_app']),
  scheduledFor: Joi.date().default(Date.now),
  expiresAt: Joi.date().optional(),
  actionRequired: Joi.boolean().default(false),
  actionUrl: Joi.string().optional(),
  actionText: Joi.string().max(50).optional()
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  aiPredictionSchema,
  activityLogSchema,
  weightLogSchema,
  dietLogSchema,
  medicationReminderSchema,
  consultationSchema,
  forumPostSchema,
  forumCommentSchema,
  notificationSchema
};