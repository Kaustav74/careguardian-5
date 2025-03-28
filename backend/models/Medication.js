const db = require('../config/db');

// Medication model functions
const Medication = {
  // Get all medications for a user
  async getUserMedications(userId) {
    try {
      const result = await db.query(
        `SELECT m.*, d.name as doctor_name
         FROM medications m
         LEFT JOIN doctors d ON m.prescribed_by = d.id
         WHERE m.user_id = $1
         ORDER BY m.start_date DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user medications:', error);
      throw error;
    }
  },
  
  // Get medication by id
  async getById(id) {
    try {
      const result = await db.query(
        `SELECT m.*, d.name as doctor_name
         FROM medications m
         LEFT JOIN doctors d ON m.prescribed_by = d.id
         WHERE m.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting medication by id:', error);
      throw error;
    }
  },
  
  // Add a new medication
  async create(medicationData) {
    const {
      user_id, name, dosage, frequency, start_date, end_date,
      prescribed_by, instructions, side_effects, refills_left,
      appointment_id, active
    } = medicationData;
    
    try {
      const result = await db.query(
        `INSERT INTO medications
         (user_id, name, dosage, frequency, start_date, end_date,
          prescribed_by, instructions, side_effects, refills_left,
          appointment_id, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         RETURNING *`,
        [user_id, name, dosage, frequency, start_date, end_date,
         prescribed_by, instructions, side_effects, refills_left || 0,
         appointment_id, active !== undefined ? active : true]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating medication:', error);
      throw error;
    }
  },
  
  // Update medication
  async update(id, medicationData) {
    const allowedFields = [
      'name', 'dosage', 'frequency', 'start_date', 'end_date',
      'prescribed_by', 'instructions', 'side_effects', 'refills_left',
      'appointment_id', 'active'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build update fields and values
    Object.entries(medicationData).forEach(([key, value]) => {
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
      const result = await db.query(
        `UPDATE medications
         SET ${updateFields.join(', ')}
         WHERE id = $${valueIndex}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  },
  
  // Delete medication
  async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM medications WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows[0] ? true : false;
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  },
  
  // Get active medications for a user
  async getActiveMedications(userId) {
    try {
      const result = await db.query(
        `SELECT m.*, d.name as doctor_name
         FROM medications m
         LEFT JOIN doctors d ON m.prescribed_by = d.id
         WHERE m.user_id = $1
           AND m.active = true
           AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
         ORDER BY m.start_date DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting active medications:', error);
      throw error;
    }
  },
  
  // Get completed medications for a user
  async getCompletedMedications(userId) {
    try {
      const result = await db.query(
        `SELECT m.*, d.name as doctor_name
         FROM medications m
         LEFT JOIN doctors d ON m.prescribed_by = d.id
         WHERE m.user_id = $1
           AND (m.active = false OR m.end_date < CURRENT_DATE)
         ORDER BY m.end_date DESC, m.start_date DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting completed medications:', error);
      throw error;
    }
  },
  
  // Update medication reminder settings
  async updateReminderSettings(id, reminderTime, reminderDays) {
    try {
      const result = await db.query(
        `UPDATE medications
         SET reminder_time = $2,
             reminder_days = $3
         WHERE id = $1
         RETURNING *`,
        [id, reminderTime, reminderDays]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating medication reminder settings:', error);
      throw error;
    }
  },
  
  // Get medications with reminders for a user
  async getMedicationsWithReminders(userId) {
    try {
      const result = await db.query(
        `SELECT m.*, d.name as doctor_name
         FROM medications m
         LEFT JOIN doctors d ON m.prescribed_by = d.id
         WHERE m.user_id = $1
           AND m.active = true
           AND m.reminder_time IS NOT NULL
           AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
         ORDER BY m.reminder_time`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting medications with reminders:', error);
      throw error;
    }
  }
};

module.exports = Medication;