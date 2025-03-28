// Simple launcher for the server.js file
import { exec } from 'child_process';

console.log('Starting CareGuardian server...');

// Execute server.js
const serverProcess = exec('node server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(`Server output: ${stdout}`);
});

// Forward stdout and stderr to the console
serverProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

serverProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Stopping server...');
  serverProcess.kill();
  process.exit();
});