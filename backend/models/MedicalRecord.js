const db = require('../config/db');

// Medical Record model functions
const MedicalRecord = {
  // Get all medical records for a user
  async getUserMedicalRecords(userId) {
    try {
      const result = await db.query(
        `SELECT mr.*, d.name as doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON mr.doctor_id = d.id
         WHERE mr.user_id = $1
         ORDER BY mr.record_date DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user medical records:', error);
      throw error;
    }
  },
  
  // Get medical record by id
  async getById(id) {
    try {
      const result = await db.query(
        `SELECT mr.*, d.name as doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON mr.doctor_id = d.id
         WHERE mr.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting medical record by id:', error);
      throw error;
    }
  },
  
  // Add a new medical record
  async create(recordData) {
    const {
      user_id, record_type, doctor_id, hospital_id, record_date,
      diagnosis, symptoms, treatment, notes, test_results,
      allergies, vitals, appointment_id, files
    } = recordData;
    
    try {
      const result = await db.query(
        `INSERT INTO medical_records
         (user_id, record_type, doctor_id, hospital_id, record_date,
          diagnosis, symptoms, treatment, notes, test_results,
          allergies, vitals, appointment_id, files, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
         RETURNING *`,
        [user_id, record_type, doctor_id, hospital_id, record_date || new Date(),
         diagnosis, symptoms, treatment, notes, test_results,
         allergies, vitals, appointment_id, files]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  },
  
  // Update medical record
  async update(id, recordData) {
    const allowedFields = [
      'record_type', 'doctor_id', 'hospital_id', 'record_date',
      'diagnosis', 'symptoms', 'treatment', 'notes', 'test_results',
      'allergies', 'vitals', 'appointment_id', 'files'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build update fields and values
    Object.entries(recordData).forEach(([key, value]) => {
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
        `UPDATE medical_records
         SET ${updateFields.join(', ')}
         WHERE id = $${valueIndex}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  },
  
  // Delete medical record
  async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM medical_records WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows[0] ? true : false;
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  },
  
  // Get medical records by type
  async getUserMedicalRecordsByType(userId, type) {
    try {
      const result = await db.query(
        `SELECT mr.*, d.name as doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON mr.doctor_id = d.id
         WHERE mr.user_id = $1 AND mr.record_type = $2
         ORDER BY mr.record_date DESC`,
        [userId, type]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user medical records by type:', error);
      throw error;
    }
  },
  
  // Get record types for a user
  async getUserRecordTypes(userId) {
    try {
      const result = await db.query(
        `SELECT DISTINCT record_type
         FROM medical_records
         WHERE user_id = $1
         ORDER BY record_type`,
        [userId]
      );
      
      return result.rows.map(row => row.record_type);
    } catch (error) {
      console.error('Error getting user record types:', error);
      throw error;
    }
  },
  
  // Search medical records
  async searchUserMedicalRecords(userId, query) {
    try {
      const searchTerm = `%${query}%`;
      
      const result = await db.query(
        `SELECT mr.*, d.name as doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON mr.doctor_id = d.id
         WHERE mr.user_id = $1
           AND (
             mr.record_type ILIKE $2
             OR mr.diagnosis ILIKE $2
             OR mr.symptoms ILIKE $2
             OR mr.treatment ILIKE $2
             OR mr.notes ILIKE $2
           )
         ORDER BY mr.record_date DESC`,
        [userId, searchTerm]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching user medical records:', error);
      throw error;
    }
  }
};

module.exports = MedicalRecord;