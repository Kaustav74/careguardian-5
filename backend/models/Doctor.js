const db = require('../config/db');

// Doctor model functions
const Doctor = {
  // Get all doctors
  async getAll() {
    try {
      const result = await db.query(
        `SELECT d.*, h.name as hospital_name 
         FROM doctors d
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         ORDER BY d.name`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting all doctors:', error);
      throw error;
    }
  },
  
  // Get doctors by specialty
  async getBySpecialty(specialty) {
    try {
      const result = await db.query(
        `SELECT d.*, h.name as hospital_name 
         FROM doctors d
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         WHERE d.specialty = $1
         ORDER BY d.name`,
        [specialty]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting doctors by specialty:', error);
      throw error;
    }
  },
  
  // Get doctor by id
  async getById(id) {
    try {
      const result = await db.query(
        `SELECT d.*, h.name as hospital_name, h.address as hospital_address
         FROM doctors d
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         WHERE d.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting doctor by id:', error);
      throw error;
    }
  },
  
  // Add a new doctor
  async create(doctorData) {
    const { name, specialty, qualification, experience, hospital_id, email, phone, bio, consultation_fee, available_days, available_time, photo_url } = doctorData;
    
    try {
      const result = await db.query(
        `INSERT INTO doctors 
         (name, specialty, qualification, experience, hospital_id, email, phone, bio, consultation_fee, available_days, available_time, photo_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         RETURNING *`,
        [name, specialty, qualification, experience, hospital_id, email, phone, bio, consultation_fee, available_days, available_time, photo_url]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  },
  
  // Update a doctor
  async update(id, doctorData) {
    const allowedFields = [
      'name', 'specialty', 'qualification', 'experience', 'hospital_id', 
      'email', 'phone', 'bio', 'consultation_fee', 'available_days', 
      'available_time', 'photo_url'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build update fields and values
    Object.entries(doctorData).forEach(([key, value]) => {
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
        `UPDATE doctors 
         SET ${updateFields.join(', ')} 
         WHERE id = $${valueIndex} 
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  },
  
  // Delete a doctor
  async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM doctors WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows[0] ? true : false;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  },
  
  // Search doctors by name or specialty
  async search(query) {
    try {
      const searchTerm = `%${query}%`;
      
      const result = await db.query(
        `SELECT d.*, h.name as hospital_name 
         FROM doctors d
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         WHERE d.name ILIKE $1 OR d.specialty ILIKE $1
         ORDER BY d.name`,
        [searchTerm]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching doctors:', error);
      throw error;
    }
  },
  
  // Get all unique specialties
  async getAllSpecialties() {
    try {
      const result = await db.query(
        'SELECT DISTINCT specialty FROM doctors ORDER BY specialty'
      );
      
      return result.rows.map(row => row.specialty);
    } catch (error) {
      console.error('Error getting all specialties:', error);
      throw error;
    }
  }
};

module.exports = Doctor;