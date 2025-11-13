const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    next();
  };
};

// Middleware to check if user can access patient data
const authorizePatientAccess = async (req, res, next) => {
  try {
    const { DoctorPatientRelation } = require('../models');
    const userId = req.params.userId || req.params.patientId || req.body.userId;
    
    // Admin can access all data
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Users can access their own data
    if (req.user._id.toString() === userId) {
      return next();
    }
    
    // Doctors can access their patients' data
    if (req.user.role === 'doctor') {
      const relation = await DoctorPatientRelation.findOne({
        doctorId: req.user._id,
        patientId: userId,
        isActive: true
      });
      
      if (relation) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied to this patient data'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking access permissions'
    });
  }
};

module.exports = {
  auth,
  authorize,
  authorizePatientAccess
};