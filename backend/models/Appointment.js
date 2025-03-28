// Appointment model functions
import { pool } from '../config/db.js';

const Appointment = {
  // Get all appointments for a user
  async getUserAppointments(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                d.specialty as doctor_specialty,
                d.consulting_fees as doctor_fee,
                u2.full_name as doctor_name,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u2 ON d.user_id = u2.id
         JOIN hospitals h ON d.hospital_id = h.id
         WHERE a.patient_id = $1
         ORDER BY a.appointment_date DESC, a.appointment_time`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  },
  
  // Get upcoming appointments for a user
  async getUpcomingUserAppointments(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                d.specialty as doctor_specialty,
                d.consulting_fees as doctor_fee,
                u2.full_name as doctor_name,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u2 ON d.user_id = u2.id
         JOIN hospitals h ON d.hospital_id = h.id
         WHERE a.patient_id = $1
           AND a.appointment_date >= CURRENT_DATE
           AND a.status NOT IN ('cancelled', 'rejected', 'completed')
         ORDER BY a.appointment_date, a.appointment_time`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting upcoming user appointments:', error);
      throw error;
    }
  },
  
  // Get past appointments for a user
  async getPastUserAppointments(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                d.specialty as doctor_specialty,
                d.consulting_fees as doctor_fee,
                u2.full_name as doctor_name,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u2 ON d.user_id = u2.id
         JOIN hospitals h ON d.hospital_id = h.id
         WHERE a.patient_id = $1
           AND (a.appointment_date < CURRENT_DATE
                OR a.status IN ('cancelled', 'rejected', 'completed'))
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting past user appointments:', error);
      throw error;
    }
  },
  
  // Get all appointments for a doctor
  async getDoctorAppointments(doctorId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                u.username as user_username, 
                u.full_name as user_full_name
         FROM appointments a
         JOIN users u ON a.patient_id = u.id
         WHERE a.doctor_id = $1
         ORDER BY a.appointment_date, a.appointment_time`,
        [doctorId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  },
  
  // Get appointment by id
  async getById(id) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                d.specialty as doctor_specialty,
                d.consulting_fees as doctor_fee,
                u2.full_name as doctor_name,
                h.name as hospital_name,
                h.address as hospital_address,
                u.full_name as patient_name
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON a.patient_id = u.id
         JOIN users u2 ON d.user_id = u2.id
         JOIN hospitals h ON d.hospital_id = h.id
         WHERE a.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting appointment by id:', error);
      throw error;
    }
  },
  
  // Create a new appointment
  async create(appointmentData) {
    const {
      patient_id, doctor_id, appointment_date, appointment_time,
      reason, notes, status
    } = appointmentData;
    
    try {
      const result = await pool.query(
        `INSERT INTO appointments
         (patient_id, doctor_id, appointment_date, appointment_time, 
          reason, notes, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [patient_id, doctor_id, appointment_date, appointment_time,
         reason, notes, status || 'scheduled']
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },
  
  // Update appointment
  async update(id, appointmentData) {
    const allowedFields = [
      'appointment_date', 'appointment_time', 'reason', 
      'notes', 'status', 'payment_status'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Add updated_at field
    updateFields.push(`updated_at = NOW()`);
    
    // Build update fields and values
    Object.entries(appointmentData).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return null;
    }
    
    values.push(id);
    
    try {
      const result = await pool.query(
        `UPDATE appointments
         SET ${updateFields.join(', ')}
         WHERE id = $${valueIndex}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },
  
  // Cancel appointment
  async cancel(id, cancellationReason) {
    try {
      const result = await pool.query(
        `UPDATE appointments
         SET status = 'cancelled',
             cancellation_reason = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, cancellationReason || 'No reason provided']
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },
  
  // Delete appointment
  async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM appointments WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows[0] ? true : false;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },
  
  // Check if time slot is available
  async isTimeSlotAvailable(doctorId, date, time) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM appointments
         WHERE doctor_id = $1
           AND appointment_date = $2
           AND appointment_time = $3
           AND status NOT IN ('cancelled', 'rejected')`,
        [doctorId, date, time]
      );
      
      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  },
  
  // Get doctor's available slots for a specific date
  async getDoctorAvailableSlots(doctorId, date) {
    try {
      // First get the doctor's available days and time
      const doctorResult = await pool.query(
        `SELECT available_days, available_times
         FROM doctors
         WHERE id = $1`,
        [doctorId]
      );
      
      if (!doctorResult.rows[0]) {
        return [];
      }
      
      const { available_days, available_times } = doctorResult.rows[0];
      
      // Check if the requested date is available
      const requestDate = new Date(date);
      const dayOfWeek = requestDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // If available_days is null or empty, assume all days are available
      if (!available_days || available_days.length === 0) {
        return getDefaultTimeSlots();
      }
      
      if (!available_days.includes(dayOfWeek)) {
        return [];
      }
      
      // Parse available time ranges
      // If available_times is null or empty, use default slots
      if (!available_times || available_times.length === 0) {
        return getDefaultTimeSlots();
      }
      
      // Generate all possible slots
      const allSlots = [];
      available_times.forEach(range => {
        const [start, end] = range.split('-').map(t => t.trim());
        
        let currentTime = start;
        while (currentTime < end) {
          allSlots.push(currentTime);
          
          // Increment by 30 minutes (assuming 30-minute slots)
          const [hours, minutes] = currentTime.split(':').map(Number);
          let newMinutes = minutes + 30;
          let newHours = hours;
          
          if (newMinutes >= 60) {
            newMinutes -= 60;
            newHours += 1;
          }
          
          currentTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        }
      });
      
      // Get booked slots
      const bookedSlotsResult = await pool.query(
        `SELECT appointment_time
         FROM appointments
         WHERE doctor_id = $1
           AND appointment_date = $2
           AND status NOT IN ('cancelled', 'rejected')`,
        [doctorId, date]
      );
      
      const bookedSlots = bookedSlotsResult.rows.map(row => row.appointment_time);
      
      // Filter out booked slots
      return allSlots.filter(slot => !bookedSlots.includes(slot));
    } catch (error) {
      console.error('Error getting doctor available slots:', error);
      throw error;
    }
  }
};

// Helper function to generate default time slots
function getDefaultTimeSlots() {
  const slots = [];
  const startHour = 9;  // 9 AM
  const endHour = 17;   // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
}

export default Appointment;