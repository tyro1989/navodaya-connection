import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemStorage } from '../storage';
import type { User, Request as HelpRequest, Response, Review } from '@shared/schema';

describe('MemStorage Unit Tests', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Management', () => {
    it('should create a user with phone number', async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      const user = await storage.createUserWithPhone(userData);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.phone).toBe(userData.phone);
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
    });

    it('should retrieve user by phone number', async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      const createdUser = await storage.createUserWithPhone(userData);
      const foundUser = await storage.getUserByPhone(userData.phone);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.phone).toBe(userData.phone);
    });

    it('should update user profile', async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      const user = await storage.createUserWithPhone(userData);
      const updatedUser = await storage.updateUser(user.id, {
        name: 'Updated Name',
        bio: 'Updated bio'
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.bio).toBe('Updated bio');
      expect(updatedUser?.phone).toBe(userData.phone); // Should preserve existing data
    });

    it('should verify user password correctly', async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'testPassword123',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      await storage.createUserWithPhone(userData);
      
      const validUser = await storage.verifyUserPassword(userData.phone, 'testPassword123');
      const invalidUser = await storage.verifyUserPassword(userData.phone, 'wrongPassword');
      
      expect(validUser).toBeDefined();
      expect(validUser?.phone).toBe(userData.phone);
      expect(invalidUser).toBeNull();
    });
  });

  describe('OTP Management', () => {
    it('should create and verify OTP', async () => {
      const phone = '+919876543210';
      const otp = '123456';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpVerification({ phone, otp, expiresAt });
      
      const isValid = await storage.verifyOtp(phone, otp);
      expect(isValid).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const phone = '+919876543210';
      const otp = '123456';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtpVerification({ phone, otp, expiresAt });
      
      const isValid = await storage.verifyOtp(phone, '654321');
      expect(isValid).toBe(false);
    });

    it('should reject expired OTP', async () => {
      const phone = '+919876543210';
      const otp = '123456';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      await storage.createOtpVerification({ phone, otp, expiresAt });
      
      const isValid = await storage.verifyOtp(phone, otp);
      expect(isValid).toBe(false);
    });
  });

  describe('Request Management', () => {
    let user: User;

    beforeEach(async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };
      user = await storage.createUserWithPhone(userData);
    });

    it('should create a help request', async () => {
      const requestData = {
        userId: user.id,
        title: 'Need help with coding',
        description: 'I need help with a React component',
        expertiseRequired: 'Technology & IT',
        urgency: 'medium' as const,
        helpType: 'general' as const,
        helpLocationState: 'Delhi',
        helpLocationDistrict: 'Central Delhi',
        helpLocationArea: 'CP',
        helpLocationGps: null,
        helpLocationNotApplicable: false,
        targetExpertId: null,
        status: 'open' as const,
        attachments: [],
        resolved: false,
        bestResponseId: null
      };

      const request = await storage.createRequest(requestData);
      
      expect(request).toBeDefined();
      expect(request.id).toBeDefined();
      expect(request.userId).toBe(user.id);
      expect(request.title).toBe(requestData.title);
      expect(request.status).toBe('open');
    });

    it('should retrieve requests by status', async () => {
      const requestData = {
        userId: user.id,
        title: 'Test Request',
        description: 'Test description',
        expertiseRequired: 'Technology & IT',
        urgency: 'medium' as const,
        helpType: 'general' as const,
        helpLocationState: 'Delhi',
        helpLocationDistrict: 'Central Delhi',
        helpLocationArea: 'CP',
        helpLocationGps: null,
        helpLocationNotApplicable: false,
        targetExpertId: null,
        status: 'open' as const,
        attachments: [],
        resolved: false,
        bestResponseId: null
      };

      await storage.createRequest(requestData);
      await storage.createRequest({ ...requestData, title: 'Another Request' });
      
      const result = await storage.getRequests('open', 10, 0);
      
      expect(result.requests).toHaveLength(3); // Including seeded data
      expect(result.total).toBe(3);
      expect(result.requests[0].status).toBe('open');
    });

    it('should update request status', async () => {
      const requestData = {
        userId: user.id,
        title: 'Test Request',
        description: 'Test description',
        expertiseRequired: 'Technology & IT',
        urgency: 'medium' as const,
        helpType: 'general' as const,
        helpLocationState: 'Delhi',
        helpLocationDistrict: 'Central Delhi',
        helpLocationArea: 'CP',
        helpLocationGps: null,
        helpLocationNotApplicable: false,
        targetExpertId: null,
        status: 'open' as const,
        attachments: [],
        resolved: false,
        bestResponseId: null
      };

      const request = await storage.createRequest(requestData);
      const updatedRequest = await storage.updateRequestStatus(request.id, 'in_progress');
      
      expect(updatedRequest).toBeDefined();
      expect(updatedRequest?.status).toBe('in_progress');
    });
  });

  describe('Response Management', () => {
    let user: User;
    let expert: User;
    let request: HelpRequest;

    beforeEach(async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: [],
        isExpert: false,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      user = await storage.createUserWithPhone(userData);
      expert = await storage.createUserWithPhone({
        ...userData,
        phone: '+919876543998',
        name: 'Expert User',
        isExpert: true,
        expertiseAreas: ['Technology & IT']
      });

      const requestData = {
        userId: user.id,
        title: 'Test Request',
        description: 'Test description',
        expertiseRequired: 'Technology & IT',
        urgency: 'medium' as const,
        helpType: 'general' as const,
        helpLocationState: 'Delhi',
        helpLocationDistrict: 'Central Delhi',
        helpLocationArea: 'CP',
        helpLocationGps: null,
        helpLocationNotApplicable: false,
        targetExpertId: null,
        status: 'open' as const,
        attachments: [],
        resolved: false,
        bestResponseId: null
      };

      request = await storage.createRequest(requestData);
    });

    it('should create a response to a request', async () => {
      const responseData = {
        requestId: request.id,
        expertId: expert.id,
        content: 'This is my helpful response',
        attachments: null,
        isHelpful: false,
        helpfulCount: 0
      };

      const response = await storage.createResponse(responseData);
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.requestId).toBe(request.id);
      expect(response.expertId).toBe(expert.id);
      expect(response.content).toBe(responseData.content);
    });

    it('should retrieve responses for a request', async () => {
      const responseData = {
        requestId: request.id,
        expertId: expert.id,
        content: 'This is my helpful response',
        attachments: null,
        isHelpful: false,
        helpfulCount: 0
      };

      await storage.createResponse(responseData);
      await storage.createResponse({ ...responseData, content: 'Another response' });
      
      const responses = await storage.getResponsesByRequestId(request.id);
      
      expect(responses).toHaveLength(2);
      expect(responses[0].requestId).toBe(request.id);
    });

    it('should mark response as helpful', async () => {
      const responseData = {
        requestId: request.id,
        expertId: expert.id,
        content: 'This is my helpful response',
        attachments: null,
        isHelpful: false,
        helpfulCount: 0
      };

      const response = await storage.createResponse(responseData);
      await storage.markResponseHelpful(response.id);
      
      const responses = await storage.getResponsesByRequestId(request.id);
      const updatedResponse = responses.find(r => r.id === response.id);
      
      expect(updatedResponse?.helpfulCount).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should calculate dashboard stats', async () => {
      const stats = await storage.getDashboardStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBeDefined();
      expect(stats.activeExperts).toBeDefined();
      expect(stats.resolvedRequests).toBeDefined();
      expect(stats.totalResponses).toBeDefined();
    });

    it('should return expert statistics', async () => {
      const userData = {
        phone: '+919876543999',
        name: 'Expert User',
        email: 'expert@example.com',
        password: 'hashedPassword',
        state: 'Delhi',
        district: 'Central Delhi',
        batchYear: 2020,
        profession: 'Technology & IT',
        authProvider: 'local' as const,
        emailVerified: false,
        gender: null,
        professionOther: null,
        currentState: null,
        currentDistrict: null,
        pinCode: null,
        gpsLocation: null,
        gpsEnabled: false,
        helpAreas: [],
        helpAreasOther: null,
        expertiseAreas: ['Technology & IT'],
        isExpert: true,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: null,
        bio: null,
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      };

      const expert = await storage.createUserWithPhone(userData);
      
      // First update stats to create the record
      await storage.updateExpertStats(expert.id, {
        totalResponses: 5,
        helpfulResponses: 3,
        averageRating: "4.5",
        totalReviews: 3
      });
      
      const stats = await storage.getExpertStats(expert.id);
      
      expect(stats).toBeDefined();
      expect(stats!.totalResponses).toBeDefined();
      expect(stats!.helpfulResponses).toBeDefined();
      expect(stats!.averageRating).toBeDefined();
    });
  });
});