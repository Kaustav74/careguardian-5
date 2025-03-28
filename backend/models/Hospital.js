import { pool } from '../config/db.js';

// Hospital model functions
const Hospital = {
  // Get all hospitals
  async getAll() {
    try {
      const result = await pool.query(
        `SELECT * FROM hospitals ORDER BY name`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting all hospitals:', error);
      throw error;
    }
  },
  
  // Get hospital by id
  async getById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM hospitals WHERE id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting hospital by id:', error);
      throw error;
    }
  },
  
  // Add a new hospital
  async create(hospitalData) {
    const { 
      name, address, city, pincode, phone, email, website, 
      image_url, rating 
    } = hospitalData;
    
    try {
      const result = await pool.query(
        `INSERT INTO hospitals 
         (name, address, city, pincode, phone, email, website, 
          image_url, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [name, address, city, pincode, phone, email, website, 
         image_url, rating]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  },
  
  // Update a hospital
  async update(id, hospitalData) {
    const allowedFields = [
      'name', 'address', 'city', 'pincode', 'phone', 'email', 'website', 
      'image_url', 'rating'
    ];
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    // Build update fields and values
    Object.entries(hospitalData).forEach(([key, value]) => {
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
        `UPDATE hospitals 
         SET ${updateFields.join(', ')} 
         WHERE id = $${valueIndex} 
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  },
  
  // Delete a hospital
  async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM hospitals WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows[0] ? true : false;
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  },
  
  // Search hospitals
  async search(query) {
    try {
      const searchTerm = `%${query}%`;
      
      const result = await pool.query(
        `SELECT * FROM hospitals 
         WHERE name ILIKE $1 
            OR address ILIKE $1 
            OR city ILIKE $1 
         ORDER BY name`,
        [searchTerm]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching hospitals:', error);
      throw error;
    }
  },
  
  // Get doctors by hospital ID
  async getDoctorsByHospitalId(hospitalId) {
    try {
      const result = await pool.query(
        `SELECT * FROM doctors 
         WHERE hospital_id = $1 
         ORDER BY name`,
        [hospitalId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting doctors by hospital id:', error);
      throw error;
    }
  },
  
  // Get hospitals by city
  async getHospitalsByCity(city) {
    try {
      const result = await pool.query(
        `SELECT * FROM hospitals 
         WHERE city ILIKE $1 
         ORDER BY name`,
        [city]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting hospitals by city:', error);
      throw error;
    }
  }
};

export default Hospital;