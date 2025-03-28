// Authentication middleware for CareGuardian
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'smartbengalhackathon2025';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Protect routes - authentication middleware
export const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (remove Bearer part)
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database (exclude password)
      req.user = await User.findById(decoded.id);
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin only middleware
export const admin = async (req, res, next) => {
  // For now, hardcode admin access for specific usernames or emails
  const adminUsers = ['admin'];
  const adminEmails = ['admin@careguardian.com'];
  
  if (req.user && (adminUsers.includes(req.user.username) || adminEmails.includes(req.user.email))) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Doctor only middleware
export const doctor = async (req, res, next) => {
  try {
    // For now, check if this user is also in the doctors table
    const { pool } = await import('../config/db.js');
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM doctors WHERE user_id = $1', 
        [req.user.id]
      );
      
      const isDoctor = result.rows.length > 0;
      
      // Check if admin or doctor
      const adminUsers = ['admin'];
      const adminEmails = ['admin@careguardian.com'];
      if (req.user && (isDoctor || adminUsers.includes(req.user.username) || adminEmails.includes(req.user.email))) {
        next();
      } else {
        res.status(403).json({ message: 'Not authorized as a doctor' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in doctor middleware:', error);
    res.status(500).json({ message: 'Server error checking doctor authorization' });
  }
};