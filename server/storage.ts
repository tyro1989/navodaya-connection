import { 
  users, requests, responses, reviews, expertStats, emailVerifications, responseReviews, privateMessages, otpVerifications, notifications,
  type User, type InsertUser,
  type Request, type InsertRequest, type RequestWithUser,
  type Response, type InsertResponse, type ResponseWithExpert,
  type Review, type InsertReview,
  type ResponseReview, type InsertResponseReview,
  type PrivateMessage, type InsertPrivateMessage, type PrivateMessageWithUser,
  type Notification, type InsertNotification, type NotificationWithUser,
  type ExpertStats,
  type EmailVerification, type InsertEmailVerification,
  type OtpVerification, type InsertOtpVerification,
  type ExpertWithStats,
  type EmailSignup, type EmailLogin
} from "@shared/schema";

// OTP verification types for in-memory storage (legacy)
interface LegacyOtpVerification {
  id: number;
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

interface InsertOtp {
  phone: string;
  otp: string;
  expiresAt: Date;
}
import bcrypt from "bcrypt";
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { eq, desc, and, sql, gt } from "drizzle-orm";
import { getDb } from "./db-conditional";

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getExperts(limit?: number): Promise<ExpertWithStats[]>;
  getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]>;

  // Authentication management
  createUserWithPhone(userData: any): Promise<User>;
  verifyUserPassword(phone: string, password: string): Promise<User | null>;

  // Email verification management
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  verifyEmailToken(email: string, token: string): Promise<boolean>;
  
  // OTP verification management
  createOtpVerification(otp: { phone: string; otp: string; expiresAt: Date }): Promise<any>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
  
  // Request management
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestById(id: number): Promise<RequestWithUser | undefined>;
  getRequestsByUserId(userId: number, status?: string, limit?: number, offset?: number): Promise<{ requests: RequestWithUser[], total: number }>;
  getOpenRequests(limit?: number): Promise<RequestWithUser[]>;
  getRequests(status?: string, limit?: number, offset?: number): Promise<{ requests: RequestWithUser[], total: number }>;
  updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined>;
  updateRequestStatus(id: number, status: string): Promise<Request | undefined>;
  markBestResponse(requestId: number, responseId: number): Promise<Request | undefined>;
  
  // Response management
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]>;
  markResponseHelpful(responseId: number): Promise<void>;
  
  // Review management
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByExpertId(expertId: number): Promise<Review[]>;
  
  // Response review management
  createResponseReview(review: InsertResponseReview): Promise<ResponseReview>;
  getResponseReviewsByResponseId(responseId: number): Promise<ResponseReview[]>;
  
  // Expert stats
  getExpertStats(expertId: number): Promise<ExpertStats | undefined>;
  updateExpertStats(expertId: number, updates: Partial<ExpertStats>): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    resolvedRequests: number;
    totalResponses: number;
  }>;

  // Top community helpers (last 30 days)
  getTopCommunityHelpers(): Promise<Array<{
    id: number;
    name: string;
    profession: string;
    batchYear: number;
    profileImage: string | null;
    metrics: {
      averageRating: number;
      totalResponses: number;
      bestAnswers: number;
      totalRating: number;
      score: number;
    };
  }>>;
  
  // Personal stats
  getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }>;
  
  // Private message management
  createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getPrivateMessagesByRequestId(requestId: number): Promise<PrivateMessageWithUser[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;
  
  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<NotificationWithUser[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}



export class MemStorage implements IStorage {
  private users: User[] = [];
  private requests: Request[] = [];
  private responses: Response[] = [];
  private reviews: Review[] = [];
  private otpVerifications: LegacyOtpVerification[] = [];
  private responseReviews: ResponseReview[] = [];
  private privateMessages: PrivateMessage[] = [];
  private expertStats: ExpertStats[] = [];
  private nextId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create a sample expert user
    const expertUser: User = {
      id: this.nextId++,
      phone: "+919876543210",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      googleId: null,
      facebookId: null,
      appleId: null,
      authProvider: "local",
      password: null,
      emailVerified: true,
      gender: "female",
      batchYear: 2010,
      profession: "Medical Doctor",
      professionOther: null,
      state: "Maharashtra",
      district: "Mumbai",
      pinCode: "400001",
      gpsLocation: null,
      gpsEnabled: false,
      helpAreas: [],
      helpAreasOther: null,
      expertiseAreas: ["General Medicine", "Emergency Care"],
      isExpert: true,
      isActive: true,
      dailyRequestLimit: 5,
      phoneVisible: false,
      upiId: "sarah.johnson@okicici",
      bio: null,
      profileImage: null,
      lastActive: new Date(),
      createdAt: new Date()
    };
    this.users.push(expertUser);

    // Create a sample request
    const sampleRequest: Request = {
      id: this.nextId++,
      userId: expertUser.id,
      title: "Need help with medical career guidance",
      description: "I'm a final year medical student looking for guidance on choosing a specialization. Would appreciate advice from experienced doctors.",
      expertiseRequired: "Medical",
      urgency: "medium",
      helpType: "general",
      helpLocationState: "Maharashtra",
      helpLocationDistrict: "Mumbai",
      helpLocationArea: null,
      helpLocationGps: null,
      helpLocationNotApplicable: false,
      targetExpertId: null,
      status: "open",
      attachments: [],
      resolved: false,
      bestResponseId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.requests.push(sampleRequest);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      ...user,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(u => u.phone === phone);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUserWithPhone(userData: any): Promise<User> {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    
    const newUser: User = {
      id: this.nextId++,
      phone: userData.phone,
      email: userData.email || null,
      name: userData.name,
      password: hashedPassword,
      authProvider: userData.authProvider,
      batchYear: userData.batchYear,
      profession: userData.profession,
      state: userData.state,
      district: userData.district,
      createdAt: userData.createdAt || new Date(),
      lastActive: userData.lastActive || new Date(),
      emailVerified: userData.emailVerified || false,
      isExpert: userData.isExpert || false,
      isActive: userData.isActive !== false,
      phoneVisible: userData.phoneVisible || false,
      gpsEnabled: userData.gpsEnabled || false,
      dailyRequestLimit: userData.dailyRequestLimit || 3,
      googleId: null,
      facebookId: null,
      appleId: null,
      gender: userData.gender || null,
      professionOther: userData.professionOther || null,
      pinCode: userData.pinCode || null,
      gpsLocation: userData.gpsLocation || null,
      helpAreas: userData.helpAreas || [],
      helpAreasOther: userData.helpAreasOther || null,
      expertiseAreas: userData.expertiseAreas || [],
      upiId: userData.upiId || null,
      bio: userData.bio || null,
      profileImage: null
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async verifyUserPassword(phone: string, password: string): Promise<User | null> {
    const user = await this.getUserByPhone(phone);
    if (!user || !user.password) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const newVerification: EmailVerification = {
      id: this.nextId++,
      ...verification,
      verified: false,
      createdAt: new Date()
    };
    return newVerification;
  }

  async verifyEmailToken(email: string, token: string): Promise<boolean> {
    // Simplified implementation for development
    return token === "dev-token";
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const experts = this.users.filter(u => u.isExpert && u.isActive).slice(0, limit);
    return Promise.all(experts.map(async expert => {
      const stats = await this.getExpertStats(expert.id);
      const availableSlots = expert.dailyRequestLimit! - (stats?.todayResponses || 0);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, availableSlots)
      };
    }));
  }

  async getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]> {
    const experts = this.users.filter(u => 
      u.isExpert && u.isActive && u.expertiseAreas?.includes(expertise)
    );
    return Promise.all(experts.map(async expert => {
      const stats = await this.getExpertStats(expert.id);
      const availableSlots = expert.dailyRequestLimit! - (stats?.todayResponses || 0);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, availableSlots)
      };
    }));
  }

  async createOtpVerification(otp: { phone: string; otp: string; expiresAt: Date }): Promise<LegacyOtpVerification> {
    const newOtp: LegacyOtpVerification = {
      id: this.nextId++,
      ...otp,
      verified: false,
      createdAt: new Date()
    };
    this.otpVerifications.push(newOtp);
    return newOtp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    // Development mode: Allow default OTP "123456" to always work
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      console.log(`[DEV] Using default OTP 123456 for phone: ${phone}`);
      return true;
    }

    const verification = this.otpVerifications.find(v => v.phone === phone);
    if (!verification) return false;
    
    if (verification.otp === otp && verification.expiresAt > new Date()) {
      verification.verified = true;
      return true;
    }
    return false;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const newRequest: Request = {
      id: this.nextId++,
      ...request,
      status: "open",
      resolved: false,
      bestResponseId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.requests.push(newRequest);
    return newRequest;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.find(r => r.id === id);
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const request = this.requests.find(r => r.id === id);
    if (!request) return undefined;

    const user = await this.getUserById(request.userId);
    if (!user) return undefined;

    const responses = await this.getResponsesByRequestId(request.id);
    
    return {
      ...request,
      user,
      responseCount: responses.length
    };
  }

  async getRequestsByUserId(userId: number, status?: string, limit = 20, offset = 0): Promise<{ requests: RequestWithUser[], total: number }> {
    let userRequests = this.requests.filter(r => r.userId === userId);
    
    if (status) {
      userRequests = userRequests.filter(r => r.status === status);
    }
    
    const total = userRequests.length;
    const paginatedRequests = userRequests.slice(offset, offset + limit);
    
    const requests = await Promise.all(paginatedRequests.map(async request => {
      const user = await this.getUserById(request.userId);
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));
    
    return { requests, total };
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const openRequests = this.requests.filter(r => r.status === "open").slice(0, limit);
    return Promise.all(openRequests.map(async request => {
      const user = await this.getUserById(request.userId);
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));
  }

  async getRequests(status = "open", limit = 20, offset = 0): Promise<{ requests: RequestWithUser[], total: number }> {
    let filteredRequests = this.requests;
    
    if (status) {
      filteredRequests = filteredRequests.filter(r => r.status === status);
    }
    
    const total = filteredRequests.length;
    const paginatedRequests = filteredRequests.slice(offset, offset + limit);
    
    const requests = await Promise.all(paginatedRequests.map(async request => {
      const user = await this.getUserById(request.userId);
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));
    
    return { requests, total };
  }

  async updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined> {
    const requestIndex = this.requests.findIndex(r => r.id === id);
    if (requestIndex === -1) return undefined;
    
    this.requests[requestIndex] = { 
      ...this.requests[requestIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.requests[requestIndex];
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const requestIndex = this.requests.findIndex(r => r.id === id);
    if (requestIndex === -1) return undefined;
    
    this.requests[requestIndex] = { 
      ...this.requests[requestIndex], 
      status, 
      resolved: status === "resolved",
      updatedAt: new Date() 
    };
    return this.requests[requestIndex];
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const newResponse: Response = {
      id: this.nextId++,
      ...response,
      isHelpful: false,
      helpfulCount: 0,
      createdAt: new Date()
    };
    this.responses.push(newResponse);
    return newResponse;
  }

  async getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]> {
    const requestResponses = this.responses.filter(r => r.requestId === requestId);
    return Promise.all(requestResponses.map(async response => {
      const expert = await this.getUserById(response.expertId);
      return {
        ...response,
        expert: expert!
      };
    }));
  }

  async markResponseHelpful(responseId: number): Promise<void> {
    const responseIndex = this.responses.findIndex(r => r.id === responseId);
    if (responseIndex !== -1) {
      this.responses[responseIndex].helpfulCount = (this.responses[responseIndex].helpfulCount || 0) + 1;
      this.responses[responseIndex].isHelpful = true;
    }
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview: Review = {
      id: this.nextId++,
      ...review,
      createdAt: new Date()
    };
    this.reviews.push(newReview);
    return newReview;
  }

  async getReviewsByExpertId(expertId: number): Promise<Review[]> {
    return this.reviews.filter(r => r.expertId === expertId);
  }

  async getExpertStats(expertId: number): Promise<ExpertStats | undefined> {
    return this.expertStats.find(s => s.expertId === expertId);
  }

  async updateExpertStats(expertId: number, updates: Partial<ExpertStats>): Promise<void> {
    const statsIndex = this.expertStats.findIndex(s => s.expertId === expertId);
    if (statsIndex !== -1) {
      this.expertStats[statsIndex] = { ...this.expertStats[statsIndex], ...updates };
    } else {
      this.expertStats.push({
        id: this.nextId++,
        expertId,
        totalResponses: 0,
        averageRating: "0",
        totalReviews: 0,
        helpfulResponses: 0,
        todayResponses: 0,
        lastResetDate: new Date(),
        ...updates
      });
    }
  }

  async getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    resolvedRequests: number;
    totalResponses: number;
  }> {
    const totalRequests = this.requests.length;
    const activeExperts = this.users.filter(u => u.isExpert && u.isActive).length;
    const resolvedRequests = this.requests.filter(r => r.resolved).length;
    const totalResponses = this.responses.length;

    return {
      totalRequests,
      activeExperts,
      resolvedRequests,
      totalResponses
    };
  }

  async getTopCommunityHelpers(): Promise<Array<{
    id: number;
    name: string;
    profession: string;
    batchYear: number;
    profileImage: string | null;
    metrics: {
      averageRating: number;
      totalResponses: number;
      bestAnswers: number;
      totalRating: number;
      score: number;
    };
  }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all users with their metrics for the last 30 days
    const userMetrics = this.users.map(user => {
      // Get responses in last 30 days
      const recentResponses = this.responses.filter(r => 
        r.expertId === user.id && r.createdAt && r.createdAt >= thirtyDaysAgo
      );

      // Get reviews for these responses
      const responseReviews = this.responseReviews.filter(review =>
        recentResponses.some(response => response.id === review.responseId)
      );

      // Get best answers (responses that were marked as best)
      const bestAnswers = this.requests.filter(req => 
        req.bestResponseId && recentResponses.some(resp => resp.id === req.bestResponseId)
      ).length;

      // Calculate metrics
      const totalResponses = recentResponses.length;
      const totalRating = responseReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = responseReviews.length > 0 ? totalRating / responseReviews.length : 0;

      // Calculate score: weighted combination of metrics
      const score = (averageRating * 0.4) + (totalResponses * 0.3) + (bestAnswers * 0.3);

      return {
        id: user.id,
        name: user.name,
        profession: user.profession || "Not specified",
        batchYear: user.batchYear,
        profileImage: user.profileImage,
        metrics: {
          averageRating: Number(averageRating.toFixed(2)),
          totalResponses,
          bestAnswers,
          totalRating,
          score: Number(score.toFixed(2))
        }
      };
    })
    .filter(user => user.metrics.totalResponses > 0) // Only users with responses
    .sort((a, b) => b.metrics.score - a.metrics.score) // Sort by score descending
    .slice(0, 3); // Top 3

    return userMetrics;
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const userRequests = this.requests.filter(r => r.userId === userId);
    const requestsPosted = userRequests.length;
    const requestsResolved = userRequests.filter(r => r.resolved).length;

    const userResponses = this.responses.filter(r => r.expertId === userId);
    const requestsResponded = userResponses.length;

    const reviewsGiven = this.reviews.filter(r => r.userId === userId);
    const reviewsReceived = this.reviews.filter(r => r.expertId === userId);

    return {
      requestsPosted,
      requestsResponded,
      requestsResolved,
      reviewsGiven: reviewsGiven.length,
      reviewsReceived: reviewsReceived.length
    };
  }

  async markBestResponse(requestId: number, responseId: number): Promise<Request | undefined> {
    const requestIndex = this.requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return undefined;
    
    this.requests[requestIndex] = { 
      ...this.requests[requestIndex], 
      bestResponseId: responseId,
      status: "resolved",
      resolved: true,
      updatedAt: new Date() 
    };
    return this.requests[requestIndex];
  }

  async createResponseReview(review: InsertResponseReview): Promise<ResponseReview> {
    const newReview: ResponseReview = {
      id: this.nextId++,
      ...review,
      createdAt: new Date()
    };
    this.responseReviews.push(newReview);
    return newReview;
  }

  async getResponseReviewsByResponseId(responseId: number): Promise<ResponseReview[]> {
    return this.responseReviews.filter(r => r.responseId === responseId);
  }

  async createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const newMessage: PrivateMessage = {
      id: this.nextId++,
      ...message,
      isRead: false,
      createdAt: new Date()
    };
    this.privateMessages.push(newMessage);
    return newMessage;
  }

  async getPrivateMessagesByRequestId(requestId: number): Promise<PrivateMessageWithUser[]> {
    const messages = this.privateMessages.filter(m => m.requestId === requestId);
    return Promise.all(messages.map(async message => {
      const user = await this.getUserById(message.senderId);
      return {
        ...message,
        user: user!
      };
    }));
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    const messageIndex = this.privateMessages.findIndex(m => 
      m.id === messageId && m.receiverId === userId
    );
    if (messageIndex !== -1) {
      this.privateMessages[messageIndex].isRead = true;
    }
  }

  async getPrivateMessages(requestId: number, userId: number, otherUserId: number): Promise<PrivateMessageWithUser[]> {
    const messages = this.privateMessages.filter(m => 
      m.requestId === requestId && 
      ((m.senderId === userId && m.receiverId === otherUserId) || 
       (m.senderId === otherUserId && m.receiverId === userId))
    );
    
    return Promise.all(messages.map(async message => {
      const sender = await this.getUserById(message.senderId);
      const receiver = await this.getUserById(message.receiverId);
      return {
        ...message,
        sender: sender!,
        receiver: receiver!
      };
    }));
  }

  async getUserConversations(userId: number): Promise<any[]> {
    const userMessages = this.privateMessages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
    
    const conversationMap = new Map();
    
    for (const message of userMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const key = `${message.requestId}-${otherUserId}`;
      
      if (!conversationMap.has(key) || message.createdAt > conversationMap.get(key).lastMessageTime) {
        const unreadCount = this.privateMessages.filter(m => 
          m.requestId === message.requestId && 
          m.receiverId === userId && 
          !m.isRead &&
          m.senderId === otherUserId
        ).length;
        
        conversationMap.set(key, {
          requestId: message.requestId,
          otherUserId,
          lastMessageTime: message.createdAt,
          lastMessage: message.content,
          unreadCount
        });
      }
    }
    
    return Array.from(conversationMap.values()).sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }
}

export class DatabaseStorage implements IStorage {
  private get db() {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const expertUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.isExpert, true))
      .limit(limit);
    
    return Promise.all(expertUsers.map(async (expert) => {
      const stats = await this.getExpertStats(expert.id);
      return {
        ...expert,
        stats,
        availableSlots: expert.dailyRequestLimit ? expert.dailyRequestLimit - (stats?.totalResponses || 0) : 10
      };
    }));
  }

  async getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]> {
    const expertUsers = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.isExpert, true),
        sql`${users.expertiseAreas} @> ${[expertise]}`
      ));
    
    return Promise.all(expertUsers.map(async (expert) => {
      const stats = await this.getExpertStats(expert.id);
      return {
        ...expert,
        stats,
        availableSlots: expert.dailyRequestLimit ? expert.dailyRequestLimit - (stats?.totalResponses || 0) : 10
      };
    }));
  }

  async createUserWithPhone(userData: any): Promise<User> {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    
    const [user] = await this.db
      .insert(users)
      .values({
        phone: userData.phone,
        email: userData.email || null,
        name: userData.name,
        password: hashedPassword,
        authProvider: userData.authProvider,
        batchYear: userData.batchYear,
        profession: userData.profession,
        state: userData.state,
        district: userData.district,
        createdAt: userData.createdAt,
        lastActive: userData.lastActive,
        emailVerified: userData.emailVerified,
        isExpert: userData.isExpert,
        isActive: userData.isActive,
        phoneVisible: userData.phoneVisible,
        gpsEnabled: userData.gpsEnabled,
        dailyRequestLimit: userData.dailyRequestLimit,
        googleId: null,
        facebookId: null,
        appleId: null,
        gender: userData.gender,
        professionOther: userData.professionOther,
        // currentState: userData.currentState,
        // currentDistrict: userData.currentDistrict,
        pinCode: userData.pinCode,
        gpsLocation: userData.gpsLocation,
        helpAreas: userData.helpAreas,
        helpAreasOther: userData.helpAreasOther,
        expertiseAreas: userData.expertiseAreas,
        upiId: userData.upiId,
        bio: userData.bio,
        profileImage: null
      })
      .returning();
    return user;
  }

  async verifyUserPassword(phone: string, password: string): Promise<User | null> {
    console.log("Database: Looking for user with phone:", phone);
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, phone));
    
    console.log("Database: User found:", !!user, "Has password:", !!user?.password);
    if (!user || !user.password) {
      console.log("Database: No user found or no password stored");
      return null;
    }
    
    console.log("Database: Comparing password...");
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("Database: Password comparison result:", isValidPassword);
    return isValidPassword ? user : null;
  }

  async createUserWithSocialAuth(userData: Partial<User>): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        lastActive: new Date(),
        emailVerified: true, // Social logins are pre-verified
        isActive: true,
        phoneVisible: false,
        gpsEnabled: false,
        dailyRequestLimit: 3,
        isExpert: false
      } as any)
      .returning();
    return user;
  }

  async getUserBySocialId(provider: string, socialId: string): Promise<User | undefined> {
    let query;
    switch (provider) {
      case 'google':
        query = eq(users.googleId, socialId);
        break;
      case 'facebook':
        query = eq(users.facebookId, socialId);
        break;
      case 'apple':
        query = eq(users.appleId, socialId);
        break;
      default:
        return undefined;
    }
    
    const [user] = await this.db.select().from(users).where(query);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const [emailVerif] = await this.db
      .insert(emailVerifications)
      .values({
        ...verification,
        createdAt: new Date(),
        verified: false
      })
      .returning();
    return emailVerif;
  }

  async verifyEmailToken(email: string, token: string): Promise<boolean> {
    const [verification] = await this.db
      .select()
      .from(emailVerifications)
      .where(and(
        eq(emailVerifications.email, email),
        eq(emailVerifications.token, token),
        sql`${emailVerifications.expiresAt} > NOW()`
      ))
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (verification) {
      await this.db
        .update(emailVerifications)
        .set({ verified: true })
        .where(eq(emailVerifications.id, verification.id));
      
      // Mark user email as verified
      await this.db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.email, email));
      
      return true;
    }
    return false;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const [request] = await this.db
      .insert(requests)
      .values({
        ...insertRequest,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return request;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await this.db.select().from(requests).where(eq(requests.id, id));
    return request || undefined;
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const result = await this.db
      .select({
        request: requests,
        user: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear
        }
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.id, id));

    if (result.length === 0) return undefined;

    const { request, user } = result[0];
    return {
      ...request,
      user: user!
    };
  }

  async getRequestsByUserId(userId: number, status?: string, limit = 20, offset = 0): Promise<{ requests: RequestWithUser[], total: number }> {
    const baseQuery = this.db
      .select({
        request: requests,
        user: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear
        }
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id));

    const whereConditions = [eq(requests.userId, userId)];
    if (status) {
      whereConditions.push(eq(requests.status, status));
    }

    const totalResult = await this.db
      .select({ count: sql`count(*)` })
      .from(requests)
      .where(and(...whereConditions));
    
    const total = Number(totalResult[0]?.count || 0);

    const result = await baseQuery
      .where(and(...whereConditions))
      .orderBy(desc(requests.createdAt))
      .limit(limit)
      .offset(offset);

    const requests_ = result.map(({ request, user }) => ({
      ...request,
      user: user!
    }));

    return { requests: requests_, total };
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const result = await this.db
      .select({
        request: requests,
        user: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear
        }
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.status, 'open'))
      .orderBy(desc(requests.createdAt))
      .limit(limit);

    return await Promise.all(result.map(async ({ request, user }) => {
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));
  }

  async getRequests(status = "open", limit = 20, offset = 0): Promise<{ requests: RequestWithUser[], total: number }> {
    const baseQuery = this.db
      .select({
        request: requests,
        user: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear
        }
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id));

    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(requests.status, status));
    }

    const totalResult = await this.db
      .select({ count: sql`count(*)` })
      .from(requests)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = Number(totalResult[0]?.count || 0);

    const result = await baseQuery
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(requests.createdAt))
      .limit(limit)
      .offset(offset);

    const requests_ = await Promise.all(result.map(async ({ request, user }) => {
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));

    return { requests: requests_, total };
  }

  async updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined> {
    const [request] = await this.db
      .update(requests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request || undefined;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const [request] = await this.db
      .update(requests)
      .set({ status, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request || undefined;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await this.db
      .insert(responses)
      .values({
        ...insertResponse,
        createdAt: new Date(),
        isHelpful: false,
        helpfulCount: 0
      })
      .returning();
    return response;
  }

  async getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]> {
    const result = await this.db
      .select({
        response: responses,
        expert: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear,
          profileImage: users.profileImage
        }
      })
      .from(responses)
      .leftJoin(users, eq(responses.expertId, users.id))
      .where(eq(responses.requestId, requestId))
      .orderBy(desc(responses.createdAt));

    return result.map(({ response, expert }) => ({
      ...response,
      expert: expert!
    }));
  }

  async markResponseHelpful(responseId: number): Promise<void> {
    await this.db
      .update(responses)
      .set({ 
        isHelpful: true,
        helpfulCount: sql`${responses.helpfulCount} + 1`
      })
      .where(eq(responses.id, responseId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await this.db
      .insert(reviews)
      .values({
        ...insertReview,
        createdAt: new Date()
      })
      .returning();
    return review;
  }

  async getReviewsByExpertId(expertId: number): Promise<Review[]> {
    return await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.expertId, expertId))
      .orderBy(desc(reviews.createdAt));
  }

  async getExpertStats(expertId: number): Promise<ExpertStats | undefined> {
    const [stats] = await this.db
      .select()
      .from(expertStats)
      .where(eq(expertStats.expertId, expertId));
    return stats || undefined;
  }

  async updateExpertStats(expertId: number): Promise<void> {
    const totalResponses = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.expertId, expertId));

    const avgRating = await this.db
      .select({ avg: sql<number>`avg(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.expertId, expertId));

    await this.db
      .insert(expertStats)
      .values({
        expertId,
        totalResponses: totalResponses[0]?.count || 0,
        averageRating: avgRating[0]?.avg || 0,
        totalReviews: 0,
        successRate: 0,
        responseTime: "2 hours"
      })
      .onConflictDoUpdate({
        target: expertStats.expertId,
        set: {
          totalResponses: totalResponses[0]?.count || 0,
          averageRating: avgRating[0]?.avg || 0
        }
      });
  }

  async getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    resolvedRequests: number;
    totalResponses: number;
  }> {
    const [totalRequestsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(requests);

    const [activeExpertsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isExpert, true));

    const [resolvedRequestsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(eq(requests.status, 'resolved'));

    const [totalResponsesResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(responses);

    return {
      totalRequests: totalRequestsResult?.count || 0,
      activeExperts: activeExpertsResult?.count || 0,
      resolvedRequests: resolvedRequestsResult?.count || 0,
      totalResponses: totalResponsesResult?.count || 0
    };
  }

  async getTopCommunityHelpers(): Promise<Array<{
    id: number;
    name: string;
    profession: string;
    batchYear: number;
    profileImage: string | null;
    metrics: {
      averageRating: number;
      totalResponses: number;
      bestAnswers: number;
      totalRating: number;
      score: number;
    };
  }>> {
    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Complex query to get top helpers with their metrics
    const topHelpersQuery = await this.db
      .select({
        id: users.id,
        name: users.name,
        profession: users.profession,
        batchYear: users.batchYear,
        profileImage: users.profileImage,
        totalResponses: sql<number>`COUNT(DISTINCT ${responses.id})`,
        averageRating: sql<number>`COALESCE(AVG(${responseReviews.rating}), 0)`,
        totalRating: sql<number>`COALESCE(SUM(${responseReviews.rating}), 0)`,
        bestAnswers: sql<number>`COUNT(DISTINCT CASE WHEN ${requests.bestResponseId} = ${responses.id} THEN ${requests.id} END)`
      })
      .from(users)
      .leftJoin(responses, and(
        eq(responses.expertId, users.id),
        sql`${responses.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      ))
      .leftJoin(responseReviews, eq(responseReviews.responseId, responses.id))
      .leftJoin(requests, eq(requests.bestResponseId, responses.id))
      .groupBy(users.id, users.name, users.profession, users.batchYear, users.profileImage)
      .having(sql`COUNT(DISTINCT ${responses.id}) > 0`)
      .orderBy(sql`(COALESCE(AVG(${responseReviews.rating}), 0) * 0.4 + COUNT(DISTINCT ${responses.id}) * 0.3 + COUNT(DISTINCT CASE WHEN ${requests.bestResponseId} = ${responses.id} THEN ${requests.id} END) * 0.3) DESC`)
      .limit(3);

    return topHelpersQuery.map(helper => ({
      id: helper.id,
      name: helper.name,
      profession: helper.profession || "Not specified",
      batchYear: helper.batchYear,
      profileImage: helper.profileImage,
      metrics: {
        averageRating: Number((helper.averageRating || 0).toFixed(2)),
        totalResponses: helper.totalResponses || 0,
        bestAnswers: helper.bestAnswers || 0,
        totalRating: helper.totalRating || 0,
        score: Number(((helper.averageRating * 0.4) + (helper.totalResponses * 0.3) + (helper.bestAnswers * 0.3)).toFixed(2))
      }
    }));
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const [requestsPosted] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(eq(requests.userId, userId));

    const [requestsResponded] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.expertId, userId));

    const [requestsResolved] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(
        eq(requests.userId, userId),
        eq(requests.status, 'resolved')
      ));

    const [reviewsGiven] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    const [reviewsReceived] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.expertId, userId));

    return {
      requestsPosted: requestsPosted?.count || 0,
      requestsResponded: requestsResponded?.count || 0,
      requestsResolved: requestsResolved?.count || 0,
      reviewsGiven: reviewsGiven?.count || 0,
      reviewsReceived: reviewsReceived?.count || 0
    };
  }

  // Response review methods
  async createResponseReview(review: InsertResponseReview): Promise<ResponseReview> {
    const [responseReview] = await db
      .insert(responseReviews)
      .values({
        ...review,
        createdAt: new Date()
      })
      .returning();
    return responseReview;
  }

  async getResponseReviewsByResponseId(responseId: number): Promise<ResponseReview[]> {
    return await this.db
      .select()
      .from(responseReviews)
      .where(eq(responseReviews.responseId, responseId))
      .orderBy(desc(responseReviews.createdAt));
  }

  async markBestResponse(requestId: number, responseId: number): Promise<Request | undefined> {
    const [request] = await this.db
      .update(requests)
      .set({ 
        bestResponseId: responseId,
        status: "resolved",
        resolved: true,
        updatedAt: new Date()
      })
      .where(eq(requests.id, requestId))
      .returning();
    return request || undefined;
  }

  // OTP verification methods
  async createOtpVerification(otp: { phone: string; otp: string; expiresAt: Date }): Promise<OtpVerification> {
    const [otpRecord] = await this.db
      .insert(otpVerifications)
      .values({
        phone: otp.phone,
        otp: otp.otp,
        expiresAt: otp.expiresAt,
        verified: false,
        createdAt: new Date()
      })
      .returning();
    return otpRecord;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    try {
      // Development mode: Allow default OTP "123456" to always work
      if (process.env.NODE_ENV === 'development' && otp === '123456') {
        console.log(`[DEV] Using default OTP 123456 for phone: ${phone}`);
        return true;
      }

      // Find the most recent, unverified OTP for this phone
      const [verification] = await this.db
        .select()
        .from(otpVerifications)
        .where(and(
          eq(otpVerifications.phone, phone),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.verified, false),
          gt(otpVerifications.expiresAt, new Date())
        ))
        .orderBy(desc(otpVerifications.createdAt))
        .limit(1);

      if (verification) {
        // Mark OTP as verified
        await this.db
          .update(otpVerifications)
          .set({ verified: true })
          .where(eq(otpVerifications.id, verification.id));
        
        console.log(`[OTP] Verified real OTP ${otp} for phone: ${phone}`);
        return true;
      }
      
      console.log(`[OTP] Invalid or expired OTP ${otp} for phone: ${phone}`);
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  }

  // Private message methods  
  async createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [privateMessage] = await this.db
      .insert(privateMessages)
      .values({
        ...message,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return privateMessage;
  }

  async getPrivateMessages(requestId: number, userId: number, otherUserId: number): Promise<PrivateMessageWithUser[]> {
    const result = await this.db
      .select({
        message: privateMessages,
        sender: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear,
          profileImage: users.profileImage
        },
        receiver: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear,
          profileImage: users.profileImage
        }
      })
      .from(privateMessages)
      .leftJoin(users, eq(privateMessages.senderId, users.id))
      .where(and(
        eq(privateMessages.requestId, requestId),
        sql`(${privateMessages.senderId} = ${userId} AND ${privateMessages.receiverId} = ${otherUserId}) OR (${privateMessages.senderId} = ${otherUserId} AND ${privateMessages.receiverId} = ${userId})`
      ))
      .orderBy(privateMessages.createdAt);

    return result.map(({ message, sender }) => ({
      ...message,
      sender: sender!,
      receiver: sender! // This will be populated correctly based on the query
    }));
  }

  async getPrivateMessagesByRequestId(requestId: number): Promise<PrivateMessageWithUser[]> {
    const result = await this.db
      .select({
        message: privateMessages,
        sender: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          batchYear: users.batchYear,
          profileImage: users.profileImage
        }
      })
      .from(privateMessages)
      .leftJoin(users, eq(privateMessages.senderId, users.id))
      .where(eq(privateMessages.requestId, requestId))
      .orderBy(privateMessages.createdAt);

    return result.map(({ message, sender }) => ({
      ...message,
      sender: sender!,
      receiver: sender! // This should be populated from a separate query if needed
    }));
  }

  async getUserConversations(userId: number): Promise<any[]> {
    const conversations = await this.db
      .select({
        requestId: privateMessages.requestId,
        otherUserId: sql<number>`CASE WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.receiverId} ELSE ${privateMessages.senderId} END`,
        lastMessageTime: sql<Date>`MAX(${privateMessages.createdAt})`,
        lastMessage: sql<string>`(SELECT ${privateMessages.content} FROM ${privateMessages} WHERE ${privateMessages.requestId} = ${privateMessages.requestId} AND ((${privateMessages.senderId} = ${userId} AND ${privateMessages.receiverId} = ${sql<number>`CASE WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.receiverId} ELSE ${privateMessages.senderId} END`}) OR (${privateMessages.senderId} = ${sql<number>`CASE WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.receiverId} ELSE ${privateMessages.senderId} END`} AND ${privateMessages.receiverId} = ${userId})) ORDER BY ${privateMessages.createdAt} DESC LIMIT 1)`,
        unreadCount: sql<number>`COUNT(CASE WHEN ${privateMessages.receiverId} = ${userId} AND ${privateMessages.isRead} = false THEN 1 END)`
      })
      .from(privateMessages)
      .where(sql`${privateMessages.senderId} = ${userId} OR ${privateMessages.receiverId} = ${userId}`)
      .groupBy(privateMessages.requestId, sql`CASE WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.receiverId} ELSE ${privateMessages.senderId} END`)
      .orderBy(sql`MAX(${privateMessages.createdAt}) DESC`);

    return conversations;
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    await this.db
      .update(privateMessages)
      .set({ isRead: true })
      .where(and(
        eq(privateMessages.id, messageId),
        eq(privateMessages.receiverId, userId)
      ));
  }

  // Notification management
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: number, limit: number = 50): Promise<NotificationWithUser[]> {
    const result = await this.db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        entityType: notifications.entityType,
        entityId: notifications.entityId,
        actionUserId: notifications.actionUserId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        actionUser: {
          id: users.id,
          name: users.name,
          profession: users.profession,
          profileImage: users.profileImage,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actionUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entityType,
      entityId: row.entityId,
      actionUserId: row.actionUserId,
      isRead: row.isRead,
      createdAt: row.createdAt,
      actionUser: row.actionUser.id ? row.actionUser : undefined,
    }));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

// Switch between storage implementations based on environment
let _storage: IStorage | null = null;

export const storage: IStorage = {
  // Lazy initialization wrapper
  get _impl() {
    if (!_storage) {
      const db = getDb();
      _storage = db ? new DatabaseStorage() : new MemStorage();
    }
    return _storage;
  },

  // Delegate all methods to the actual implementation
  createUser: (user) => storage._impl.createUser(user),
  getUserById: (id) => storage._impl.getUserById(id),
  getAllUsers: () => storage._impl.getAllUsers(),
  getUserByEmail: (email) => storage._impl.getUserByEmail(email),
  getUserByPhone: (phone) => storage._impl.getUserByPhone(phone),
  updateUser: (id, updates) => storage._impl.updateUser(id, updates),
  getExperts: (limit) => storage._impl.getExperts(limit),
  getExpertsByExpertise: (expertise) => storage._impl.getExpertsByExpertise(expertise),
  createUserWithPhone: (userData) => storage._impl.createUserWithPhone(userData),
  verifyUserPassword: (phone, password) => storage._impl.verifyUserPassword(phone, password),
  verifyEmailToken: (email, token) => storage._impl.verifyEmailToken(email, token),
  createRequest: (request) => storage._impl.createRequest(request),
  getRequest: (id) => storage._impl.getRequest(id),
  getRequestById: (id) => storage._impl.getRequestById(id),
  getRequests: (status, limit, offset) => storage._impl.getRequests(status, limit, offset),
  getRequestsByUserId: (userId, status, limit, offset) => storage._impl.getRequestsByUserId(userId, status, limit, offset),
  updateRequest: (id, updates) => storage._impl.updateRequest(id, updates),
  updateRequestStatus: (id, status) => storage._impl.updateRequestStatus(id, status),
  createResponse: (response) => storage._impl.createResponse(response),
  getResponsesByRequestId: (requestId) => storage._impl.getResponsesByRequestId(requestId),
  markResponseHelpful: (responseId) => storage._impl.markResponseHelpful(responseId),
  createReview: (review) => storage._impl.createReview(review),
  getReviewsByExpertId: (expertId) => storage._impl.getReviewsByExpertId(expertId),
  getDashboardStats: () => storage._impl.getDashboardStats(),
  getExpertStats: (expertId) => storage._impl.getExpertStats(expertId),
  createOtpVerification: (otp) => storage._impl.createOtpVerification(otp),
  verifyOtp: (phone, otp) => storage._impl.verifyOtp(phone, otp),
  markBestResponse: (requestId, responseId) => storage._impl.markBestResponse(requestId, responseId),
  createResponseReview: (review) => storage._impl.createResponseReview(review),
  getResponseReviewsByResponseId: (responseId) => storage._impl.getResponseReviewsByResponseId(responseId),
  getTopCommunityHelpers: () => storage._impl.getTopCommunityHelpers(),
  getPersonalStats: (userId) => storage._impl.getPersonalStats(userId),
  createPrivateMessage: (message) => storage._impl.createPrivateMessage(message),
  getPrivateMessages: (requestId, userId, otherUserId) => storage._impl.getPrivateMessages(requestId, userId, otherUserId),
  getUserConversations: (userId) => storage._impl.getUserConversations(userId),
  getPrivateMessagesByRequestId: (requestId) => storage._impl.getPrivateMessagesByRequestId(requestId),
  markMessageAsRead: (messageId, userId) => storage._impl.markMessageAsRead(messageId, userId),
  createNotification: (notification) => storage._impl.createNotification(notification),
  getUserNotifications: (userId, limit) => storage._impl.getUserNotifications(userId, limit),
  getUnreadNotificationCount: (userId) => storage._impl.getUnreadNotificationCount(userId),
  markNotificationAsRead: (notificationId, userId) => storage._impl.markNotificationAsRead(notificationId, userId),
  markAllNotificationsAsRead: (userId) => storage._impl.markAllNotificationsAsRead(userId),
} as IStorage;
