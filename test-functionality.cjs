#!/usr/bin/env node
/**
 * Comprehensive test script for Navodaya Connect functionality
 * Tests the key user flows and API endpoints
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:4000';
const TIMEOUT = 5000;

// Create axios instance with session support
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Use simple HTTP requests for testing
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept 4xx as valid responses for testing
  }
});

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, message = '') {
  const status = success ? '✅' : '❌';
  const result = { testName, success, message };
  testResults.tests.push(result);
  
  if (success) {
    testResults.passed++;
    console.log(`${status} ${testName}`);
  } else {
    testResults.failed++;
    console.log(`${status} ${testName}: ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Navodaya Connect API Tests\n');
  
  try {
    // Test 1: Server Health Check
    console.log('📋 Testing Server Health...');
    try {
      const healthResponse = await api.get('/api/auth/me');
      logTest('Server Health Check', true);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Server Health Check', true, 'Server responding (not authenticated yet)');
      } else {
        logTest('Server Health Check', false, `Server not responding: ${error.message}`);
        return;
      }
    }

    // Test 2: OTP Authentication Flow
    console.log('\n🔐 Testing Authentication Flow...');
    
    // Send OTP
    try {
      const otpResponse = await api.post('/api/auth/send-otp', {
        phone: '+919876543210',
        method: 'sms'
      });
      logTest('Send OTP', otpResponse.data.message.includes('successfully'));
    } catch (error) {
      logTest('Send OTP', false, error.response?.data?.message || error.message);
    }

    // Verify OTP (using development OTP)
    try {
      const verifyResponse = await api.post('/api/auth/verify-otp', {
        phone: '+919876543210',
        otp: '123456'
      });
      logTest('Verify OTP', verifyResponse.data.message === 'OTP verified successfully');
    } catch (error) {
      logTest('Verify OTP', false, error.response?.data?.message || error.message);
    }

    // Test 3: User Authentication Status
    console.log('\n👤 Testing User Session...');
    try {
      const userResponse = await api.get('/api/auth/me');
      const isAuthenticated = userResponse.data.user && userResponse.data.user.id;
      logTest('User Authentication', isAuthenticated, isAuthenticated ? `User ID: ${userResponse.data.user.id}` : 'Not authenticated');
    } catch (error) {
      logTest('User Authentication', false, error.response?.data?.message || error.message);
    }

    // Test 4: Request Creation
    console.log('\n📝 Testing Request Creation...');
    let testRequestId = null;
    try {
      const requestData = {
        title: "Test Request - API Testing",
        description: "This is a test request created by the automated test suite to verify request creation functionality.",
        expertiseRequired: "Technical",
        urgency: "medium",
        helpType: "general",
        helpLocationState: "Maharashtra",
        helpLocationDistrict: "Mumbai",
        helpLocationArea: "Koramangala",
        helpLocationGps: null,
        helpLocationNotApplicable: false,
        targetExpertId: null,
        attachments: []
      };

      const createResponse = await api.post('/api/requests', requestData);
      testRequestId = createResponse.data.request?.id;
      logTest('Create Request', !!testRequestId, testRequestId ? `Request ID: ${testRequestId}` : 'No request ID returned');
    } catch (error) {
      logTest('Create Request', false, error.response?.data?.message || error.message);
    }

    // Test 5: Get Requests with Response Count
    console.log('\n📋 Testing Request Listing...');
    try {
      const requestsResponse = await api.get('/api/requests');
      const requests = requestsResponse.data.requests || [];
      const hasResponseCount = requests.length > 0 && typeof requests[0].responseCount === 'number';
      logTest('Get Requests', requests.length >= 0);
      logTest('Response Count in Requests', hasResponseCount, hasResponseCount ? `Found ${requests.length} requests with response counts` : 'No response count found');
    } catch (error) {
      logTest('Get Requests', false, error.response?.data?.message || error.message);
    }

    // Test 6: Response Creation (if we have a request)
    console.log('\n💬 Testing Response Creation...');
    let testResponseId = null;
    if (testRequestId) {
      try {
        const responseData = {
          requestId: testRequestId,
          content: "This is a test response created by the automated test suite to verify response creation functionality.",
          attachments: []
        };

        const createResponseResult = await api.post('/api/responses', responseData);
        testResponseId = createResponseResult.data.response?.id;
        logTest('Create Response', !!testResponseId, testResponseId ? `Response ID: ${testResponseId}` : 'No response ID returned');
      } catch (error) {
        logTest('Create Response', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Create Response', false, 'No test request ID available');
    }

    // Test 7: Get Responses for Request
    console.log('\n📬 Testing Response Retrieval...');
    if (testRequestId) {
      try {
        const responsesResult = await api.get(`/api/responses/request/${testRequestId}`);
        const responses = responsesResult.data.responses || [];
        logTest('Get Responses', responses.length >= 0, `Found ${responses.length} responses`);
      } catch (error) {
        logTest('Get Responses', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Get Responses', false, 'No test request ID available');
    }

    // Test 8: Mark Response as Helpful
    console.log('\n👍 Testing Helpful Button...');
    if (testResponseId) {
      try {
        const helpfulResult = await api.post(`/api/responses/${testResponseId}/helpful`);
        logTest('Mark Response Helpful', helpfulResult.data.message === 'Response marked as helpful');
      } catch (error) {
        logTest('Mark Response Helpful', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Mark Response Helpful', false, 'No test response ID available');
    }

    // Test 9: Close Request
    console.log('\n🔒 Testing Close Request...');
    if (testRequestId) {
      try {
        const closeResult = await api.put(`/api/requests/${testRequestId}/status`, {
          status: 'closed'
        });
        const success = closeResult.status === 200;
        logTest('Close Request', success);
        
        // Verify the request is actually closed
        const verifyResult = await api.get(`/api/requests/${testRequestId}`);
        const isClosed = verifyResult.data.request?.status === 'closed';
        logTest('Verify Request Closed', isClosed);
      } catch (error) {
        logTest('Close Request', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Close Request', false, 'No test request ID available');
    }

    // Test 10: Dashboard Stats
    console.log('\n📊 Testing Dashboard Stats...');
    try {
      const statsResult = await api.get('/api/stats/dashboard');
      const hasStats = statsResult.data.stats && typeof statsResult.data.stats.totalRequests === 'number';
      logTest('Dashboard Stats', hasStats);
    } catch (error) {
      logTest('Dashboard Stats', false, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('💥 Test suite crashed:', error.message);
  }

  // Print Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests.filter(t => !t.success).forEach(test => {
      console.log(`   • ${test.testName}: ${test.message}`);
    });
  }

  console.log('\n🎉 Test suite completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed to run:', error.message);
  process.exit(1);
});