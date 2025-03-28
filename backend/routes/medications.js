const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const authenticateToken = require('../middleware/auth');

// Apply authentication middleware to all medication routes
router.use(authenticateToken);

// @route   GET /api/medications
// @desc    Get all medications for the authenticated user
// @access  Private
router.get('/', medicationController.getUserMedications);

// @route   GET /api/medications/:id
// @desc    Get a single medication by ID
// @access  Private
router.get('/:id', medicationController.getMedicationById);

// @route   POST /api/medications
// @desc    Create a new medication
// @access  Private
router.post('/', medicationController.createMedication);

// @route   PUT /api/medications/:id
// @desc    Update a medication
// @access  Private
router.put('/:id', medicationController.updateMedication);

// @route   PUT /api/medications/:id/reminders
// @desc    Update medication reminder settings
// @access  Private
router.put('/:id/reminders', medicationController.updateReminders);

// @route   DELETE /api/medications/:id
// @desc    Delete a medication
// @access  Private
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;