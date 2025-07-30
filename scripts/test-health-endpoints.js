#!/usr/bin/env node

/**
 * Test script for health check endpoints
 */

const baseUrl = 'http://localhost:3001';

async function testEndpoint(path, description) {
  console.log(`\n${description}:`);
  console.log(`Testing ${path}...`);
  
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const contentType = response.headers.get('content-type');
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Testing Health Check Endpoints\n');
  console.log('================================');
  
  // Test simple health check
  await testEndpoint('/api/health', 'Simple Health Check');
  
  // Test detailed health check
  await testEndpoint('/api/health?detailed=true', 'Detailed Health Check');
  
  // Test readiness endpoint
  await testEndpoint('/api/ready', 'Readiness Check');
  
  console.log('\n================================');
  console.log('Tests completed');
}

runTests().catch(console.error);