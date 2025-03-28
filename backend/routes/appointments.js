const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/auth');

// Apply authentication middleware to all appointment routes
router.use(authenticateToken);

// @route   GET /api/appointments
// @desc    Get all appointments for the authenticated user
// @access  Private
router.get('/', appointmentController.getUserAppointments);

// @route   GET /api/appointments/slots
// @desc    Get available time slots for a doctor on a specific date
// @access  Private
router.get('/slots', appointmentController.getAvailableSlots);

// @route   GET /api/appointments/:id
// @desc    Get a single appointment by ID
// @access  Private
router.get('/:id', appointmentController.getAppointmentById);

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', appointmentController.createAppointment);

// @route   PUT /api/appointments/:id
// @desc    Update an appointment
// @access  Private
router.put('/:id', appointmentController.updateAppointment);

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private
router.put('/:id/cancel', appointmentController.cancelAppointment);

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment
// @access  Private/Admin
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;