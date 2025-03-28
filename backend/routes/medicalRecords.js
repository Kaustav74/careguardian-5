const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const authenticateToken = require('../middleware/auth');

// Apply authentication middleware to all medical record routes
router.use(authenticateToken);

// @route   GET /api/medical-records
// @desc    Get all medical records for the authenticated user
// @access  Private
router.get('/', medicalRecordController.getUserMedicalRecords);

// @route   GET /api/medical-records/types
// @desc    Get all record types for the authenticated user
// @access  Private
router.get('/types', medicalRecordController.getUserRecordTypes);

// @route   GET /api/medical-records/:id
// @desc    Get a single medical record by ID
// @access  Private
router.get('/:id', medicalRecordController.getMedicalRecordById);

// @route   POST /api/medical-records
// @desc    Create a new medical record
// @access  Private
router.post('/', medicalRecordController.createMedicalRecord);

// @route   PUT /api/medical-records/:id
// @desc    Update a medical record
// @access  Private
router.put('/:id', medicalRecordController.updateMedicalRecord);

// @route   DELETE /api/medical-records/:id
// @desc    Delete a medical record
// @access  Private
router.delete('/:id', medicalRecordController.deleteMedicalRecord);

module.exports = router;