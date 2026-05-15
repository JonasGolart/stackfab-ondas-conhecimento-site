const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const inscriptionController = require('../controllers/inscriptionController');
const authController = require('../controllers/authController');
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Public routes
router.post('/inscriptions', inscriptionController.createInscription);
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/materials', materialController.getAllMaterials); // Público para participantes

// Protected routes (Admin only)
router.get('/admin/inscriptions', authMiddleware, inscriptionController.getAllInscriptions);
router.post('/admin/materials', authMiddleware, upload.single('file'), materialController.createMaterial);
router.delete('/admin/materials/:id', authMiddleware, materialController.deleteMaterial);

module.exports = router;
