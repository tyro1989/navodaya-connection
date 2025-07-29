import { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { smsService } from "./sms";
import { 
  insertUserSchema, insertRequestSchema, insertResponseSchema, insertReviewSchema, 
  insertEmailVerificationSchema, insertPrivateMessageSchema, emailSignupSchema, emailLoginSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { Router } from "express";
import multer from "multer";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import express from "express";
import passport from "passport";
import { configureAuth, isAuthenticated } from "./auth";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { getPool, getDb } from "./db-conditional";
import { otpVerifications } from "@shared/schema";
import { desc } from "drizzle-orm";

const router = Router();

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-images');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'));
    }
  }
});

// Configure multer for request attachments
const requestAttachmentStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'request-attachments');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${extension}`);
  }
});

const requestAttachmentUpload = multer({
  storage: requestAttachmentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload images, PDF, DOC, or TXT files.'));
    }
  }
});

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: any) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure authentication
  configureAuth();
  app.use(passport.initialize());
  app.use(passport.session());

  // Serve static files for uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));



  // Phone-based Signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { phone, email, password, confirmPassword, name, state, district, batchYear, profession } = req.body;
      
      // Validate required fields
      if (!phone || !password || !confirmPassword || !name || !state || !district || !batchYear || !profession) {
        return res.status(400).json({ message: "Phone, password, name, state, district, batch year, and profession are required" });
      }
      
      // Check password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ message: "User with this phone number already exists" });
      }
      
      // Create new user
      const userData = {
        phone: phone,
        email: email || null,
        password: password,
        name: name,
        state: state,
        district: district,
        batchYear: parseInt(batchYear),
        profession: profession,
        authProvider: 'local',
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
      
      // Log the user in immediately after signup
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Signup successful but login failed" });
        }
        
        // Store user ID in session for compatibility
        (req.session as any).userId = user.id;
        
        res.json({ 
          message: "Signup successful",
          user: { id: user.id, phone: user.phone, name: user.name }
        });
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Email Verification
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, token } = req.body;
      
      const isValid = await storage.verifyEmailToken(email, token);
      if (isValid) {
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Debug endpoint to check users (TEMPORARY)
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersInfo = users.map(u => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        hasPassword: !!u.password,
        authProvider: u.authProvider
      }));
      res.json({ users: usersInfo });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Debug endpoint to check OTPs (TEMPORARY)
  app.get("/api/debug/otps", async (req: Request, res: Response) => {
    try {
      const db = getDb();
      if (!db) {
        return res.json({ message: "Using in-memory storage, no database OTPs" });
      }
      const otps = await db.select().from(otpVerifications).orderBy(desc(otpVerifications.createdAt)).limit(10);
      res.json({ otps });
    } catch (error) {
      console.error('Debug OTPs error:', error);
      res.status(500).json({ error: "Failed to fetch OTPs" });
    }
  });

  // Phone-based Login (for existing users)
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    console.log("Password login attempt:", { phone: req.body.phone, passwordLength: req.body.password?.length });
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        console.log("Password login failed:", info);
        return res.status(401).json({ message: info?.message || "Invalid phone or password" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        
        // Store user ID in session for compatibility
        (req.session as any).userId = user.id;
        
        res.json({ 
          message: "Login successful",
          user: { id: user.id, phone: user.phone, name: user.name }
        });
      });
    })(req, res, next);
  });

  // OTP-based Authentication Routes
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phone, method } = req.body; // method can be 'sms' or 'whatsapp'
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP
      await storage.createOtpVerification({
        phone,
        otp,
        expiresAt
      });
      
      // Send OTP via WhatsApp or SMS
      let otpSent = false;
      let sentVia = 'SMS';
      
      if (method === 'whatsapp' && smsService.sendWhatsAppOTP) {
        otpSent = await smsService.sendWhatsAppOTP(phone, otp);
        sentVia = 'WhatsApp';
        
        // Fallback to SMS if WhatsApp fails
        if (!otpSent) {
          console.log('WhatsApp OTP failed, falling back to SMS');
          otpSent = await smsService.sendOTP(phone, otp);
          sentVia = 'SMS';
        }
      } else {
        otpSent = await smsService.sendOTP(phone, otp);
      }
      
      if (otpSent) {
        res.json({ 
          message: `OTP sent successfully via ${sentVia}`,
          method: sentVia.toLowerCase(),
          otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
        });
      } else {
        res.status(500).json({ message: "Failed to send OTP" });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp } = req.body;
      console.log("=== OTP VERIFICATION REQUEST ===");
      console.log("Request body:", req.body);
      console.log("Phone:", phone, "OTP:", otp);
      
      if (!phone || !otp) {
        console.log("Missing phone or OTP");
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }
      
      // Verify OTP
      console.log("Calling storage.verifyOtp with:", { phone, otp });
      const isValidOtp = await storage.verifyOtp(phone, otp);
      console.log("OTP verification result:", isValidOtp);
      
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      let isNewUser = false;
      
      if (!user) {
        // Create new user with minimal data
        const userData = {
          phone: phone,
          email: null,
          password: null,
          name: "New User", // Will be updated during registration
          state: "",
          district: "",
          batchYear: new Date().getFullYear(),
          profession: "Studying & Education", // Default profession for OTP users
          authProvider: 'otp',
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
        isNewUser = true;
      }
      
      // Log the user in
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        
        // Store user ID in session for compatibility
        (req.session as any).userId = user.id;
        
        res.json({ 
          message: "OTP verified successfully",
          user: { id: user.id, phone: user.phone, name: user.name },
          isNewUser
        });
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById(userId);
      if (user) {
        res.json({ user });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Complete registration for social auth users
  app.post("/api/auth/complete-registration", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { batchYear, profession, state, district } = req.body;
      
      if (!batchYear || !profession || !state || !district) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        batchYear: parseInt(batchYear),
        profession,
        state,
        district
      });
      
      res.json({ message: "Registration completed successfully", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      
      // Clear session
      (req.session as any).userId = null;
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destruction error" });
        }
        res.json({ message: "Logout successful" });
      });
    });
  });

  // Update user profile (for onboarding completion)
  app.put("/api/auth/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Profile update request received:", req.body);
      const userId = (req.session as any).userId;
      console.log("User ID from session:", userId);
      if (!userId) {
        console.log("No user ID in session, authentication required");
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate required fields for profile completion
      // Only name, batchYear, state, district are mandatory, password is now also required
      const requiredFields = ['name', 'batchYear', 'state', 'district', 'password'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Validate password confirmation
      if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Validate password length
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Prepare update data with optional fields
      const updateData: any = {
        name: req.body.name.trim(),
        batchYear: parseInt(req.body.batchYear),
        state: req.body.state.trim(),
        district: req.body.district.trim(),
      };

      // Hash and add password
      updateData.password = await bcrypt.hash(req.body.password, 10);

      // Add optional fields if provided
      if (req.body.email?.trim()) {
        updateData.email = req.body.email.trim().toLowerCase();
      }
      if (req.body.profession?.trim()) {
        updateData.profession = req.body.profession.trim();
        if (req.body.profession === "Other" && req.body.professionOther?.trim()) {
          updateData.professionOther = req.body.professionOther.trim();
        }
      }
      if (req.body.bio?.trim()) {
        updateData.bio = req.body.bio.trim();
      }

      // Update the user profile
      console.log("Updating user profile with data:", { ...updateData, password: '[HASHED]' });
      const updatedUser = await storage.updateUser(userId, updateData);
      console.log("Updated user:", updatedUser ? { ...updatedUser, password: '[HASHED]' } : null);

      if (!updatedUser) {
        console.log("User not found for ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Profile update successful");
      res.json({ 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User routes
  app.get("/api/users/experts", async (req, res) => {
    try {
      const { expertise, limit } = req.query;
      let experts;
      
      if (expertise) {
        experts = await storage.getExpertsByExpertise(expertise as string);
      } else {
        experts = await storage.getExperts(limit ? parseInt(limit as string) : undefined);
      }
      
      res.json({ experts });
    } catch (error) {
      res.status(500).json({ message: "Failed to get experts" });
    }
  });

  app.put("/api/users/profile", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.session.userId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Request routes
  app.post("/api/requests", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const requestData = insertRequestSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const request = await storage.createRequest(requestData);
      res.json({ request });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      const { userId, status, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      let requests;
      let total;
      
      if (userId) {
        const result = await storage.getRequestsByUserId(parseInt(userId as string), status as string, limitNum, offset);
        requests = result.requests;
        total = result.total;
      } else {
        const result = await storage.getRequests(status as string || "open", limitNum, offset);
        requests = result.requests;
        total = result.total;
      }
      
      res.json({ 
        requests, 
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get requests" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json({ request });
    } catch (error) {
      res.status(500).json({ message: "Failed to get request" });
    }
  });

  app.put("/api/requests/:id/status", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      const request = await storage.updateRequestStatus(requestId, status);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json({ request });
    } catch (error) {
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Update request endpoint (for editing)
  app.put("/api/requests/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { title, description } = req.body;
      const userId = req.session.userId;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      // Check if the user owns this request
      const existingRequest = await storage.getRequest(requestId);
      if (!existingRequest || existingRequest.userId !== userId) {
        return res.status(404).json({ error: "Request not found or unauthorized" });
      }

      // Update the request
      const updatedRequest = await storage.updateRequest(requestId, { title, description });
      
      res.json({
        success: true,
        message: "Request updated successfully",
        request: updatedRequest
      });
    } catch (error) {
      console.error("Error updating request:", error);
      res.status(500).json({ error: "Failed to update request" });
    }
  });

  // Response routes
  app.post("/api/responses", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const responseData = insertResponseSchema.parse({
        ...req.body,
        expertId: req.session.userId
      });
      
      const response = await storage.createResponse(responseData);
      
      // Get request details for notification
      const request = await storage.getRequestById(responseData.requestId);
      if (request && request.userId !== req.session.userId) {
        // Get expert details for notification
        const expert = await storage.getUserById(req.session.userId);
        if (expert) {
          // Create notification for request owner
          await storage.createNotification({
            userId: request.userId,
            type: 'response',
            title: 'New Response to Your Request',
            message: `${expert.name} responded to your request "${request.title}"`,
            entityType: 'request',
            entityId: request.id,
            actionUserId: req.session.userId,
            isRead: false,
          });
        }
      }
      
      res.json({ response });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  app.get("/api/responses/request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const responses = await storage.getResponsesByRequestId(requestId);
      res.json({ responses });
    } catch (error) {
      res.status(500).json({ message: "Failed to get responses" });
    }
  });

  app.post("/api/responses/:id/helpful", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const responseId = parseInt(req.params.id);
      await storage.markResponseHelpful(responseId);
      res.json({ message: "Response marked as helpful" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark response as helpful" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const review = await storage.createReview(reviewData);
      res.json({ review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/reviews/expert/:expertId", async (req, res) => {
    try {
      const expertId = parseInt(req.params.expertId);
      const reviews = await storage.getReviewsByExpertId(expertId);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  // Stats routes
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Top Community Helpers (last 30 days)
  app.get("/api/stats/top-helpers", async (req, res) => {
    try {
      const topHelpers = await storage.getTopCommunityHelpers();
      res.json({ topHelpers });
    } catch (error) {
      res.status(500).json({ message: "Failed to get top community helpers" });
    }
  });

  app.get("/api/stats/expert/:expertId", async (req, res) => {
    try {
      const expertId = parseInt(req.params.expertId);
      const stats = await storage.getExpertStats(expertId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to get expert stats" });
    }
  });

  app.get("/api/stats/personal", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log("Getting personal stats for user ID:", req.session.userId);
      const stats = await storage.getPersonalStats(req.session.userId);
      console.log("Personal stats result:", stats);
      res.json({ stats });
    } catch (error) {
      console.error("Error getting personal stats:", error);
      res.status(500).json({ message: "Failed to get personal stats" });
    }
  });

  // Private messaging routes
  app.post("/api/messages", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { requestId, receiverId, content } = req.body;
      const senderId = req.session.userId;

      if (!requestId || !receiverId || !content) {
        return res.status(400).json({ error: "Request ID, receiver ID, and content are required" });
      }

      const message = await storage.createPrivateMessage({
        requestId,
        senderId,
        receiverId,
        content,
        attachments: [],
      });

      // Create notification for message recipient
      const sender = await storage.getUserById(senderId);
      if (sender) {
        await storage.createNotification({
          userId: receiverId,
          type: 'message',
          title: 'New Message',
          message: `${sender.name} sent you a message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          entityType: 'message',
          entityId: message.id,
          actionUserId: senderId,
          isRead: false,
        });
      }

      res.json({ message });
    } catch (error) {
      console.error("Error creating private message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/messages/conversation/:requestId/:otherUserId", authenticateUser, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const otherUserId = parseInt(req.params.otherUserId);
      const userId = req.session.userId;

      const messages = await storage.getPrivateMessages(requestId, userId, otherUserId);
      
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversations", authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const conversations = await storage.getUserConversations(userId);
      
      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.put("/api/messages/:id/read", authenticateUser, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.session.userId;

      await storage.markMessageAsRead(messageId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Profile image upload endpoint
  app.post("/api/upload/profile-image", isAuthenticated, profileImageUpload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the relative path to the uploaded file
      const imageUrl = `/uploads/profile-images/${req.file.filename}`;
      
      res.json({
        success: true,
        url: imageUrl,
        message: "Profile image uploaded successfully"
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  // Request attachment upload endpoint
  app.post("/api/upload/request-attachment", isAuthenticated, requestAttachmentUpload.single('attachment'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the relative path to the uploaded file
      const attachmentUrl = `/uploads/request-attachments/${req.file.filename}`;
      
      res.json({
        success: true,
        url: attachmentUrl,
        originalName: req.file.originalname,
        message: "Attachment uploaded successfully"
      });
    } catch (error) {
      console.error("Request attachment upload error:", error);
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  });

  // Mark best response
  app.post("/api/requests/:id/best-response", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const requestId = parseInt(req.params.id);
      const { responseId } = req.body;
      
      // Check if user owns the request
      const request = await storage.getRequestById(requestId);
      if (!request || request.userId !== req.session.userId) {
        return res.status(403).json({ message: "You can only mark best responses for your own requests" });
      }
      
      // Mark the response as best and resolve the request
      await storage.markBestResponse(requestId, responseId);
      
      res.json({ message: "Best response marked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark best response" });
    }
  });

  // Response review routes
  app.post("/api/response-reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const reviewData = {
        ...req.body,
        userId: req.session.userId
      };
      
      const review = await storage.createResponseReview(reviewData);
      
      // Get response details for notification
      const responses = await storage.getResponsesByRequestId(reviewData.requestId);
      const response = responses.find(r => r.id === reviewData.responseId);
      if (response && response.expertId !== req.session.userId) {
        // Get reviewer details
        const reviewer = await storage.getUserById(req.session.userId);
        if (reviewer) {
          // Create notification for response author
          const stars = '⭐'.repeat(reviewData.rating);
          await storage.createNotification({
            userId: response.expertId,
            type: 'response_rating',
            title: 'Your Response Received a Rating',
            message: `${reviewer.name} rated your response ${stars} (${reviewData.rating}/5)${reviewData.comment ? ': "' + reviewData.comment.substring(0, 50) + (reviewData.comment.length > 50 ? '..."' : '"') : ''}`,
            entityType: 'response',
            entityId: response.id,
            actionUserId: req.session.userId,
            isRead: false,
          });
        }
      }
      
      res.json({ review });
    } catch (error) {
      res.status(500).json({ message: "Failed to create response review" });
    }
  });

  app.get("/api/response-reviews/response/:responseId", async (req, res) => {
    try {
      const responseId = parseInt(req.params.responseId);
      const reviews = await storage.getResponseReviewsByResponseId(responseId);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Failed to get response reviews" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection
      const db = getDb();
      if (db) {
        // Try a simple query to verify database connectivity
        const pool = getPool();
        if (pool) {
          await pool.query('SELECT 1');
        }
      }
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: db ? "connected" : "not configured"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const notifications = await storage.getUserNotifications(req.session.userId);
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/count", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const count = await storage.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get notification count" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId, req.session.userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      await storage.markAllNotificationsAsRead(req.session.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
