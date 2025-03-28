const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authenticateToken = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Get all doctors or filter by specialty or search term
// @access  Public
router.get('/', doctorController.getDoctors);

// @route   GET /api/doctors/specialties
// @desc    Get all doctor specialties
// @access  Public
router.get('/specialties', doctorController.getSpecialties);

// @route   GET /api/doctors/:id
// @desc    Get a single doctor by ID
// @access  Public
router.get('/:id', doctorController.getDoctorById);

// @route   POST /api/doctors
// @desc    Create a new doctor
// @access  Private/Admin
router.post('/', authenticateToken, doctorController.createDoctor);

// @route   PUT /api/doctors/:id
// @desc    Update a doctor
// @access  Private/Admin
router.put('/:id', authenticateToken, doctorController.updateDoctor);

// @route   DELETE /api/doctors/:id
// @desc    Delete a doctor
// @access  Private/Admin
router.delete('/:id', authenticateToken, doctorController.deleteDoctor);

module.exports = router;