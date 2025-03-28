// Doctor routes for CareGuardian
import express from 'express';
import doctorController from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/specialties', doctorController.getSpecialties);
router.get('/search', doctorController.searchDoctors);
router.get('/specialty/:specialty', doctorController.getDoctorsBySpecialty);
router.get('/:id', doctorController.getDoctorById);

export default router;