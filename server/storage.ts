import { 
  users, requests, responses, reviews, expertStats, emailVerifications, responseReviews, privateMessages,
  type User, type InsertUser,
  type Request, type InsertRequest, type RequestWithUser,
  type Response, type InsertResponse, type ResponseWithExpert,
  type Review, type InsertReview,
  type ResponseReview, type InsertResponseReview,
  type PrivateMessage, type InsertPrivateMessage, type PrivateMessageWithUser,
  type ExpertStats,
  type EmailVerification, type InsertEmailVerification,
  type ExpertWithStats,
  type EmailSignup, type EmailLogin
} from "@shared/schema";
import bcrypt from "bcrypt";
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
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
  
  // Request management
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestById(id: number): Promise<RequestWithUser | undefined>;
  getRequestsByUserId(userId: number): Promise<RequestWithUser[]>;
  getOpenRequests(limit?: number): Promise<RequestWithUser[]>;
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
}



export class MemStorage implements IStorage {
  private users: User[] = [];
  private requests: Request[] = [];
  private responses: Response[] = [];
  private reviews: Review[] = [];
  private otpVerifications: OtpVerification[] = [];
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
      gender: "female",
      batchYear: 2010,
      profession: "Medical Doctor",
      professionOther: null,
      state: "Maharashtra",
      district: "Mumbai",
      pinCode: "400001",
      expertiseAreas: ["General Medicine", "Emergency Care"],
      isExpert: true,
      isActive: true,
      dailyRequestLimit: 5,
      upiId: "sarah.johnson@okicici",
      profileImage: null,
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
      helpLocationNotApplicable: false,
      helpLocationState: "Maharashtra",
      helpLocationDistrict: "Mumbai",
      helpLocationPinCode: "400001",
      contactPreference: "chat",
      budget: "free",
      timeline: "1 week",
      attachments: [],
      targetExpertId: null,
      status: "open",
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(u => u.phone === phone);
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

  async createOtpVerification(otp: InsertOtp): Promise<OtpVerification> {
    const newOtp: OtpVerification = {
      id: this.nextId++,
      ...otp,
      verified: false,
      createdAt: new Date()
    };
    this.otpVerifications.push(newOtp);
    return newOtp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
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

  async getRequestsByUserId(userId: number): Promise<RequestWithUser[]> {
    const userRequests = this.requests.filter(r => r.userId === userId);
    return Promise.all(userRequests.map(async request => {
      const user = await this.getUserById(request.userId);
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: user!,
        responseCount: responses.length
      };
    }));
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
}

export class DatabaseStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const expertUsers = await db
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
    const expertUsers = await db
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
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
        currentState: userData.currentState,
        currentDistrict: userData.currentDistrict,
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone));
    
    if (!user || !user.password) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  async createUserWithSocialAuth(userData: Partial<User>): Promise<User> {
    const [user] = await db
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
    
    const [user] = await db.select().from(users).where(query);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const [emailVerif] = await db
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
    const [verification] = await db
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
      await db
        .update(emailVerifications)
        .set({ verified: true })
        .where(eq(emailVerifications.id, verification.id));
      
      // Mark user email as verified
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.email, email));
      
      return true;
    }
    return false;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const [request] = await db
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
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request || undefined;
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const result = await db
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

  async getRequestsByUserId(userId: number): Promise<RequestWithUser[]> {
    const result = await db
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
      .where(eq(requests.userId, userId))
      .orderBy(desc(requests.createdAt));

    return result.map(({ request, user }) => ({
      ...request,
      user: user!
    }));
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const result = await db
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

    return result.map(({ request, user }) => ({
      ...request,
      user: user!
    }));
  }

  async updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request || undefined;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ status, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request || undefined;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
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
    const result = await db
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
    await db
      .update(responses)
      .set({ 
        isHelpful: true,
        helpfulCount: sql`${responses.helpfulCount} + 1`
      })
      .where(eq(responses.id, responseId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values({
        ...insertReview,
        createdAt: new Date()
      })
      .returning();
    return review;
  }

  async getReviewsByExpertId(expertId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.expertId, expertId))
      .orderBy(desc(reviews.createdAt));
  }

  async getExpertStats(expertId: number): Promise<ExpertStats | undefined> {
    const [stats] = await db
      .select()
      .from(expertStats)
      .where(eq(expertStats.expertId, expertId));
    return stats || undefined;
  }

  async updateExpertStats(expertId: number): Promise<void> {
    const totalResponses = await db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.expertId, expertId));

    const avgRating = await db
      .select({ avg: sql<number>`avg(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.expertId, expertId));

    await db
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
    const [totalRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests);

    const [activeExpertsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isExpert, true));

    const [resolvedRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(eq(requests.status, 'resolved'));

    const [totalResponsesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(responses);

    return {
      totalRequests: totalRequestsResult?.count || 0,
      activeExperts: activeExpertsResult?.count || 0,
      resolvedRequests: resolvedRequestsResult?.count || 0,
      totalResponses: totalResponsesResult?.count || 0
    };
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const [requestsPosted] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(eq(requests.userId, userId));

    const [requestsResponded] = await db
      .select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.expertId, userId));

    const [requestsResolved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(
        eq(requests.userId, userId),
        eq(requests.status, 'resolved')
      ));

    const [reviewsGiven] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    const [reviewsReceived] = await db
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
    // Implementation would go here - need to add responseReviews table to schema
    throw new Error("Not implemented yet");
  }

  async getResponseReviewsByResponseId(responseId: number): Promise<ResponseReview[]> {
    // Implementation would go here
    throw new Error("Not implemented yet");
  }

  // Private message methods  
  async createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    // Implementation would go here - need to add privateMessages table to schema
    throw new Error("Not implemented yet");
  }

  async getPrivateMessagesByRequestId(requestId: number): Promise<PrivateMessageWithUser[]> {
    // Implementation would go here
    throw new Error("Not implemented yet");
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    // Implementation would go here
    throw new Error("Not implemented yet");
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
