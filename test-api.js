#!/usr/bin/env node

/**
 * Test script for ISDOC PDF API
 * Usage: node test-api.js
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-secret-token';

async function testHealth() {
  console.log('🔍 Testing health endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed:', data);
    } else {
      console.log('❌ Health check failed:', data);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
}

async function testPDFUpload(pdfPath) {
  console.log(`📄 Testing PDF upload with file: ${pdfPath}`);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`❌ PDF file not found: ${pdfPath}`);
    return;
  }
  
  try {
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch(`${API_BASE_URL}/api/extract-isdoc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ PDF processed successfully');
      console.log('📊 Extracted data preview:', JSON.stringify(data.data, null, 2).substring(0, 500) + '...');
    } else {
      console.log(`❌ PDF processing failed (${response.status}):`, data);
    }
  } catch (error) {
    console.log('❌ PDF upload error:', error.message);
  }
}

async function testInvalidToken() {
  console.log('🔐 Testing invalid token...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-isdoc`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const data = await response.json();
    
    if (response.status === 403) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      console.log('❌ Invalid token test failed:', data);
    }
  } catch (error) {
    console.log('❌ Invalid token test error:', error.message);
  }
}

async function testMissingToken() {
  console.log('🔐 Testing missing token...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-isdoc`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Missing token correctly rejected');
    } else {
      console.log('❌ Missing token test failed:', data);
    }
  } catch (error) {
    console.log('❌ Missing token test error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testHealth();
  console.log('');
  
  await testInvalidToken();
  console.log('');
  
  await testMissingToken();
  console.log('');
  
  // Test with a sample PDF if provided
  const pdfPath = process.argv[2];
  if (pdfPath) {
    await testPDFUpload(pdfPath);
  } else {
    console.log('💡 To test PDF upload, run: node test-api.js path/to/your.pdf');
  }
  
  console.log('✨ Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealth,
  testPDFUpload,
  testInvalidToken,
  testMissingToken
}; 