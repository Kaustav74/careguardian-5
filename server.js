// Main server file for CareGuardian healthcare application
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { testConnection } from './backend/config/db.js';
import initDatabase from './backend/config/db-init.js';
import userRoutes from './backend/routes/users.js';

// Set __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Routes are imported at the top of the file

// API routes
app.use('/api/users', userRoutes);

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Catch-all route for serving the frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Initialize the database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // Initialize database tables
      await initDatabase();
      
      // Set port and start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Access the application at: http://localhost:${PORT}`);
      });
    } else {
      console.error('Failed to connect to database. Server not started.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();