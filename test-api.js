// Test script to check the API health endpoint
import fetch from 'node-fetch';

// Wait for the server to start (5 seconds)
console.log('Waiting for server to start...');
setTimeout(async () => {
  try {
    // Test the API health endpoint
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    
    console.log('API Test Results:');
    console.log('------------------');
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    // Close the process
    process.exit(0);
  } catch (error) {
    console.error('Error testing API:', error.message);
    process.exit(1);
  }
}, 5000);