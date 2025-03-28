// Simple launcher for the main server.js file
import { execSync } from 'child_process';

console.log('Starting CareGuardian server from TypeScript launcher...');

try {
  // Execute the main server.js file using execSync so the process stays alive
  execSync('node server.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}