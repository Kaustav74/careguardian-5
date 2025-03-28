const Hospital = require('../models/Hospital');

// Hospital Controller
const hospitalController = {
  // @desc    Get all hospitals
  // @route   GET /api/hospitals
  // @access  Public
  async getHospitals(req, res) {
    try {
      const { city, search, emergency, ambulance } = req.query;
      
      let hospitals;
      
      if (search) {
        hospitals = await Hospital.search(search);
      } else if (city) {
        hospitals = await Hospital.getHospitalsByCity(city);
      } else if (emergency === 'true') {
        hospitals = await Hospital.getHospitalsWithEmergencyServices();
      } else if (ambulance === 'true') {
        hospitals = await Hospital.getHospitalsWithAmbulanceServices();
      } else {
        hospitals = await Hospital.getAll();
      }
      
      res.json(hospitals);
    } catch (error) {
      console.error('Get hospitals error:', error);
      res.status(500).json({
        message: 'Server error while getting hospitals',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get a single hospital by ID
  // @route   GET /api/hospitals/:id
  // @access  Public
  async getHospitalById(req, res) {
    try {
      const hospital = await Hospital.getById(req.params.id);
      
      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found'
        });
      }
      
      res.json(hospital);
    } catch (error) {
      console.error('Get hospital by id error:', error);
      res.status(500).json({
        message: 'Server error while getting hospital',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get doctors by hospital ID
  // @route   GET /api/hospitals/:id/doctors
  // @access  Public
  async getDoctorsByHospital(req, res) {
    try {
      const hospital = await Hospital.getById(req.params.id);
      
      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found'
        });
      }
      
      const doctors = await Hospital.getDoctorsByHospitalId(req.params.id);
      
      res.json(doctors);
    } catch (error) {
      console.error('Get doctors by hospital error:', error);
      res.status(500).json({
        message: 'Server error while getting doctors for hospital',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Create a new hospital
  // @route   POST /api/hospitals
  // @access  Private/Admin
  async createHospital(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to add hospitals'
        });
      }
      
      const { 
        name, address, city, state, phone, email, website,
        facilities, specializations, emergency_services,
        ambulance_services, beds_available, image_url, location_lat,
        location_lng, rating
      } = req.body;
      
      // Validate required fields
      if (!name || !address || !city) {
        return res.status(400).json({
          message: 'Please provide name, address, and city'
        });
      }
      
      const hospital = await Hospital.create({
        name,
        address,
        city,
        state,
        phone,
        email,
        website,
        facilities,
        specializations,
        emergency_services,
        ambulance_services,
        beds_available,
        image_url,
        location_lat,
        location_lng,
        rating
      });
      
      res.status(201).json(hospital);
    } catch (error) {
      console.error('Create hospital error:', error);
      res.status(500).json({
        message: 'Server error while creating hospital',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update a hospital
  // @route   PUT /api/hospitals/:id
  // @access  Private/Admin
  async updateHospital(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to update hospitals'
        });
      }
      
      const hospital = await Hospital.getById(req.params.id);
      
      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found'
        });
      }
      
      const updatedHospital = await Hospital.update(req.params.id, req.body);
      
      if (!updatedHospital) {
        return res.status(400).json({
          message: 'No valid fields to update'
        });
      }
      
      res.json(updatedHospital);
    } catch (error) {
      console.error('Update hospital error:', error);
      res.status(500).json({
        message: 'Server error while updating hospital',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Delete a hospital
  // @route   DELETE /api/hospitals/:id
  // @access  Private/Admin
  async deleteHospital(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to delete hospitals'
        });
      }
      
      const hospital = await Hospital.getById(req.params.id);
      
      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found'
        });
      }
      
      const deleted = await Hospital.delete(req.params.id);
      
      if (!deleted) {
        return res.status(400).json({
          message: 'Failed to delete hospital'
        });
      }
      
      res.json({ message: 'Hospital removed' });
    } catch (error) {
      console.error('Delete hospital error:', error);
      res.status(500).json({
        message: 'Server error while deleting hospital',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  }
};

module.exports = hospitalController;