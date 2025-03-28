// Doctor model functions
import { pool } from '../config/db.js';

const Doctor = {
  // Get all doctors
  async getAll() {
    try {
      const result = await pool.query(
        `SELECT d.*, 
                u.full_name as name, 
                u.email,
                h.name as hospital_name, 
                h.address as hospital_address
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         ORDER BY u.full_name`
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
      const result = await pool.query(
        `SELECT d.*, 
                u.full_name as name, 
                u.email,
                h.name as hospital_name, 
                h.address as hospital_address
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         WHERE d.specialty = $1
         ORDER BY u.full_name`,
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
      const result = await pool.query(
        `SELECT d.*, 
                u.full_name as name,
                u.email,
                u.phone,
                h.name as hospital_name, 
                h.address as hospital_address,
                h.city as hospital_city,
                h.pincode as hospital_pincode
         FROM doctors d
         JOIN users u ON d.user_id = u.id
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

  // Search doctors by name or specialty
  async search(query) {
    try {
      const result = await pool.query(
        `SELECT d.*, 
                u.full_name as name, 
                u.email,
                h.name as hospital_name, 
                h.address as hospital_address
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         LEFT JOIN hospitals h ON d.hospital_id = h.id
         WHERE u.full_name ILIKE $1 OR d.specialty ILIKE $1
         ORDER BY u.full_name`,
        [`%${query}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching doctors:', error);
      throw error;
    }
  },
  
  // Get all specialties
  async getAllSpecialties() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT specialty FROM doctors ORDER BY specialty`
      );
      
      return result.rows.map(row => row.specialty);
    } catch (error) {
      console.error('Error getting all specialties:', error);
      throw error;
    }
  }
};

export default Doctor;