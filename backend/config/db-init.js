// Database initialization script for CareGuardian
import { pool } from './db.js';

// Create tables if they don't exist
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
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
    `);
    
    // Doctors table
    await client.query(`
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
    `);
    
    // Hospitals table
    await client.query(`
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
    `);
    
    // Update foreign key in doctors table
    await client.query(`
      ALTER TABLE doctors 
      ADD CONSTRAINT fk_hospital 
      FOREIGN KEY (hospital_id) 
      REFERENCES hospitals(id) 
      ON DELETE SET NULL
    `);
    
    // Appointments table
    await client.query(`
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
    `);
    
    // Medical Records table
    await client.query(`
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
    `);
    
    // Medications table
    await client.query(`
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
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    return false;
  } finally {
    client.release();
  }
}

export default initDatabase;