// MongoDB Collections Schema for Joint Sense AI - Knee Osteoarthritis Prediction System

// ===========================
// USER MANAGEMENT COLLECTIONS
// ===========================

// Users Collection
db.users.insertOne({
  _id: ObjectId(),
  email: "patient@example.com",
  password: "hashed_password",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  dateOfBirth: ISODate("1980-05-15"),
  gender: "male", // male, female, other
  role: "patient", // patient, doctor, admin
  profilePicture: "https://storage.example.com/profiles/user123.jpg",
  isActive: true,
  createdAt: ISODate(),
  updatedAt: ISODate(),
  
  // Medical Information (for patients)
  medicalInfo: {
    height: 175, // cm
    bloodType: "O+",
    allergies: ["penicillin"],
    chronicConditions: ["diabetes"],
    emergencyContact: {
      name: "Jane Doe",
      relationship: "spouse",
      phone: "+1234567891"
    }
  },
  
  // Doctor specific fields
  doctorInfo: {
    licenseNumber: "MD12345",
    specialization: "Orthopedics",
    experience: 10,
    hospital: "City General Hospital"
  }
});

// ===========================
// AI PREDICTION COLLECTIONS
// ===========================

// X-Ray Images Collection
db.xrayImages.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  imageUrl: "https://storage.example.com/xrays/image123.jpg",
  fileName: "knee_xray_20241015.jpg",
  fileSize: 2048576, // bytes
  uploadedAt: ISODate(),
  metadata: {
    captureDate: ISODate(),
    equipment: "Siemens X-Ray Machine",
    position: "AP", // Anterior-Posterior
    technique: {
      kVp: 85,
      mAs: 10
    }
  },
  isProcessed: true,
  processingStatus: "completed" // pending, processing, completed, failed
});

// AI Predictions Collection
db.aiPredictions.insertOne({
  _id: ObjectId(),
  xrayImageId: ObjectId("xray_image_id"),
  userId: ObjectId("user_id"),
  
  // Primary Prediction Results
  oaStatus: "OA", // OA, No_OA
  klGrade: 2, // 0-4 (Kellgren-Lawrence Grade)
  confidence: 0.87,
  riskScore: 65, // 0-100
  
  // Detailed Analysis
  analysis: {
    jointSpaceNarrowing: "moderate",
    osteophytes: "present",
    sclerosis: "mild",
    boneDeformity: "none"
  },
  
  // AI Model Information
  modelInfo: {
    version: "v2.1.0",
    algorithm: "CNN-ResNet50",
    trainedOn: "10000+ X-ray samples"
  },
  
  // Visual Explanations
  gradCamUrl: "https://storage.example.com/gradcam/pred123.jpg",
  explanation: "Moderate joint space narrowing detected with visible osteophyte formation...",
  
  predictedAt: ISODate(),
  reviewedBy: ObjectId("doctor_id"), // Optional
  reviewedAt: ISODate(),
  reviewNotes: "Confirmed moderate OA, recommend lifestyle modifications"
});

// KL Grade Reference Collection
db.klGrades.insertMany([
  {
    grade: 0,
    description: "No radiographic features of OA",
    severity: "Normal",
    recommendations: ["Maintain healthy lifestyle", "Regular exercise"]
  },
  {
    grade: 1,
    description: "Doubtful narrowing of joint space and possible osteophytic lipping",
    severity: "Mild",
    recommendations: ["Low-impact exercises", "Weight management", "Joint supplements"]
  },
  {
    grade: 2,
    description: "Definite osteophytes and possible narrowing of joint space",
    severity: "Moderate",
    recommendations: ["Physical therapy", "Anti-inflammatory diet", "Strength training"]
  },
  {
    grade: 3,
    description: "Moderate multiple osteophytes, definite narrowing of joint space, some sclerosis and possible deformity of bone ends",
    severity: "Severe",
    recommendations: ["Supervised exercise", "Pain management", "Medical consultation"]
  },
  {
    grade: 4,
    description: "Large osteophytes, marked narrowing of joint space, severe sclerosis and definite deformity of bone ends",
    severity: "Very Severe",
    recommendations: ["Surgical consultation", "Intensive therapy", "Mobility aids"]
  }
]);

// ===========================
// LIFESTYLE TRACKING COLLECTIONS
// ===========================

// Activity Logs Collection (from IoT sensors and mobile)
db.activityLogs.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  date: ISODate("2024-10-15"),
  
  // Step and Movement Data
  steps: 8500,
  distance: 6.2, // km
  caloriesBurned: 350,
  activeMinutes: 65,
  
  // Knee Band Sensor Data
  kneeBandData: {
    flexionExtension: {
      totalFlexions: 1200,
      averageAngle: 110, // degrees
      maxAngle: 140,
      minAngle: 15
    },
    loadPressure: {
      averageLoad: 45, // kg
      maxLoad: 85,
      loadDistribution: "even"
    },
    temperature: {
      averageTemp: 36.2, // celsius
      maxTemp: 37.1,
      inflammationDetected: false
    },
    pulseData: {
      averageHeartRate: 75,
      maxHeartRate: 120,
      restingHeartRate: 65
    }
  },
  
  // Adherence Scoring
  adherenceScore: 85, // 0-100
  targetSteps: 10000,
  targetActiveMinutes: 60,
  
  syncedAt: ISODate(),
  dataSource: "knee_band" // knee_band, mobile_app, manual
});

// Weight Logs Collection
db.weightLogs.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  weight: 75.5, // kg
  bmi: 24.7,
  measuredAt: ISODate(),
  dataSource: "bluetooth_scale", // bluetooth_scale, manual
  notes: "Morning weight after breakfast"
});

// Diet Logs Collection
db.dietLogs.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  date: ISODate("2024-10-15"),
  
  meals: [
    {
      type: "breakfast",
      time: ISODate("2024-10-15T07:30:00Z"),
      foods: [
        {
          name: "Oatmeal with berries",
          calories: 250,
          nutrients: {
            protein: 8,
            carbs: 45,
            fat: 6,
            fiber: 8
          }
        }
      ]
    },
    {
      type: "lunch",
      time: ISODate("2024-10-15T12:30:00Z"),
      foods: [
        {
          name: "Grilled salmon salad",
          calories: 380,
          nutrients: {
            protein: 35,
            carbs: 15,
            fat: 20,
            omega3: 1.5
          }
        }
      ]
    }
  ],
  
  totalCalories: 1850,
  totalNutrients: {
    protein: 95,
    carbs: 180,
    fat: 65,
    fiber: 25,
    omega3: 2.1
  },
  
  dietaryScore: 88, // AI-calculated score based on anti-inflammatory foods
  antiInflammatoryFoods: ["salmon", "berries", "leafy greens"],
  dataSource: "manual" // api_integration, manual
});

// ===========================
// RECOMMENDATION COLLECTIONS
// ===========================

// Lifestyle Recommendations Collection
db.recommendations.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  klGrade: 2,
  
  // Generated Recommendations
  recommendations: {
    activity: [
      {
        type: "daily_steps",
        target: "8000-10000 steps",
        description: "Maintain moderate activity level",
        priority: "high"
      },
      {
        type: "low_impact_exercise",
        target: "30 minutes, 3-4 times/week",
        description: "Swimming, cycling, or walking",
        priority: "high"
      }
    ],
    diet: [
      {
        type: "anti_inflammatory",
        description: "Include omega-3 rich fish, leafy greens, berries",
        priority: "medium"
      },
      {
        type: "weight_management",
        description: "Maintain BMI between 18.5-24.9",
        priority: "high"
      }
    ],
    medication: [
      {
        type: "supplement",
        name: "Glucosamine + Chondroitin",
        dosage: "1500mg daily",
        frequency: "with meals"
      }
    ],
    reminders: [
      {
        type: "posture_check",
        frequency: "every 2 hours",
        message: "Check your posture and do gentle knee stretches"
      }
    ]
  },
  
  generatedAt: ISODate(),
  basedOn: ["klGrade", "bmi", "activityLevel", "age"],
  isActive: true,
  updatedAt: ISODate()
});

// Medication Reminders Collection
db.medicationReminders.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  medicationName: "Glucosamine",
  dosage: "1500mg",
  frequency: "daily",
  timeSlots: ["08:00", "20:00"],
  startDate: ISODate("2024-10-15"),
  endDate: ISODate("2024-12-15"),
  isActive: true,
  adherenceLog: [
    {
      date: ISODate("2024-10-15"),
      taken: true,
      time: ISODate("2024-10-15T08:15:00Z")
    }
  ]
});

// ===========================
// PROGRESS TRACKING COLLECTIONS
// ===========================

// Progress Reports Collection
db.progressReports.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  reportType: "monthly", // weekly, monthly, quarterly
  period: {
    startDate: ISODate("2024-09-15"),
    endDate: ISODate("2024-10-15")
  },
  
  // Progress Metrics
  metrics: {
    adherenceScore: {
      average: 82,
      trend: "improving" // improving, stable, declining
    },
    activityLevel: {
      averageSteps: 8200,
      activeMinutes: 58,
      improvement: "+15%"
    },
    weightManagement: {
      weightChange: -2.3, // kg
      bmiChange: -0.8,
      trend: "losing"
    },
    symptomReduction: {
      painScore: 4, // 1-10 scale
      mobilityScore: 7,
      improvementPercentage: 20
    }
  },
  
  // AI-Generated Insights
  insights: {
    achievements: ["Consistent daily activity", "Weight loss progress"],
    concerns: ["Occasional medication skipping"],
    recommendations: ["Continue current exercise routine", "Set medication reminders"]
  },
  
  generatedAt: ISODate(),
  reportUrl: "https://storage.example.com/reports/progress_report_123.pdf"
});

// Disease Progression Tracking Collection
db.diseaseProgression.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  
  // Historical KL Grades
  klGradeHistory: [
    {
      grade: 1,
      predictedAt: ISODate("2024-01-15"),
      confidence: 0.82
    },
    {
      grade: 2,
      predictedAt: ISODate("2024-10-15"),
      confidence: 0.87
    }
  ],
  
  // Progression Analysis
  progression: {
    currentGrade: 2,
    rateOfProgression: "slow", // slow, moderate, rapid
    projectedGrade: {
      grade: 2,
      timeFrame: "6 months",
      confidence: 0.75,
      factors: ["good adherence", "weight loss", "regular exercise"]
    }
  },
  
  // Risk Factors
  riskFactors: {
    modifiable: ["weight", "activity_level"],
    nonModifiable: ["age", "genetics"],
    current: {
      age: 44,
      bmi: 24.7,
      activityLevel: "moderate",
      adherenceScore: 82
    }
  },
  
  lastUpdated: ISODate()
});

// ===========================
// DOCTOR-PATIENT COLLABORATION
// ===========================

// Doctor-Patient Relationships Collection
db.doctorPatientRelations.insertOne({
  _id: ObjectId(),
  doctorId: ObjectId("doctor_id"),
  patientId: ObjectId("patient_id"),
  relationshipType: "primary_care", // primary_care, specialist, consultant
  startDate: ISODate("2024-01-15"),
  isActive: true,
  permissions: {
    viewPredictions: true,
    viewActivityData: true,
    modifyRecommendations: true,
    prescribeMedications: true
  }
});

// Consultations Collection
db.consultations.insertOne({
  _id: ObjectId(),
  doctorId: ObjectId("doctor_id"),
  patientId: ObjectId("patient_id"),
  
  consultationType: "virtual", // virtual, in_person, review
  scheduledAt: ISODate("2024-10-20T10:00:00Z"),
  duration: 30, // minutes
  status: "scheduled", // scheduled, completed, cancelled
  
  // Consultation Details
  notes: "Patient showing good progress with lifestyle modifications",
  reviewedPredictions: [ObjectId("prediction_id")],
  updatedRecommendations: true,
  
  // Follow-up
  nextAppointment: ISODate("2024-11-20T10:00:00Z"),
  actionItems: [
    "Continue current exercise routine",
    "Schedule X-ray in 3 months"
  ],
  
  createdAt: ISODate(),
  completedAt: ISODate()
});

// Messages Collection (Doctor-Patient Communication)
db.messages.insertOne({
  _id: ObjectId(),
  senderId: ObjectId("user_id"),
  receiverId: ObjectId("doctor_id"),
  conversationId: ObjectId("conversation_id"),
  
  messageType: "text", // text, image, file, ai_report
  content: "Hello doctor, I have a question about my exercise routine",
  attachments: [
    {
      type: "image",
      url: "https://storage.example.com/attachments/knee_photo.jpg",
      fileName: "knee_swelling.jpg"
    }
  ],
  
  isRead: false,
  sentAt: ISODate(),
  readAt: null
});

// ===========================
// COMMUNITY & FORUM COLLECTIONS
// ===========================

// Forum Posts Collection
db.forumPosts.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  title: "Tips for managing knee pain during winter",
  body: "I've noticed my knee pain increases during cold weather. Has anyone found effective strategies?",
  category: "pain_management", // exercise, diet, pain_management, success_stories
  
  tags: ["winter", "pain", "weather", "tips"],
  
  // Engagement Metrics
  likes: 15,
  replies: 8,
  views: 120,
  
  // Moderation
  isModerated: true,
  moderatedBy: ObjectId("admin_id"),
  moderatedAt: ISODate(),
  
  createdAt: ISODate(),
  updatedAt: ISODate(),
  isActive: true
});

// Forum Comments Collection
db.forumComments.insertOne({
  _id: ObjectId(),
  postId: ObjectId("post_id"),
  userId: ObjectId("user_id"),
  parentCommentId: ObjectId("parent_comment_id"), // for nested replies
  
  body: "I use warm compresses and gentle stretching. It really helps!",
  
  likes: 5,
  isModerated: true,
  
  createdAt: ISODate(),
  updatedAt: ISODate(),
  isActive: true
});

// ===========================
// SYSTEM COLLECTIONS
// ===========================

// Notification Collection
db.notifications.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  
  type: "medication_reminder", // medication_reminder, appointment, achievement, system
  title: "Time for your Glucosamine supplement",
  message: "Don't forget to take your 1500mg Glucosamine supplement",
  
  // Notification Settings
  priority: "medium", // low, medium, high, urgent
  channels: ["push", "email"], // push, email, sms
  
  // Scheduling
  scheduledFor: ISODate("2024-10-15T08:00:00Z"),
  sentAt: ISODate(),
  isRead: false,
  readAt: null,
  
  // Related Data
  relatedEntity: {
    type: "medication",
    id: ObjectId("medication_reminder_id")
  },
  
  expiresAt: ISODate("2024-10-16T08:00:00Z")
});

// Audit Logs Collection
db.auditLogs.insertOne({
  _id: ObjectId(),
  userId: ObjectId("user_id"),
  action: "ai_prediction_generated",
  entity: "aiPredictions",
  entityId: ObjectId("prediction_id"),
  
  changes: {
    klGrade: { from: null, to: 2 },
    oaStatus: { from: null, to: "OA" }
  },
  
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: ISODate()
});

// ===========================
// INDEXES FOR PERFORMANCE
// ===========================

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// AI Prediction indexes
db.aiPredictions.createIndex({ userId: 1, predictedAt: -1 });
db.aiPredictions.createIndex({ klGrade: 1 });

// Activity tracking indexes
db.activityLogs.createIndex({ userId: 1, date: -1 });
db.weightLogs.createIndex({ userId: 1, measuredAt: -1 });
db.dietLogs.createIndex({ userId: 1, date: -1 });

// Forum indexes
db.forumPosts.createIndex({ category: 1, createdAt: -1 });
db.forumPosts.createIndex({ tags: 1 });
db.forumComments.createIndex({ postId: 1, createdAt: 1 });

// Notification indexes
db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ scheduledFor: 1 });

// Doctor-Patient relationship indexes
db.doctorPatientRelations.createIndex({ doctorId: 1, isActive: 1 });
db.doctorPatientRelations.createIndex({ patientId: 1, isActive: 1 });

// Message indexes
db.messages.createIndex({ conversationId: 1, sentAt: 1 });
db.messages.createIndex({ receiverId: 1, isRead: 1 });