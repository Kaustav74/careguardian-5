// Script to start the CareGuardian application
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Print startup message
console.log('Starting CareGuardian application...');
console.log('-------------------------------------');

// Start server
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

// Handle server exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Log successful startup
console.log('Server started successfully!');
console.log('Access the application at: http://localhost:5000');
console.log('Press Ctrl+C to stop the server');