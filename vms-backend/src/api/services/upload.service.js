const multer = require('multer');
const storageService = require('./storage.service');

// Memory storage configuration for handling uploads
const memoryStorage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Upload configuration
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Custom middleware to handle file uploads to storage service
const uploadToStorage = async (req, res, next) => {
  try {
    if (!req.files) {
      return next();
    }

    // Process each file and upload to configured storage
    for (const [fieldName, files] of Object.entries(req.files)) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to storage service (S3 or Azure)
        const uploadResult = await storageService.uploadImage(
          file.buffer,
          file.originalname,
          fieldName // Use field name as folder
        );

        // Add storage info to file object
        file.key = uploadResult.key;
        file.location = uploadResult.url;
        file.storageType = uploadResult.storageType;
      }
    }

    console.log(`📁 Files uploaded to ${storageService.getStorageInfo().type} storage:`, 
      Object.keys(req.files).map(field => `${field}: ${req.files[field].length} file(s)`));
    
    next();
  } catch (error) {
    console.error('Error uploading files to storage:', error);
    res.status(500).json({ 
      message: 'Failed to upload files to storage',
      error: error.message 
    });
  }
};

// Combined middleware for visitor images
const uploadVisitorImages = [
  upload.fields([
    { name: 'visitorPhoto', maxCount: 1 },
    { name: 'idPhoto', maxCount: 1 }
  ]),
  uploadToStorage
];

// Single file upload middleware
const uploadSingle = (fieldName) => [
  upload.single(fieldName),
  uploadToStorage
];

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5) => [
  upload.array(fieldName, maxCount),
  uploadToStorage
];

module.exports = {
  upload,
  uploadToStorage,
  uploadVisitorImages,
  uploadSingle,
  uploadMultiple,
  // For CSV uploads (no storage needed)
  uploadCSV: multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed!'), false);
      }
    }
  }).single('file')
};
