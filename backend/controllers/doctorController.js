// Doctor controller for CareGuardian
import Doctor from '../models/Doctor.js';

const doctorController = {
  // Get all doctors
  async getDoctors(req, res) {
    try {
      const doctors = await Doctor.getAll();
      res.status(200).json(doctors);
    } catch (error) {
      console.error('Error getting doctors:', error);
      res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
    }
  },

  // Get doctor by ID
  async getDoctorById(req, res) {
    try {
      const doctor = await Doctor.getById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      res.status(200).json(doctor);
    } catch (error) {
      console.error('Error getting doctor by ID:', error);
      res.status(500).json({ message: 'Failed to fetch doctor', error: error.message });
    }
  },

  // Get doctors by specialty
  async getDoctorsBySpecialty(req, res) {
    try {
      const { specialty } = req.params;
      
      if (!specialty) {
        return res.status(400).json({ message: 'Specialty is required' });
      }
      
      const doctors = await Doctor.getBySpecialty(specialty);
      res.status(200).json(doctors);
    } catch (error) {
      console.error('Error getting doctors by specialty:', error);
      res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
    }
  },

  // Search doctors
  async searchDoctors(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const doctors = await Doctor.search(query);
      res.status(200).json(doctors);
    } catch (error) {
      console.error('Error searching doctors:', error);
      res.status(500).json({ message: 'Failed to search doctors', error: error.message });
    }
  },

  // Get all specialties
  async getSpecialties(req, res) {
    try {
      const specialties = await Doctor.getAllSpecialties();
      res.status(200).json(specialties);
    } catch (error) {
      console.error('Error getting specialties:', error);
      res.status(500).json({ message: 'Failed to fetch specialties', error: error.message });
    }
  }
};

export default doctorController;