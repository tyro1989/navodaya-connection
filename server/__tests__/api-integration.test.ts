import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../routes';
import type { Server } from 'http';

describe('API Integration Tests', () => {
  let server: Server;
  let app: express.Application;
  const baseUrl = 'http://localhost:5001'; // Use different port for tests
  let sessionCookie: string;

  beforeAll(async () => {
    // Set environment to development for OTP visibility
    process.env.NODE_ENV = 'development';
    
    app = express();
    
    // Set up middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Configure session middleware for testing
    const session = await import('express-session');
    app.use(session.default({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Register routes
    server = await registerRoutes(app);
    
    // Start server
    await new Promise<void>((resolve) => {
      server.listen(5001, resolve);
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/send-otp', () => {
      it('should send OTP successfully', async () => {
        const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999999',
            method: 'sms'
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toMatch(/OTP sent successfully/);
        expect(data.method).toBe('sms');
        expect(data.otp).toBeDefined(); // Development mode shows OTP
      });

      it('should return 400 for missing phone number', async () => {
        const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'sms'
          })
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Phone number is required');
      });
    });

    describe('POST /api/auth/verify-otp', () => {
      beforeEach(async () => {
        // Send OTP first (we'll use development default OTP)
        await fetch(`${baseUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999999',
            method: 'sms'
          })
        });
      });

      it('should verify OTP and create new user', async () => {
        const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999999',
            otp: '123456' // Use development default OTP
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('OTP verified successfully');
        expect(data.user).toBeDefined();
        expect(data.user.phone).toBe('+919999999999');
        expect(data.isNewUser).toBe(true);

        // Save session cookie for later tests
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          sessionCookie = setCookie.split(';')[0];
        }
      });

      it('should return 400 for invalid OTP', async () => {
        const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999999',
            otp: '999999'
          })
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Invalid or expired OTP');
      });
    });

    describe('GET /api/auth/me', () => {
      it('should return user data when authenticated', async () => {
        // First authenticate
        const otpResponse = await fetch(`${baseUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999998',
            method: 'sms'
          })
        });
        const otpData = await otpResponse.json();

        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999998',
            otp: '123456'
          })
        });

        const setCookie = verifyResponse.headers.get('set-cookie');
        const cookie = setCookie?.split(';')[0] || '';

        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { 'Cookie': cookie }
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.user).toBeDefined();
        expect(data.user.phone).toBe('+919999999998');
      });

      it('should return 401 when not authenticated', async () => {
        const response = await fetch(`${baseUrl}/api/auth/me`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('Not authenticated');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        // First authenticate
        const otpResponse = await fetch(`${baseUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999997',
            method: 'sms'
          })
        });
        const otpData = await otpResponse.json();

        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+919999999997',
            otp: '123456'
          })
        });

        const setCookie = verifyResponse.headers.get('set-cookie');
        const cookie = setCookie?.split(';')[0] || '';

        const response = await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Cookie': cookie }
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Logout successful');

        // Verify user is logged out
        const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { 'Cookie': cookie }
        });
        expect(meResponse.status).toBe(401);
      });
    });
  });

  describe('Request Management Endpoints', () => {
    let userCookie: string;

    beforeEach(async () => {
      // Authenticate a user for request tests
      const otpResponse = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+919999999996',
          method: 'sms'
        })
      });
      const otpData = await otpResponse.json();

      const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+919999999996',
          otp: '123456'
        })
      });

      const setCookie = verifyResponse.headers.get('set-cookie');
      userCookie = setCookie?.split(';')[0] || '';
    });

    describe('POST /api/requests', () => {
      it('should create a new request', async () => {
        const requestData = {
          title: 'Integration Test Request',
          description: 'This is a test request created during integration testing',
          expertiseRequired: 'Technology & IT',
          urgency: 'medium',
          helpType: 'general',
          helpLocationState: 'Delhi',
          helpLocationDistrict: 'Central Delhi',
          helpLocationArea: 'CP',
          helpLocationNotApplicable: false,
          attachments: []
        };

        const response = await fetch(`${baseUrl}/api/requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': userCookie
          },
          body: JSON.stringify(requestData)
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.request).toBeDefined();
        expect(data.request.title).toBe(requestData.title);
        expect(data.request.status).toBe('open');
        expect(data.request.userId).toBeDefined();
      });

      it('should return 401 when not authenticated', async () => {
        const response = await fetch(`${baseUrl}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Request',
            description: 'Test description'
          })
        });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/requests', () => {
      it('should retrieve requests with pagination', async () => {
        const response = await fetch(`${baseUrl}/api/requests?status=open&limit=5&page=1`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.requests).toBeDefined();
        expect(Array.isArray(data.requests)).toBe(true);
        expect(data.pagination).toBeDefined();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(5);
      });

      it('should filter requests by status', async () => {
        const response = await fetch(`${baseUrl}/api/requests?status=open`);

        expect(response.status).toBe(200);
        const data = await response.json();
        data.requests.forEach((request: any) => {
          expect(request.status).toBe('open');
        });
      });
    });
  });

  describe('Stats Endpoints', () => {
    describe('GET /api/stats/dashboard', () => {
      it('should return dashboard statistics', async () => {
        const response = await fetch(`${baseUrl}/api/stats/dashboard`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.stats).toBeDefined();
        expect(typeof data.stats.totalRequests).toBe('number');
        expect(typeof data.stats.activeExperts).toBe('number');
        expect(typeof data.stats.resolvedRequests).toBe('number');
        expect(typeof data.stats.totalResponses).toBe('number');
      });
    });

    describe('GET /api/stats/top-helpers', () => {
      it('should return top community helpers', async () => {
        const response = await fetch(`${baseUrl}/api/stats/top-helpers`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.topHelpers).toBeDefined();
        expect(Array.isArray(data.topHelpers)).toBe(true);
      });
    });
  });

  describe('User Endpoints', () => {
    describe('GET /api/users/experts', () => {
      it('should return list of experts', async () => {
        const response = await fetch(`${baseUrl}/api/users/experts`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.experts).toBeDefined();
        expect(Array.isArray(data.experts)).toBe(true);
      });

      it('should filter experts by expertise', async () => {
        const response = await fetch(`${baseUrl}/api/users/experts?expertise=Technology`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.experts).toBeDefined();
        expect(Array.isArray(data.experts)).toBe(true);
      });

      it('should limit number of experts returned', async () => {
        const response = await fetch(`${baseUrl}/api/users/experts?limit=3`);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.experts.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await fetch(`${baseUrl}/api/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should handle OPTIONS requests properly', async () => {
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'OPTIONS'
      });

      // Should allow OPTIONS requests
      expect([200, 204]).toContain(response.status);
    });
  });
});