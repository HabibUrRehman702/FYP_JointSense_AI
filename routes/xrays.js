const express = require('express');
const multer = require('multer');
const path = require('path');
const { XRayImage, AuditLog } = require('../models');
const { getClientIP } = require('../utils/ipUtils');
const { auth, authorizePatientAccess } = require('../middleware/auth');

const router = express.Router();

// XRay image upload and management endpoints

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/xrays/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'xray-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/xrays/user/:userId - Get all X-ray images for a user
const getUserXRays = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let query = { userId: req.params.userId };
    
    if (status) {
      query.processingStatus = status;
    }

    const xrays = await XRayImage.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ uploadedAt: -1 });

    const total = await XRayImage.countDocuments(query);

    res.json({
      success: true,
      count: xrays.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        xrays
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/xrays/:id - Get single X-ray image
const getXRay = async (req, res) => {
  try {
    const xray = await XRayImage.findById(req.params.id);
    
    if (!xray) {
      return res.status(404).json({
        success: false,
        message: 'X-ray image not found'
      });
    }

    res.json({
      success: true,
      data: {
        xray
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/xrays - Upload X-ray image (multipart/form-data)
const uploadXRay = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const {
      userId,
      captureDate,
      equipment,
      position,
      kVp,
      mAs
    } = req.body;

    // Ensure user can only upload for themselves or doctor can upload for patient
    if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Patients can only upload their own X-rays'
      });
    }

    const xray = await XRayImage.create({
      userId: userId || req.user._id,
      imageUrl: `/uploads/xrays/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      metadata: {
        captureDate: captureDate ? new Date(captureDate) : new Date(),
        equipment,
        position: position || 'AP',
        technique: {
          kVp: kVp ? parseInt(kVp) : undefined,
          mAs: mAs ? parseInt(mAs) : undefined
        }
      }
    });

    // Log activity
    await AuditLog.logActivity({
      userId: req.user._id,
      action: 'xray_uploaded',
      entity: 'xrayImages',
      entityId: xray._id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'X-ray image uploaded successfully',
      data: {
        xray
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/xrays/:id - Update X-ray image metadata
const updateXRay = async (req, res) => {
  try {
    const allowedFields = [
      'metadata',
      'processingStatus',
      'isProcessed'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const xray = await XRayImage.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!xray) {
      return res.status(404).json({
        success: false,
        message: 'X-ray image not found'
      });
    }

    res.json({
      success: true,
      message: 'X-ray image updated successfully',
      data: {
        xray
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/xrays/:id - Delete X-ray image
const deleteXRay = async (req, res) => {
  try {
    const xray = await XRayImage.findById(req.params.id);
    
    if (!xray) {
      return res.status(404).json({
        success: false,
        message: 'X-ray image not found'
      });
    }

    // Check if user can delete this X-ray
    if (req.user.role === 'patient' && req.user._id.toString() !== xray.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this X-ray'
      });
    }

    await XRayImage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'X-ray image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
router.get('/user/:userId', auth, authorizePatientAccess, getUserXRays);
router.get('/:id', auth, getXRay);
router.post('/', auth, upload.single('xrayImage'), uploadXRay);
router.put('/:id', auth, updateXRay);
router.delete('/:id', auth, deleteXRay);

module.exports = router;