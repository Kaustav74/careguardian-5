const MedicalRecord = require('../models/MedicalRecord');

// Medical Record Controller
const medicalRecordController = {
  // @desc    Get all medical records for the authenticated user
  // @route   GET /api/medical-records
  // @access  Private
  async getUserMedicalRecords(req, res) {
    try {
      const { type, search } = req.query;
      
      let records;
      
      if (search) {
        records = await MedicalRecord.searchUserMedicalRecords(req.user.id, search);
      } else if (type) {
        records = await MedicalRecord.getUserMedicalRecordsByType(req.user.id, type);
      } else {
        records = await MedicalRecord.getUserMedicalRecords(req.user.id);
      }
      
      res.json(records);
    } catch (error) {
      console.error('Get user medical records error:', error);
      res.status(500).json({
        message: 'Server error while getting medical records',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get all record types for the authenticated user
  // @route   GET /api/medical-records/types
  // @access  Private
  async getUserRecordTypes(req, res) {
    try {
      const types = await MedicalRecord.getUserRecordTypes(req.user.id);
      
      res.json(types);
    } catch (error) {
      console.error('Get user record types error:', error);
      res.status(500).json({
        message: 'Server error while getting record types',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get a single medical record by ID
  // @route   GET /api/medical-records/:id
  // @access  Private
  async getMedicalRecordById(req, res) {
    try {
      const record = await MedicalRecord.getById(req.params.id);
      
      if (!record) {
        return res.status(404).json({
          message: 'Medical record not found'
        });
      }
      
      // Check if the record belongs to the authenticated user or the user is a doctor/admin
      if (
        record.user_id !== req.user.id && 
        record.doctor_id !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'doctor'
      ) {
        return res.status(403).json({
          message: 'Not authorized to access this medical record'
        });
      }
      
      res.json(record);
    } catch (error) {
      console.error('Get medical record by id error:', error);
      res.status(500).json({
        message: 'Server error while getting medical record',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Create a new medical record
  // @route   POST /api/medical-records
  // @access  Private
  async createMedicalRecord(req, res) {
    try {
      const {
        record_type, doctor_id, hospital_id, record_date,
        diagnosis, symptoms, treatment, notes, test_results,
        allergies, vitals, appointment_id, files
      } = req.body;
      
      // Validate required fields
      if (!record_type) {
        return res.status(400).json({
          message: 'Please provide record type'
        });
      }
      
      // Check if user is creating for themselves or if they are a doctor/admin
      const forUserId = req.body.user_id || req.user.id;
      
      if (forUserId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'doctor') {
        return res.status(403).json({
          message: 'Not authorized to create medical records for other users'
        });
      }
      
      // Create medical record
      const recordData = {
        user_id: forUserId,
        record_type,
        doctor_id,
        hospital_id,
        record_date,
        diagnosis,
        symptoms,
        treatment,
        notes,
        test_results,
        allergies,
        vitals,
        appointment_id,
        files
      };
      
      const record = await MedicalRecord.create(recordData);
      
      res.status(201).json(record);
    } catch (error) {
      console.error('Create medical record error:', error);
      res.status(500).json({
        message: 'Server error while creating medical record',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update a medical record
  // @route   PUT /api/medical-records/:id
  // @access  Private
  async updateMedicalRecord(req, res) {
    try {
      const record = await MedicalRecord.getById(req.params.id);
      
      if (!record) {
        return res.status(404).json({
          message: 'Medical record not found'
        });
      }
      
      // Check if user is authorized (the patient, the doctor who created it, or an admin)
      if (
        record.user_id !== req.user.id && 
        record.doctor_id !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to update this medical record'
        });
      }
      
      // Patient can only add notes to their records
      let allowedUpdate = {};
      
      if (req.user.role === 'admin' || req.user.role === 'doctor' || record.doctor_id === req.user.id) {
        // Doctors and admins can update everything
        allowedUpdate = req.body;
      } else {
        // Patients can only add notes
        if (req.body.notes) {
          allowedUpdate.notes = record.notes 
            ? `${record.notes}\n\nPatient note (${new Date().toISOString()}):\n${req.body.notes}`
            : `Patient note (${new Date().toISOString()}):\n${req.body.notes}`;
        }
      }
      
      const updatedRecord = await MedicalRecord.update(req.params.id, allowedUpdate);
      
      if (!updatedRecord) {
        return res.status(400).json({
          message: 'No valid fields to update'
        });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      console.error('Update medical record error:', error);
      res.status(500).json({
        message: 'Server error while updating medical record',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Delete a medical record
  // @route   DELETE /api/medical-records/:id
  // @access  Private
  async deleteMedicalRecord(req, res) {
    try {
      const record = await MedicalRecord.getById(req.params.id);
      
      if (!record) {
        return res.status(404).json({
          message: 'Medical record not found'
        });
      }
      
      // Only admin and the doctor who created it can delete records
      if (req.user.role !== 'admin' && record.doctor_id !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to delete this medical record'
        });
      }
      
      const deleted = await MedicalRecord.delete(req.params.id);
      
      if (!deleted) {
        return res.status(400).json({
          message: 'Failed to delete medical record'
        });
      }
      
      res.json({ message: 'Medical record removed' });
    } catch (error) {
      console.error('Delete medical record error:', error);
      res.status(500).json({
        message: 'Server error while deleting medical record',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  }
};

module.exports = medicalRecordController;