// Appointment routes for CareGuardian
import express from 'express';
import appointmentController from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - all routes require authentication
router.use(protect);

// Get all appointments for the logged-in user
router.get('/', appointmentController.getUserAppointments);

// Get upcoming appointments for the logged-in user
router.get('/upcoming', appointmentController.getUpcomingAppointments);

// Get past appointments for the logged-in user
router.get('/past', appointmentController.getPastAppointments);

// Get a specific appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Book a new appointment
router.post('/', appointmentController.createAppointment);

// Update an appointment
router.put('/:id', appointmentController.updateAppointment);

// Cancel an appointment
router.put('/:id/cancel', appointmentController.cancelAppointment);

// Delete an appointment
router.delete('/:id', appointmentController.deleteAppointment);

// Get available slots for a doctor on a specific date
router.get('/slots/:doctorId/:date', appointmentController.getAvailableSlots);

export default router;