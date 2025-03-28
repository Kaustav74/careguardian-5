const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Appointment Controller
const appointmentController = {
  // @desc    Get all appointments for the authenticated user
  // @route   GET /api/appointments
  // @access  Private
  async getUserAppointments(req, res) {
    try {
      const { status } = req.query;
      
      let appointments;
      
      if (status === 'upcoming') {
        appointments = await Appointment.getUpcomingUserAppointments(req.user.id);
      } else if (status === 'past') {
        appointments = await Appointment.getPastUserAppointments(req.user.id);
      } else {
        appointments = await Appointment.getUserAppointments(req.user.id);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error('Get user appointments error:', error);
      res.status(500).json({
        message: 'Server error while getting appointments',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get a single appointment by ID
  // @route   GET /api/appointments/:id
  // @access  Private
  async getAppointmentById(req, res) {
    try {
      const appointment = await Appointment.getById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found'
        });
      }
      
      // Check if the appointment belongs to the authenticated user or the user is a doctor/admin
      if (
        appointment.user_id !== req.user.id && 
        appointment.doctor_id !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to access this appointment'
        });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Get appointment by id error:', error);
      res.status(500).json({
        message: 'Server error while getting appointment',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Create a new appointment
  // @route   POST /api/appointments
  // @access  Private
  async createAppointment(req, res) {
    try {
      const {
        doctor_id, appointment_date, appointment_time,
        reason, symptoms, notes
      } = req.body;
      
      // Validate required fields
      if (!doctor_id || !appointment_date || !appointment_time) {
        return res.status(400).json({
          message: 'Please provide doctor, date, and time'
        });
      }
      
      // Check if doctor exists
      const doctor = await Doctor.getById(doctor_id);
      if (!doctor) {
        return res.status(400).json({
          message: 'Doctor not found'
        });
      }
      
      // Check if time slot is available
      const isAvailable = await Appointment.isTimeSlotAvailable(doctor_id, appointment_date, appointment_time);
      if (!isAvailable) {
        return res.status(400).json({
          message: 'This time slot is not available'
        });
      }
      
      // Create appointment
      const appointment = await Appointment.create({
        user_id: req.user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        symptoms,
        notes,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: doctor.consultation_fee || 0
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({
        message: 'Server error while creating appointment',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Update an appointment
  // @route   PUT /api/appointments/:id
  // @access  Private
  async updateAppointment(req, res) {
    try {
      const appointment = await Appointment.getById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found'
        });
      }
      
      // Check if user is authorized (the patient, the doctor, or an admin)
      if (
        appointment.user_id !== req.user.id && 
        appointment.doctor_id !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to update this appointment'
        });
      }
      
      // If changing date/time, check if new slot is available
      if (
        (req.body.appointment_date && req.body.appointment_date !== appointment.appointment_date) ||
        (req.body.appointment_time && req.body.appointment_time !== appointment.appointment_time)
      ) {
        const isAvailable = await Appointment.isTimeSlotAvailable(
          appointment.doctor_id,
          req.body.appointment_date || appointment.appointment_date,
          req.body.appointment_time || appointment.appointment_time
        );
        
        if (!isAvailable) {
          return res.status(400).json({
            message: 'This time slot is not available'
          });
        }
      }
      
      // Filter fields based on user role
      const allowedUpdate = {};
      
      if (req.user.role === 'admin') {
        // Admin can update anything
        Object.assign(allowedUpdate, req.body);
      } else if (appointment.doctor_id === req.user.id) {
        // Doctor can update status, notes, prescription, etc.
        const doctorAllowedFields = ['status', 'doctor_notes', 'prescription'];
        
        doctorAllowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            allowedUpdate[field] = req.body[field];
          }
        });
      } else {
        // Patient can update reason, symptoms, notes, and reschedule
        const patientAllowedFields = ['reason', 'symptoms', 'notes', 'appointment_date', 'appointment_time'];
        
        patientAllowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            allowedUpdate[field] = req.body[field];
          }
        });
        
        // Only allow rescheduling if appointment is pending
        if (
          (allowedUpdate.appointment_date || allowedUpdate.appointment_time) &&
          appointment.status !== 'pending'
        ) {
          return res.status(400).json({
            message: 'Cannot reschedule a confirmed, completed, or cancelled appointment'
          });
        }
      }
      
      const updatedAppointment = await Appointment.update(req.params.id, allowedUpdate);
      
      if (!updatedAppointment) {
        return res.status(400).json({
          message: 'No valid fields to update'
        });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({
        message: 'Server error while updating appointment',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Cancel an appointment
  // @route   PUT /api/appointments/:id/cancel
  // @access  Private
  async cancelAppointment(req, res) {
    try {
      const appointment = await Appointment.getById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found'
        });
      }
      
      // Check if user is authorized (the patient, the doctor, or an admin)
      if (
        appointment.user_id !== req.user.id && 
        appointment.doctor_id !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Not authorized to cancel this appointment'
        });
      }
      
      // Check if appointment can be cancelled
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        return res.status(400).json({
          message: 'Cannot cancel an appointment that is already completed or cancelled'
        });
      }
      
      const { reason } = req.body;
      
      const cancelledAppointment = await Appointment.cancel(req.params.id, reason);
      
      res.json({
        message: 'Appointment cancelled successfully',
        appointment: cancelledAppointment
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({
        message: 'Server error while cancelling appointment',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Delete an appointment
  // @route   DELETE /api/appointments/:id
  // @access  Private/Admin
  async deleteAppointment(req, res) {
    try {
      // Only admin can delete appointments
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Not authorized to delete appointments'
        });
      }
      
      const appointment = await Appointment.getById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found'
        });
      }
      
      const deleted = await Appointment.delete(req.params.id);
      
      if (!deleted) {
        return res.status(400).json({
          message: 'Failed to delete appointment'
        });
      }
      
      res.json({ message: 'Appointment removed' });
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(500).json({
        message: 'Server error while deleting appointment',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  },
  
  // @desc    Get available time slots for a doctor on a specific date
  // @route   GET /api/appointments/slots
  // @access  Private
  async getAvailableSlots(req, res) {
    try {
      const { doctor_id, date } = req.query;
      
      if (!doctor_id || !date) {
        return res.status(400).json({
          message: 'Please provide doctor_id and date'
        });
      }
      
      const slots = await Appointment.getDoctorAvailableSlots(doctor_id, date);
      
      res.json(slots);
    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({
        message: 'Server error while getting available slots',
        error: process.env.NODE_ENV === 'production' ? {} : error
      });
    }
  }
};

module.exports = appointmentController;