const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const authenticateToken = require('../middleware/auth');

// @route   GET /api/hospitals
// @desc    Get all hospitals or filter by city, search term, emergency, or ambulance services
// @access  Public
router.get('/', hospitalController.getHospitals);

// @route   GET /api/hospitals/:id
// @desc    Get a single hospital by ID
// @access  Public
router.get('/:id', hospitalController.getHospitalById);

// @route   GET /api/hospitals/:id/doctors
// @desc    Get doctors by hospital ID
// @access  Public
router.get('/:id/doctors', hospitalController.getDoctorsByHospital);

// @route   POST /api/hospitals
// @desc    Create a new hospital
// @access  Private/Admin
router.post('/', authenticateToken, hospitalController.createHospital);

// @route   PUT /api/hospitals/:id
// @desc    Update a hospital
// @access  Private/Admin
router.put('/:id', authenticateToken, hospitalController.updateHospital);

// @route   DELETE /api/hospitals/:id
// @desc    Delete a hospital
// @access  Private/Admin
router.delete('/:id', authenticateToken, hospitalController.deleteHospital);

module.exports = router;