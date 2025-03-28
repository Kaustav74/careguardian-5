// Script to create an admin user for CareGuardian
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Hash password function
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Create admin user function
async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    // Admin user data
    const adminUser = {
      username: 'admin',
      email: 'admin@careguardian.com',
      password: await hashPassword('admin123'),
      fullName: 'Admin User',
      role: 'admin'
    };
    
    // Check if admin already exists
    const checkResult = await client.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [adminUser.username, adminUser.email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the admin password
      await client.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
        [adminUser.password, adminUser.username]
      );
      
      console.log('Admin password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Insert admin user
      const result = await client.query(
        `INSERT INTO users (username, email, password, full_name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, username, email, role`,
        [
          adminUser.username, 
          adminUser.email, 
          adminUser.password, 
          adminUser.fullName, 
          adminUser.role
        ]
      );
      
      console.log('Admin user created successfully:');
      console.log(result.rows[0]);
    }
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error.message);
  } finally {
    client.release();
    // Close the pool
    await pool.end();
    process.exit(0);
  }
}

// Run the function
createAdminUser();