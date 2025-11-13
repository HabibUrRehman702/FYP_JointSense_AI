const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Swagger
const { swaggerUi, swaggerSpec } = require('./swagger');

// Import custom middleware
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/joint-sense-ai');
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host || 'MongoDB Atlas'}`);
    console.log(`📊 Database: ${conn.connection.name || 'Joint_Sense_AI'}`);
    
    // Import models after successful connection
    require('./models');
    console.log('📁 Models loaded successfully');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Joint Sense AI Backend',
    version: '1.0.0'
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Joint Sense AI API Documentation'
}));

// Import routes
const apiRoutes = require('./routes');

// API routes
app.use('/api', apiRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Joint Sense AI - Knee Osteoarthritis Prediction API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      xrays: '/api/xrays',
      predictions: '/api/predictions',
      recommendations: '/api/recommendations',
      activity: '/api/activity',
      diet: '/api/diet',
      weight: '/api/weight',
      medications: '/api/medications',
      progress: '/api/progress',
      consultations: '/api/consultations',
      messages: '/api/messages',
      forum: '/api/forum',
      notifications: '/api/notifications',
      doctorPatientRelations: '/api/doctor-patient-relations',
      klGrades: '/api/kl-grades',
      auditLogs: '/api/audit-logs'
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});