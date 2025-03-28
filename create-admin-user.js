// Create an admin user in the database
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Hash password function similar to the one in auth.ts
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex");
    
    // Use scrypt to hash the password
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function createAdminUser() {
  // Check if admin already exists
  const checkRes = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
  
  if (checkRes.rows.length > 0) {
    console.log('Admin user already exists. Updating password...');
    
    // Hash the password
    const hashedPassword = await hashPassword('admin');
    
    // Update the existing admin user
    await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedPassword, 'admin']
    );
    
    console.log('Admin password updated successfully!');
  } else {
    console.log('Creating new admin user...');
    
    // Hash the password
    const hashedPassword = await hashPassword('admin');
    
    // Insert a new admin user
    await pool.query(
      'INSERT INTO users (username, password, full_name, email, phone_number) VALUES ($1, $2, $3, $4, $5)',
      ['admin', hashedPassword, 'Admin User', 'admin@careguardian.com', '123-456-7890']
    );
    
    console.log('Admin user created successfully!');
  }
  
  // Close the pool
  await pool.end();
}

// Run the function
createAdminUser().catch(err => {
  console.error('Error creating/updating admin user:', err);
  process.exit(1);
});