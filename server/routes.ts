import { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { smsService } from "./sms";
import { 
  insertUserSchema, insertRequestSchema, insertResponseSchema, insertReviewSchema, 
  insertEmailVerificationSchema, insertPrivateMessageSchema, emailSignupSchema, emailLoginSchema
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
      const { phone, email, password, confirmPassword, name, state, district, batchYear } = req.body;
      
      // Validate required fields
      if (!phone || !password || !confirmPassword || !name || !state || !district || !batchYear) {
        return res.status(400).json({ message: "Phone, password, name, state, district, and batch year are required" });
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
        authProvider: 'local',
        emailVerified: false,
        profession: '',
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

  // Phone-based Login (for existing users)
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
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
      const { userId, status } = req.query;
      let requests;
      
      if (userId) {
        requests = await storage.getRequestsByUserId(parseInt(userId as string));
      } else {
        requests = await storage.getOpenRequests();
      }
      
      res.json({ requests });
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
      
      const stats = await storage.getPersonalStats(req.session.userId);
      res.json({ stats });
    } catch (error) {
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
  app.post("/api/upload/profile-image", authenticateUser, profileImageUpload.single('image'), (req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
