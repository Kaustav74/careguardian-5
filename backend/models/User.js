// User model for CareGuardian
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

class User {
  // Create a new user
  async create({ username, email, password, fullName, role = 'patient' }) {
    const client = await pool.connect();
    
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert the user into the database
      const result = await client.query(
        `INSERT INTO users (username, email, password, full_name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, username, email, full_name as "fullName", role`,
        [username, email, hashedPassword, fullName, role]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Find a user by ID
  async findById(id) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT id, username, email, full_name as "fullName", role, phone, address, 
                date_of_birth as "dateOfBirth", profile_image as "profileImage", 
                created_at as "createdAt", updated_at as "updatedAt"
         FROM users 
         WHERE id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Find a user by username or email
  async findByUsernameOrEmail(identifier) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT id, username, email, password, full_name as "fullName", role, phone, 
                address, date_of_birth as "dateOfBirth", profile_image as "profileImage",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM users 
         WHERE username = $1 OR email = $1`,
        [identifier]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username or email:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Validate user password
  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Update user information
  async update(id, userData) {
    const client = await pool.connect();
    
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic SET clause based on provided fields
      for (const [key, value] of Object.entries(userData)) {
        if (key !== 'id' && key !== 'password') {
          // Convert camelCase to snake_case for database columns
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          setClause.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Always update the updated_at timestamp
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add the user ID as the last parameter
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${setClause.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, username, email, full_name as "fullName", role, phone, 
                  address, date_of_birth as "dateOfBirth", profile_image as "profileImage"
      `;
      
      const result = await client.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Change user password
  async changePassword(id, newPassword) {
    const client = await pool.connect();
    
    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update the password in the database
      await client.query(
        `UPDATE users 
         SET password = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [hashedPassword, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new User();