// Appointment controller for CareGuardian
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

const appointmentController = {
  // Get all appointments for the logged-in user
  async getUserAppointments(req, res) {
    try {
      const appointments = await Appointment.getUserAppointments(req.user.id);
      res.status(200).json(appointments);
    } catch (error) {
      console.error('Error getting user appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
    }
  },

  // Get upcoming appointments for the logged-in user
  async getUpcomingAppointments(req, res) {
    try {
      const appointments = await Appointment.getUpcomingUserAppointments(req.user.id);
      res.status(200).json(appointments);
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      res.status(500).json({ message: 'Failed to fetch upcoming appointments', error: error.message });
    }
  },

  // Get past appointments for the logged-in user
  async getPastAppointments(req, res) {
    try {
      const appointments = await Appointment.getPastUserAppointments(req.user.id);
      res.status(200).json(appointments);
    } catch (error) {
      console.error('Error getting past appointments:', error);
      res.status(500).json({ message: 'Failed to fetch past appointments', error: error.message });
    }
  },

  // Get appointment by ID
  async getAppointmentById(req, res) {
    try {
      const appointment = await Appointment.getById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check if the appointment belongs to the logged-in user
      if (appointment.patient_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this appointment' });
      }
      
      res.status(200).json(appointment);
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      res.status(500).json({ message: 'Failed to fetch appointment', error: error.message });
    }
  },

  // Create a new appointment
  async createAppointment(req, res) {
    try {
      const { doctor_id, appointment_date, appointment_time, reason, notes } = req.body;
      
      if (!doctor_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ message: 'Doctor, date, and time are required' });
      }
      
      // Verify doctor exists
      const doctor = await Doctor.getById(doctor_id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Check if time slot is available
      const isAvailable = await Appointment.isTimeSlotAvailable(doctor_id, appointment_date, appointment_time);
      if (!isAvailable) {
        return res.status(409).json({ message: 'The selected time slot is already booked' });
      }
      
      // Create appointment
      const appointment = await Appointment.create({
        patient_id: req.user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        notes,
        status: 'scheduled'
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Failed to create appointment', error: error.message });
    }
  },

  // Update an appointment
  async updateAppointment(req, res) {
    try {
      const { appointment_date, appointment_time, reason, notes, status } = req.body;
      const appointmentId = req.params.id;
      
      // Verify appointment exists and belongs to the user
      const existingAppointment = await Appointment.getById(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (existingAppointment.patient_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this appointment' });
      }
      
      // If changing date/time, check availability
      if ((appointment_date && appointment_date !== existingAppointment.appointment_date) || 
          (appointment_time && appointment_time !== existingAppointment.appointment_time)) {
        
        const isAvailable = await Appointment.isTimeSlotAvailable(
          existingAppointment.doctor_id, 
          appointment_date || existingAppointment.appointment_date,
          appointment_time || existingAppointment.appointment_time
        );
        
        if (!isAvailable) {
          return res.status(409).json({ message: 'The selected time slot is already booked' });
        }
      }
      
      // Update appointment
      const updatedAppointment = await Appointment.update(appointmentId, {
        appointment_date,
        appointment_time,
        reason,
        notes,
        status
      });
      
      res.status(200).json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Failed to update appointment', error: error.message });
    }
  },

  // Cancel an appointment
  async cancelAppointment(req, res) {
    try {
      const { reason } = req.body;
      const appointmentId = req.params.id;
      
      // Verify appointment exists and belongs to the user
      const existingAppointment = await Appointment.getById(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (existingAppointment.patient_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
      }
      
      // Check if appointment can be cancelled
      if (existingAppointment.status === 'completed' || existingAppointment.status === 'cancelled') {
        return res.status(400).json({ 
          message: `Cannot cancel an appointment that is already ${existingAppointment.status}`
        });
      }
      
      // Cancel appointment
      const cancelledAppointment = await Appointment.cancel(appointmentId, reason);
      
      res.status(200).json(cancelledAppointment);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
    }
  },

  // Delete an appointment
  async deleteAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      
      // Verify appointment exists and belongs to the user
      const existingAppointment = await Appointment.getById(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (existingAppointment.patient_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this appointment' });
      }
      
      // Delete appointment
      const deleted = await Appointment.delete(appointmentId);
      
      if (deleted) {
        res.status(200).json({ message: 'Appointment deleted successfully' });
      } else {
        res.status(400).json({ message: 'Failed to delete appointment' });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: 'Failed to delete appointment', error: error.message });
    }
  },

  // Get available slots for a doctor on a specific date
  async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.params;
      
      if (!doctorId || !date) {
        return res.status(400).json({ message: 'Doctor ID and date are required' });
      }
      
      // Verify doctor exists
      const doctor = await Doctor.getById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const availableSlots = await Appointment.getDoctorAvailableSlots(doctorId, date);
      
      res.status(200).json(availableSlots);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: 'Failed to fetch available slots', error: error.message });
    }
  }
};

export default appointmentController;