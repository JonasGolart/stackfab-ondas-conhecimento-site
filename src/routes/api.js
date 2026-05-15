const express = require('express');
const router = express.Router();
const inscriptionController = require('../controllers/inscriptionController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/inscriptions', inscriptionController.createInscription);
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Protected routes
router.get('/admin/inscriptions', authMiddleware, inscriptionController.getAllInscriptions);

module.exports = router;
