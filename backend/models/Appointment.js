// Appointment model functions
import { pool } from '../config/db.js';

const Appointment = {
  // Get all appointments for a user
  async getUserAppointments(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*,
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN hospitals h ON a.hospital_id = h.id
         WHERE a.user_id = $1
         ORDER BY a.date DESC, a.time`,
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
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN hospitals h ON a.hospital_id = h.id
         WHERE a.user_id = $1
           AND a.date >= CURRENT_DATE
           AND a.status NOT IN ('cancelled', 'rejected', 'completed')
         ORDER BY a.date, a.time`,
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
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                h.name as hospital_name,
                h.address as hospital_address
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN hospitals h ON a.hospital_id = h.id
         WHERE a.user_id = $1
           AND (a.date < CURRENT_DATE
                OR a.status IN ('cancelled', 'rejected', 'completed'))
         ORDER BY a.date DESC, a.time DESC`,
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
         JOIN users u ON a.user_id = u.id
         WHERE a.doctor_id = $1
         ORDER BY a.date, a.time`,
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
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                h.name as hospital_name,
                h.address as hospital_address,
                u.full_name as user_full_name
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users u ON a.user_id = u.id
         JOIN hospitals h ON a.hospital_id = h.id
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
      user_id, doctor_id, hospital_id, date, time,
      is_virtual, notes, status
    } = appointmentData;
    
    try {
      const result = await pool.query(
        `INSERT INTO appointments
         (user_id, doctor_id, hospital_id, date, time, 
          is_virtual, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [user_id, doctor_id, hospital_id, date, time,
         is_virtual || false, notes, status || 'scheduled']
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
      'date', 'time', 'is_virtual', 
      'notes', 'status'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
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
  async cancel(id) {
    try {
      const result = await pool.query(
        `UPDATE appointments
         SET status = 'cancelled'
         WHERE id = $1
         RETURNING *`,
        [id]
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
           AND date = $2
           AND time = $3
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
      // First get the doctor's available days
      const doctorResult = await pool.query(
        `SELECT available_days
         FROM doctors
         WHERE id = $1`,
        [doctorId]
      );
      
      if (!doctorResult.rows[0]) {
        return [];
      }
      
      const { available_days } = doctorResult.rows[0];
      
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
      
      // Use default time slots
      const allSlots = getDefaultTimeSlots();
      
      // Get booked slots
      const bookedSlotsResult = await pool.query(
        `SELECT time
         FROM appointments
         WHERE doctor_id = $1
           AND date = $2
           AND status NOT IN ('cancelled', 'rejected')`,
        [doctorId, date]
      );
      
      const bookedSlots = bookedSlotsResult.rows.map(row => row.time);
      
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