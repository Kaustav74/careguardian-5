const Medication = require('../models/Medication');

// Medication Controller
const medicationController = {
  // @desc    Get all medications for the authenticated user
  // @route   GET /api/medications
  // @access  Private
  async getUserMedications(req, res) {
    try {
      const { status } = req.query;
      
      let medications;
      
      if (status === 'active') {
        medications = await Medication.getActiveMedications(req.user.id);
      } else if (status === 'completed') {
        medications = await Medication.getCompletedMedications(req.user.id);
      } else if (status === 'reminders') {
        medications = await Medication.getMedicationsWithReminders(req.user.id);
      } else {
        medications = await Medication.getUserMedications(req.user.id);
      }
      
      res.json(medications);
    } catch (error) {
      console.error('Get user medications error:', error);
      res.status(500).json({
        message: 'Server error while getting medications',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get a single medication by ID
  // @route   GET /api/medications/:id
  // @access  Private
  async getMedicationById(req, res) {
    try {
      const medication = await Medication.getById(req.params.id);
      
      if (!medication) {
        return res.status(404).json({
          message: 'Medication not found'
        });
      }
      
      // Check if the medication belongs to the authenticated user or the user is a doctor/admin
      if (
        medication.user_id !== req.user.id && 
        medication.prescribed_by !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'doctor'
      ) {
        return res.status(403).json({
          message: 'Not authorized to access this medication'
        });
      }
      
      res.json(medication);
    } catch (error) {
      console.error('Get medication by id error:', error);
      res.status(500).json({
        message: 'Server error while getting medication',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Create a new medication
  // @route   POST /api/medications
  // @access  Private
  async createMedication(req, res) {
    try {
      const {
        name, dosage, frequency, start_date, end_date,
        prescribed_by, instructions, side_effects, refills_left,
        appointment_id, active, reminder_time, reminder_days
      } = req.body;
      
      // Validate required fields
      if (!name || !dosage || !frequency) {
        return res.status(400).json({
          message: 'Please provide medication name, dosage, and frequency'
        });
      }
      
      // Check if user is creating for themselves or if they are a doctor/admin
      const forUserId = req.body.user_id || req.user.id;
      
      if (forUserId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'doctor') {
        return res.status(403).json({
          message: 'Not authorized to create medications for other users'
        });
      }
      
      // Create medication
      const medicationData = {
        user_id: forUserId,
        name,
        dosage,
        frequency,
        start_date,
        end_date,
        prescribed_by,
        instructions,
        side_effects,
        refills_left,
        appointment_id,
        active,
        reminder_time,
        reminder_days
      };
      
      const medication = await Medication.create(medicationData);
      
      res.status(201).json(medication);
    } catch (error) {
      console.error('Create medication error:', error);
      res.status(500).json({
        message: 'Server error while creating medication',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update a medication
  // @route   PUT /api/medications/:id
  // @access  Private
  async updateMedication(req, res) {
    try {
      const medication = await Medication.getById(req.params.id);
      
      if (!medication) {
        return res.status(404).json({
          message: 'Medication not found'
        });
      }
      
      // Check if user is authorized (the patient, the prescribing doctor, or an admin)
      if (
        medication.user_id !== req.user.id && 
        medication.prescribed_by !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to update this medication'
        });
      }
      
      // Filter fields based on user role
      const allowedUpdate = {};
      
      if (req.user.role === 'admin' || req.user.role === 'doctor') {
        // Admins and doctors can update medical details
        const medicalFields = [
          'name', 'dosage', 'frequency', 'start_date', 'end_date',
          'instructions', 'side_effects', 'refills_left', 'active'
        ];
        
        medicalFields.forEach(field => {
          if (req.body[field] !== undefined) {
            allowedUpdate[field] = req.body[field];
          }
        });
      } else {
        // Patients can only update reminders and active status
        const patientFields = ['active', 'reminder_time', 'reminder_days'];
        
        patientFields.forEach(field => {
          if (req.body[field] !== undefined) {
            allowedUpdate[field] = req.body[field];
          }
        });
      }
      
      const updatedMedication = await Medication.update(req.params.id, allowedUpdate);
      
      if (!updatedMedication) {
        return res.status(400).json({
          message: 'No valid fields to update'
        });
      }
      
      res.json(updatedMedication);
    } catch (error) {
      console.error('Update medication error:', error);
      res.status(500).json({
        message: 'Server error while updating medication',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Delete a medication
  // @route   DELETE /api/medications/:id
  // @access  Private
  async deleteMedication(req, res) {
    try {
      const medication = await Medication.getById(req.params.id);
      
      if (!medication) {
        return res.status(404).json({
          message: 'Medication not found'
        });
      }
      
      // Check if user is authorized (admin, the prescribing doctor, or the patient)
      if (
        medication.user_id !== req.user.id && 
        medication.prescribed_by !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to delete this medication'
        });
      }
      
      const deleted = await Medication.delete(req.params.id);
      
      if (!deleted) {
        return res.status(400).json({
          message: 'Failed to delete medication'
        });
      }
      
      res.json({ message: 'Medication removed' });
    } catch (error) {
      console.error('Delete medication error:', error);
      res.status(500).json({
        message: 'Server error while deleting medication',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update medication reminder settings
  // @route   PUT /api/medications/:id/reminders
  // @access  Private
  async updateReminders(req, res) {
    try {
      const medication = await Medication.getById(req.params.id);
      
      if (!medication) {
        return res.status(404).json({
          message: 'Medication not found'
        });
      }
      
      // Only the patient can update their reminder settings
      if (medication.user_id !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to update reminder settings for this medication'
        });
      }
      
      const { reminder_time, reminder_days } = req.body;
      
      // Validate input
      if (!reminder_time && !reminder_days) {
        return res.status(400).json({
          message: 'Please provide at least reminder time or days'
        });
      }
      
      const updatedMedication = await Medication.updateReminderSettings(
        req.params.id,
        reminder_time,
        reminder_days
      );
      
      res.json(updatedMedication);
    } catch (error) {
      console.error('Update reminders error:', error);
      res.status(500).json({
        message: 'Server error while updating reminder settings',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  }
};

module.exports = medicationController;