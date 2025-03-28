const Doctor = require('../models/Doctor');

// Doctor Controller
const doctorController = {
  // @desc    Get all doctors
  // @route   GET /api/doctors
  // @access  Public
  async getDoctors(req, res) {
    try {
      const { specialty, search } = req.query;
      
      let doctors;
      
      if (search) {
        doctors = await Doctor.search(search);
      } else if (specialty) {
        doctors = await Doctor.getBySpecialty(specialty);
      } else {
        doctors = await Doctor.getAll();
      }
      
      res.json(doctors);
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({
        message: 'Server error while getting doctors',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get a single doctor by ID
  // @route   GET /api/doctors/:id
  // @access  Public
  async getDoctorById(req, res) {
    try {
      const doctor = await Doctor.getById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({
          message: 'Doctor not found'
        });
      }
      
      res.json(doctor);
    } catch (error) {
      console.error('Get doctor by id error:', error);
      res.status(500).json({
        message: 'Server error while getting doctor',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Create a new doctor
  // @route   POST /api/doctors
  // @access  Private/Admin
  async createDoctor(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to add doctors'
        });
      }
      
      const { 
        name, specialty, qualification, experience, hospital_id, 
        email, phone, bio, consultation_fee, available_days, 
        available_time, photo_url 
      } = req.body;
      
      // Validate required fields
      if (!name || !specialty || !qualification) {
        return res.status(400).json({
          message: 'Please provide name, specialty, and qualification'
        });
      }
      
      const doctor = await Doctor.create({
        name,
        specialty,
        qualification,
        experience,
        hospital_id,
        email,
        phone,
        bio,
        consultation_fee,
        available_days,
        available_time,
        photo_url
      });
      
      res.status(201).json(doctor);
    } catch (error) {
      console.error('Create doctor error:', error);
      res.status(500).json({
        message: 'Server error while creating doctor',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update a doctor
  // @route   PUT /api/doctors/:id
  // @access  Private/Admin
  async updateDoctor(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to update doctors'
        });
      }
      
      const doctor = await Doctor.getById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({
          message: 'Doctor not found'
        });
      }
      
      const updatedDoctor = await Doctor.update(req.params.id, req.body);
      
      if (!updatedDoctor) {
        return res.status(400).json({
          message: 'No valid fields to update'
        });
      }
      
      res.json(updatedDoctor);
    } catch (error) {
      console.error('Update doctor error:', error);
      res.status(500).json({
        message: 'Server error while updating doctor',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Delete a doctor
  // @route   DELETE /api/doctors/:id
  // @access  Private/Admin
  async deleteDoctor(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to delete doctors'
        });
      }
      
      const doctor = await Doctor.getById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({
          message: 'Doctor not found'
        });
      }
      
      const deleted = await Doctor.delete(req.params.id);
      
      if (!deleted) {
        return res.status(400).json({
          message: 'Failed to delete doctor'
        });
      }
      
      res.json({ message: 'Doctor removed' });
    } catch (error) {
      console.error('Delete doctor error:', error);
      res.status(500).json({
        message: 'Server error while deleting doctor',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get all doctor specialties
  // @route   GET /api/doctors/specialties
  // @access  Public
  async getSpecialties(req, res) {
    try {
      const specialties = await Doctor.getAllSpecialties();
      
      res.json(specialties);
    } catch (error) {
      console.error('Get specialties error:', error);
      res.status(500).json({
        message: 'Server error while getting specialties',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  }
};

module.exports = doctorController;