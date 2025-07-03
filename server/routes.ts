import { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRequestSchema, insertResponseSchema, insertReviewSchema, insertOtpSchema } from "@shared/schema";
import { z } from "zod";
import { Router } from "express";
import multer from "multer";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import express from "express";

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
  // Serve static files for uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // For development mode, use mock OTP for any phone number
      if (process.env.NODE_ENV === "development") {
        await storage.createOtpVerification({
          phone,
          otp: "123456", // Mock OTP for development
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for dev
        });
        
        return res.json({ 
          message: "OTP sent successfully",
          otp: "123456" // Return mock OTP for development
        });
      }
      
      // Generate 6-digit OTP for regular flow
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtpVerification({
        phone,
        otp,
        expiresAt
      });
      
      // For demo purposes, return the OTP in development
      // In production, this would send SMS
      res.json({ 
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV === "development" && { otp })
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      // Handle development mode mock OTP for any phone number
      if (process.env.NODE_ENV === "development" && otp === "123456") {
        // Check if user exists
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser) {
          req.session.userId = existingUser.id;
          return res.json({ user: existingUser, isNewUser: false });
        }
        return res.json({ message: "OTP verified", isNewUser: true });
      }
      
      const isValid = await storage.verifyOtp(phone, otp);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        req.session.userId = existingUser.id;
        return res.json({ user: existingUser, isNewUser: false });
      }
      
      res.json({ message: "OTP verified", isNewUser: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
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

  const httpServer = createServer(app);
  return httpServer;
}
