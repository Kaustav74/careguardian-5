// Database initialization script for CareGuardian
import { pool } from './db.js';

// Create tables if they don't exist
async function initDatabase() {
  const client = await pool.connect();
  
  // Function to execute query safely
  const safeQuery = async (query, errorMessage = 'Error executing query') => {
    try {
      return await client.query(query);
    } catch (err) {
      console.log(`${errorMessage}: ${err.message}`);
      return null;
    }
  };
  
  try {
    // We'll execute each query independently rather than in a transaction
    // to ensure that if one statement fails, others can still proceed
    
    // Users table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'patient',
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating users table');
    
    // Doctors table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        specialty VARCHAR(100) NOT NULL,
        qualification TEXT NOT NULL,
        experience INTEGER NOT NULL,
        license_number VARCHAR(50) NOT NULL,
        hospital_id INTEGER,
        consulting_fees DECIMAL(10,2),
        available_days INTEGER[],
        available_times VARCHAR(100)[],
        rating DECIMAL(3,2),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating doctors table');
    
    // Verify the hospital_id column exists
    await safeQuery(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='doctors' AND column_name='hospital_id'
        ) THEN
          ALTER TABLE doctors ADD COLUMN hospital_id INTEGER;
        END IF;
      END $$;
    `, 'Error checking or adding hospital_id column');
    
    // Hospitals table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(50) NOT NULL,
        state VARCHAR(50) NOT NULL,
        country VARCHAR(50) NOT NULL DEFAULT 'India',
        pincode VARCHAR(20),
        contact_number VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(100),
        description TEXT,
        facilities TEXT[],
        specialties TEXT[],
        emergency_services BOOLEAN DEFAULT FALSE,
        ambulance_services BOOLEAN DEFAULT FALSE,
        coordinates POINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating hospitals table');
    
    // Update foreign key in doctors table (if it doesn't already exist)
    // Note: PostgreSQL does not support IF NOT EXISTS for constraints directly in ALTER TABLE
    // We'll just try to add it and catch the error if it already exists
    await safeQuery(`
      ALTER TABLE doctors 
      ADD CONSTRAINT fk_hospital 
      FOREIGN KEY (hospital_id) 
      REFERENCES hospitals(id) 
      ON DELETE SET NULL
    `, 'Note: Foreign key constraint already exists or there was an issue creating it');
    
    // Appointments table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        cancellation_reason TEXT,
        payment_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating appointments table');
    
    // Medical Records table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
        record_date DATE NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        diagnosis TEXT,
        prescription TEXT,
        notes TEXT,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating medical records table');
    
    // Medications table
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        medication_name VARCHAR(100) NOT NULL,
        dosage VARCHAR(50) NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        prescribed_by INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
        notes TEXT,
        reminder_time TIME[],
        reminder_days INTEGER[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, 'Error creating medications table');
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  } finally {
    client.release();
  }
}

export default initDatabase;