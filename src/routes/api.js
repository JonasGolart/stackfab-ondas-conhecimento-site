const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const inscriptionController = require('../controllers/inscriptionController');
const authController = require('../controllers/authController');
const materialController = require('../controllers/materialController');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, '../../uploads');
    cb(null, uploadPath);
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
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/materials', materialController.getAllMaterials); // Público para participantes
router.get('/categories', categoryController.getAllCategories); // Público para participantes/filtros

// Protected routes (Admin only)
router.get('/admin/inscriptions', authMiddleware, inscriptionController.getAllInscriptions);
router.post('/admin/materials', authMiddleware, upload.single('file'), materialController.createMaterial);
router.delete('/admin/materials/:id', authMiddleware, materialController.deleteMaterial);
router.post('/admin/categories', authMiddleware, categoryController.createCategory);
router.delete('/admin/categories/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
