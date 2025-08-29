// vms-backend/src/api/services/s3.service.js
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadVisitorImages = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'private',
    key: function (req, file, cb) {
      const tenantId = req.tenant.id;
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, `${tenantId}/images/${year}/${month}/${fileName}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('File upload only supports JPEG, JPG, PNG'));
  },
}).fields([
  { name: 'visitorPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 },
]);

module.exports = { uploadVisitorImages };