import { 
  users, requests, responses, reviews, expertStats, otpVerifications,
  type User, type InsertUser,
  type Request, type InsertRequest, type RequestWithUser,
  type Response, type InsertResponse, type ResponseWithExpert,
  type Review, type InsertReview,
  type ExpertStats,
  type OtpVerification, type InsertOtp,
  type ExpertWithStats
} from "@shared/schema";
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getExperts(limit?: number): Promise<ExpertWithStats[]>;
  getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]>;

  // OTP management
  createOtpVerification(otp: InsertOtp): Promise<OtpVerification>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
  
  // Request management
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestById(id: number): Promise<RequestWithUser | undefined>;
  getRequestsByUserId(userId: number): Promise<RequestWithUser[]>;
  getOpenRequests(limit?: number): Promise<RequestWithUser[]>;
  updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined>;
  updateRequestStatus(id: number, status: string): Promise<Request | undefined>;
  
  // Response management
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]>;
  markResponseHelpful(responseId: number): Promise<void>;
  
  // Review management
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByExpertId(expertId: number): Promise<Review[]>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private requests: Map<number, Request> = new Map();
  private responses: Map<number, Response> = new Map();
  private reviews: Map<number, Review> = new Map();
  private expertStats: Map<number, ExpertStats> = new Map();
  private otpVerifications: Map<string, OtpVerification> = new Map();
  
  private currentUserId = 1;
  private currentRequestId = 1;
  private currentResponseId = 1;
  private currentReviewId = 1;
  private currentStatsId = 1;
  private currentOtpId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed expert users
    const expertUsers = [
      {
        id: 1,
        phone: "+919876543210",
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        batchYear: 1995,
        profession: "Cardiologist",
        location: "New Delhi",
        pinCode: "110001",
        expertiseAreas: ["Cardiology", "General Medicine", "Health Consultation"],
        isExpert: true,
        dailyRequestLimit: 5,
        phoneVisible: true,
        upiId: "rajesh@paytm",
        bio: "Experienced cardiologist with 25+ years in practice",
        profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        id: 2,
        phone: "+919876543211",
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        batchYear: 2010,
        profession: "Software Engineer",
        location: "Bangalore",
        pinCode: "560001",
        expertiseAreas: ["Technology", "Career Guidance", "Software Development"],
        isExpert: true,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: "priya@gpay",
        bio: "Senior software engineer helping with tech career transitions",
        profileImage: "",
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        id: 3,
        phone: "+919876543212",
        name: "Amit Singh",
        email: "amit.singh@email.com",
        batchYear: 2005,
        profession: "Education Consultant",
        location: "Mumbai",
        pinCode: "400001",
        expertiseAreas: ["Education", "Career Counseling", "Academic Guidance"],
        isExpert: true,
        dailyRequestLimit: 3,
        phoneVisible: false,
        bio: "Education consultant with expertise in academic planning",
        profileImage: "",
        isActive: true,
        lastActive: new Date(),
        createdAt: new Date()
      }
    ];

    expertUsers.forEach(user => {
      this.users.set(user.id, user as User);
      this.expertStats.set(user.id, {
        id: this.currentStatsId++,
        expertId: user.id,
        totalResponses: Math.floor(Math.random() * 200) + 50,
        averageRating: "4.8",
        totalReviews: Math.floor(Math.random() * 150) + 30,
        helpfulResponses: Math.floor(Math.random() * 180) + 40,
        todayResponses: Math.floor(Math.random() * 3),
        lastResetDate: new Date()
      });
    });

    this.currentUserId = 4;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      lastActive: new Date(),
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    
    if (user.isExpert) {
      this.expertStats.set(user.id, {
        id: this.currentStatsId++,
        expertId: user.id,
        totalResponses: 0,
        averageRating: "0",
        totalReviews: 0,
        helpfulResponses: 0,
        todayResponses: 0,
        lastResetDate: new Date()
      });
    }
    
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const experts = Array.from(this.users.values())
      .filter(user => user.isExpert && user.isActive)
      .slice(0, limit);
    
    return Promise.all(experts.map(async expert => {
      const stats = this.expertStats.get(expert.id);
      const availableSlots = expert.dailyRequestLimit! - (stats?.todayResponses || 0);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, availableSlots)
      };
    }));
  }

  async getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]> {
    const experts = Array.from(this.users.values())
      .filter(user => 
        user.isExpert && 
        user.isActive && 
        user.expertiseAreas?.some(area => 
          area.toLowerCase().includes(expertise.toLowerCase())
        )
      );
    
    return Promise.all(experts.map(async expert => {
      const stats = this.expertStats.get(expert.id);
      const availableSlots = expert.dailyRequestLimit! - (stats?.todayResponses || 0);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, availableSlots)
      };
    }));
  }

  async createOtpVerification(insertOtp: InsertOtp): Promise<OtpVerification> {
    const otp: OtpVerification = {
      ...insertOtp,
      id: this.currentOtpId++,
      verified: false,
      createdAt: new Date()
    };
    this.otpVerifications.set(insertOtp.phone, otp);
    return otp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const verification = this.otpVerifications.get(phone);
    if (!verification) return false;
    
    if (verification.otp === otp && verification.expiresAt > new Date()) {
      verification.verified = true;
      return true;
    }
    return false;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const request: Request = {
      ...insertRequest,
      id: this.currentRequestId++,
      status: "open",
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.requests.set(request.id, request);
    return request;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    
    const user = this.users.get(request.userId);
    if (!user) return undefined;
    
    const responses = await this.getResponsesByRequestId(id);
    
    return {
      ...request,
      user: {
        id: user.id,
        name: user.name,
        profession: user.profession,
        batchYear: user.batchYear
      },
      responses,
      responseCount: responses.length
    };
  }

  async getRequestsByUserId(userId: number): Promise<RequestWithUser[]> {
    const userRequests = Array.from(this.requests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    
    const user = this.users.get(userId);
    if (!user) return [];
    
    return Promise.all(userRequests.map(async request => {
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: {
          id: user.id,
          name: user.name,
          profession: user.profession,
          batchYear: user.batchYear
        },
        responseCount: responses.length
      };
    }));
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const openRequests = Array.from(this.requests.values())
      .filter(request => request.status === "open")
      .sort((a, b) => {
        // Sort by urgency first, then by creation time
        if (a.urgency === "urgent" && b.urgency !== "urgent") return -1;
        if (b.urgency === "urgent" && a.urgency !== "urgent") return 1;
        return b.createdAt!.getTime() - a.createdAt!.getTime();
      })
      .slice(0, limit);
    
    return Promise.all(openRequests.map(async request => {
      const user = this.users.get(request.userId);
      if (!user) throw new Error("User not found");
      
      const responses = await this.getResponsesByRequestId(request.id);
      return {
        ...request,
        user: {
          id: user.id,
          name: user.name,
          profession: user.profession,
          batchYear: user.batchYear
        },
        responseCount: responses.length
      };
    }));
  }

  async updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    
    request.status = status;
    request.updatedAt = new Date();
    if (status === "resolved") {
      request.resolved = true;
    }
    
    return request;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const response: Response = {
      ...insertResponse,
      id: this.currentResponseId++,
      helpfulCount: 0,
      createdAt: new Date()
    };
    this.responses.set(response.id, response);
    
    // Update expert stats
    await this.updateExpertStats(insertResponse.expertId);
    
    return response;
  }

  async getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]> {
    const requestResponses = Array.from(this.responses.values())
      .filter(response => response.requestId === requestId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
    
    return Promise.all(requestResponses.map(async response => {
      const expert = this.users.get(response.expertId);
      if (!expert) throw new Error("Expert not found");
      
      return {
        ...response,
        expert: {
          id: expert.id,
          name: expert.name,
          profession: expert.profession,
          batchYear: expert.batchYear,
          profileImage: expert.profileImage
        }
      };
    }));
  }

  async markResponseHelpful(responseId: number): Promise<void> {
    const response = this.responses.get(responseId);
    if (response) {
      response.helpfulCount = (response.helpfulCount || 0) + 1;
      response.isHelpful = true;
    }
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentReviewId++,
      createdAt: new Date()
    };
    this.reviews.set(review.id, review);
    
    // Update expert stats
    await this.updateExpertStats(insertReview.expertId);
    
    return review;
  }

  async getReviewsByExpertId(expertId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.expertId === expertId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getExpertStats(expertId: number): Promise<ExpertStats | undefined> {
    return this.expertStats.get(expertId);
  }

  async updateExpertStats(expertId: number): Promise<void> {
    let stats = this.expertStats.get(expertId);
    if (!stats) {
      stats = {
        id: this.currentStatsId++,
        expertId,
        totalResponses: 0,
        averageRating: "0",
        totalReviews: 0,
        helpfulResponses: 0,
        todayResponses: 0,
        lastResetDate: new Date()
      };
    }
    
    // Reset daily count if it's a new day
    const today = new Date();
    const lastReset = new Date(stats.lastResetDate!);
    if (today.toDateString() !== lastReset.toDateString()) {
      stats.todayResponses = 0;
      stats.lastResetDate = today;
    }
    
    // Update counts
    const responses = Array.from(this.responses.values())
      .filter(response => response.expertId === expertId);
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.expertId === expertId);
    
    stats.totalResponses = responses.length;
    stats.totalReviews = reviews.length;
    stats.helpfulResponses = responses.filter(r => r.isHelpful).length;
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      stats.averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Count today's responses
    const todayResponses = responses.filter(response => {
      const responseDate = new Date(response.createdAt!);
      return responseDate.toDateString() === today.toDateString();
    });
    stats.todayResponses = todayResponses.length;
    
    this.expertStats.set(expertId, stats);
  }

  async getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    averageResponseTime: string;
    communityRating: number;
  }> {
    const totalRequests = this.requests.size;
    const activeExperts = Array.from(this.users.values())
      .filter(user => user.isExpert && user.isActive).length;
    
    const reviews = Array.from(this.reviews.values());
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const communityRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    return {
      totalRequests,
      activeExperts,
      averageResponseTime: "12 mins",
      communityRating: Number(communityRating.toFixed(1))
    };
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const userRequests = Array.from(this.requests.values()).filter(r => r.userId === userId);
    const requestsPosted = userRequests.length;
    const requestsResolved = userRequests.filter(r => r.status === "resolved").length;
    
    const userResponses = Array.from(this.responses.values()).filter(r => r.expertId === userId);
    const requestsResponded = userResponses.length;
    
    const reviewsGiven = Array.from(this.reviews.values()).filter(r => r.userId === userId).length;
    const reviewsReceived = Array.from(this.reviews.values()).filter(r => r.expertId === userId).length;

    return {
      requestsPosted,
      requestsResponded,
      requestsResolved,
      reviewsGiven,
      reviewsReceived
    };
  }
}

export class FileStorage implements IStorage {
  private db: Database.Database;
  
  constructor(dbPath: string = './data/navodaya-connection.db') {
    // Create directory if it doesn't exist
    const dir = './data';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initializeTables();
    this.seedData();
  }

  private initializeTables() {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        gender TEXT,
        batchYear INTEGER NOT NULL,
        profession TEXT NOT NULL,
        professionOther TEXT,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        pinCode TEXT,
        gpsLocation TEXT,
        gpsEnabled BOOLEAN DEFAULT FALSE,
        helpAreas TEXT, -- JSON array
        helpAreasOther TEXT,
        expertiseAreas TEXT, -- JSON array
        isExpert BOOLEAN DEFAULT FALSE,
        dailyRequestLimit INTEGER DEFAULT 3,
        phoneVisible BOOLEAN DEFAULT FALSE,
        upiId TEXT,
        bio TEXT,
        profileImage TEXT,
        isActive BOOLEAN DEFAULT TRUE,
        lastActive DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        expertiseRequired TEXT,
        urgency TEXT NOT NULL,
        helpType TEXT NOT NULL,
        location TEXT,
        preferredContactMethod TEXT,
        targetAudience TEXT,
        isUrgent BOOLEAN DEFAULT FALSE,
        targetExpertId INTEGER,
        status TEXT DEFAULT 'open',
        resolved BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (targetExpertId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requestId INTEGER NOT NULL,
        expertId INTEGER NOT NULL,
        content TEXT NOT NULL,
        attachments TEXT, -- JSON array
        isHelpful BOOLEAN,
        helpfulCount INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requestId) REFERENCES requests(id),
        FOREIGN KEY (expertId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        requestId INTEGER NOT NULL,
        expertId INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        gratitudeAmount TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (requestId) REFERENCES requests(id),
        FOREIGN KEY (expertId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS expert_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expertId INTEGER NOT NULL,
        totalResponses INTEGER DEFAULT 0,
        averageRating TEXT DEFAULT '0',
        totalReviews INTEGER DEFAULT 0,
        helpfulResponses INTEGER DEFAULT 0,
        todayResponses INTEGER DEFAULT 0,
        lastResetDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        otp TEXT NOT NULL,
        expiresAt DATETIME NOT NULL
      );
    `);
  }

  private seedData() {
    // Check if users already exist
    const existingUsers = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (existingUsers.count > 0) return;

    // Seed expert users
    const insertUser = this.db.prepare(`
      INSERT INTO users (
        phone, name, email, batchYear, profession, state, district, pinCode,
        expertiseAreas, isExpert, dailyRequestLimit, phoneVisible, upiId, bio,
        profileImage, isActive, lastActive, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStats = this.db.prepare(`
      INSERT INTO expert_stats (
        expertId, totalResponses, averageRating, totalReviews, helpfulResponses,
        todayResponses, lastResetDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const expertUsers = [
      {
        phone: "+919876543210",
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        batchYear: 1995,
        profession: "Cardiologist",
        state: "Delhi",
        district: "New Delhi",
        pinCode: "110001",
        expertiseAreas: JSON.stringify(["Cardiology", "General Medicine", "Health Consultation"]),
        isExpert: true,
        dailyRequestLimit: 5,
        phoneVisible: true,
        upiId: "rajesh@paytm",
        bio: "Experienced cardiologist with 25+ years in practice",
        profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
        isActive: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        phone: "+919876543211",
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        batchYear: 2010,
        profession: "Software Engineer",
        state: "Karnataka",
        district: "Bengaluru Urban",
        pinCode: "560001",
        expertiseAreas: JSON.stringify(["Technology", "Career Guidance", "Software Development"]),
        isExpert: true,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: "priya@gpay",
        bio: "Senior software engineer helping with tech career transitions",
        profileImage: "",
        isActive: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        phone: "+919876543212",
        name: "Amit Singh",
        email: "amit.singh@email.com",
        batchYear: 2005,
        profession: "Education Consultant",
        state: "Maharashtra",
        district: "Mumbai",
        pinCode: "400001",
        expertiseAreas: JSON.stringify(["Education", "Career Counseling", "Academic Guidance"]),
        isExpert: true,
        dailyRequestLimit: 3,
        phoneVisible: false,
        upiId: "",
        bio: "Education consultant with expertise in academic planning",
        profileImage: "",
        isActive: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    this.db.transaction(() => {
      expertUsers.forEach((user, index) => {
        const userId = index + 1;
        insertUser.run(
          user.phone, user.name, user.email, user.batchYear, user.profession,
          user.state, user.district, user.pinCode, user.expertiseAreas, user.isExpert,
          user.dailyRequestLimit, user.phoneVisible, user.upiId, user.bio,
          user.profileImage, user.isActive, user.lastActive, user.createdAt
        );

        insertStats.run(
          userId,
          Math.floor(Math.random() * 200) + 50, // totalResponses
          "4.8", // averageRating
          Math.floor(Math.random() * 150) + 30, // totalReviews
          Math.floor(Math.random() * 180) + 40, // helpfulResponses
          Math.floor(Math.random() * 3), // todayResponses
          new Date().toISOString() // lastResetDate
        );
      });
    })();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        phone, name, email, gender, batchYear, profession, professionOther,
        state, district, pinCode, gpsLocation, gpsEnabled, helpAreas,
        helpAreasOther, expertiseAreas, isExpert, dailyRequestLimit,
        phoneVisible, upiId, bio, profileImage, isActive, lastActive, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertUser.phone,
      insertUser.name,
      insertUser.email || null,
      insertUser.gender || null,
      insertUser.batchYear,
      insertUser.profession,
      insertUser.professionOther || null,
      insertUser.state,
      insertUser.district,
      insertUser.pinCode || null,
      insertUser.gpsLocation || null,
      insertUser.gpsEnabled || false,
      JSON.stringify(insertUser.helpAreas || []),
      insertUser.helpAreasOther || null,
      JSON.stringify(insertUser.expertiseAreas || []),
      insertUser.isExpert || false,
      insertUser.dailyRequestLimit || 3,
      insertUser.phoneVisible || false,
      insertUser.upiId || null,
      insertUser.bio || null,
      insertUser.profileImage || null,
      insertUser.isActive !== false,
      new Date().toISOString(),
      new Date().toISOString()
    );

    const user = this.getUserById(result.lastInsertRowid as number);
    if (!user) throw new Error("Failed to create user");

    // Create expert stats if user is an expert
    if (insertUser.isExpert) {
      const statsStmt = this.db.prepare(`
        INSERT INTO expert_stats (expertId, totalResponses, averageRating, totalReviews, helpfulResponses, todayResponses, lastResetDate)
        VALUES (?, 0, '0', 0, 0, 0, ?)
      `);
      statsStmt.run(result.lastInsertRowid, new Date().toISOString());
    }

    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;

    return this.transformUserRow(row);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE phone = ?');
    const row = stmt.get(phone) as any;
    if (!row) return undefined;

    return this.transformUserRow(row);
  }

  private transformUserRow(row: any): User {
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      email: row.email,
      gender: row.gender,
      batchYear: row.batchYear,
      profession: row.profession,
      professionOther: row.professionOther,
      state: row.state,
      district: row.district,
      pinCode: row.pinCode,
      gpsLocation: row.gpsLocation,
      gpsEnabled: Boolean(row.gpsEnabled),
      helpAreas: row.helpAreas ? JSON.parse(row.helpAreas) : [],
      helpAreasOther: row.helpAreasOther,
      expertiseAreas: row.expertiseAreas ? JSON.parse(row.expertiseAreas) : [],
      isExpert: Boolean(row.isExpert),
      dailyRequestLimit: row.dailyRequestLimit,
      phoneVisible: Boolean(row.phoneVisible),
      upiId: row.upiId,
      bio: row.bio,
      profileImage: row.profileImage,
      isActive: Boolean(row.isActive),
      lastActive: row.lastActive ? new Date(row.lastActive) : null,
      createdAt: row.createdAt ? new Date(row.createdAt) : null
    };
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (key === 'helpAreas' || key === 'expertiseAreas') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return this.getUserById(id);

    values.push(id);
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getUserById(id);
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const stmt = this.db.prepare(`
      SELECT u.*, es.* FROM users u
      LEFT JOIN expert_stats es ON u.id = es.expertId
      WHERE u.isExpert = 1 AND u.isActive = 1
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      ...this.transformUserRow(row),
      availableSlots: Math.max(0, row.dailyRequestLimit - (row.todayResponses || 0)),
      stats: {
        id: row.expertId || 0,
        expertId: row.id,
        totalResponses: row.totalResponses || 0,
        averageRating: row.averageRating || "0",
        totalReviews: row.totalReviews || 0,
        helpfulResponses: row.helpfulResponses || 0,
        todayResponses: row.todayResponses || 0,
        lastResetDate: row.lastResetDate ? new Date(row.lastResetDate) : new Date()
      }
    }));
  }

  async getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]> {
    const stmt = this.db.prepare(`
      SELECT u.*, es.* FROM users u
      LEFT JOIN expert_stats es ON u.id = es.expertId
      WHERE u.isExpert = 1 AND u.isActive = 1 AND u.expertiseAreas LIKE ?
    `);

    const rows = stmt.all(`%"${expertise}"%`) as any[];
    return rows.map(row => ({
      ...this.transformUserRow(row),
      availableSlots: Math.max(0, row.dailyRequestLimit - (row.todayResponses || 0)),
      stats: {
        id: row.expertId || 0,
        expertId: row.id,
        totalResponses: row.totalResponses || 0,
        averageRating: row.averageRating || "0",
        totalReviews: row.totalReviews || 0,
        helpfulResponses: row.helpfulResponses || 0,
        todayResponses: row.todayResponses || 0,
        lastResetDate: row.lastResetDate ? new Date(row.lastResetDate) : new Date()
      }
    }));
  }

  async createOtpVerification(insertOtp: InsertOtp): Promise<OtpVerification> {
    const stmt = this.db.prepare(`
      INSERT INTO otp_verifications (phone, otp, expiresAt)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      insertOtp.phone,
      insertOtp.otp,
      insertOtp.expiresAt.toISOString()
    );

    return {
      id: result.lastInsertRowid as number,
      phone: insertOtp.phone,
      otp: insertOtp.otp,
      expiresAt: insertOtp.expiresAt
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE phone = ? AND otp = ? AND expiresAt > ?
      ORDER BY id DESC LIMIT 1
    `);

    const row = stmt.get(phone, otp, new Date().toISOString());
    return !!row;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const stmt = this.db.prepare(`
      INSERT INTO requests (
        userId, title, description, expertiseRequired, urgency, helpType,
        location, preferredContactMethod, targetAudience, isUrgent,
        targetExpertId, status, resolved, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      insertRequest.userId,
      insertRequest.title,
      insertRequest.description,
      insertRequest.expertiseRequired || null,
      insertRequest.urgency,
      insertRequest.helpType,
      insertRequest.location || null,
      insertRequest.preferredContactMethod || null,
      insertRequest.targetAudience || null,
      insertRequest.isUrgent || false,
      insertRequest.targetExpertId || null,
      "open",
      false,
      now,
      now
    );

    const requestRow = this.db.prepare('SELECT * FROM requests WHERE id = ?').get(result.lastInsertRowid) as any;
    return this.transformRequestRow(requestRow);
  }

  private transformRequestRow(row: any): Request {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      expertiseRequired: row.expertiseRequired,
      urgency: row.urgency,
      helpType: row.helpType,
      location: row.location,
      preferredContactMethod: row.preferredContactMethod,
      targetAudience: row.targetAudience,
      isUrgent: Boolean(row.isUrgent),
      targetExpertId: row.targetExpertId,
      status: row.status,
      resolved: Boolean(row.resolved),
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null
    };
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const stmt = this.db.prepare(`
      SELECT r.*, u.id as user_id, u.name as user_name, u.profession as user_profession, u.batchYear as user_batchYear
      FROM requests r
      JOIN users u ON r.userId = u.id
      WHERE r.id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return undefined;

    const responseCount = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE requestId = ?').get(id) as { count: number };

    return {
      ...this.transformRequestRow(row),
      user: {
        id: row.user_id,
        name: row.user_name,
        profession: row.user_profession,
        batchYear: row.user_batchYear
      },
      responseCount: responseCount.count
    };
  }

  async getRequestsByUserId(userId: number): Promise<RequestWithUser[]> {
    const stmt = this.db.prepare(`
      SELECT r.*, u.id as user_id, u.name as user_name, u.profession as user_profession, u.batchYear as user_batchYear
      FROM requests r
      JOIN users u ON r.userId = u.id
      WHERE r.userId = ?
      ORDER BY r.createdAt DESC
    `);

    const rows = stmt.all(userId) as any[];
    return Promise.all(rows.map(async row => {
      const responseCount = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE requestId = ?').get(row.id) as { count: number };
      
      return {
        ...this.transformRequestRow(row),
        user: {
          id: row.user_id,
          name: row.user_name,
          profession: row.user_profession,
          batchYear: row.user_batchYear
        },
        responseCount: responseCount.count
      };
    }));
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const stmt = this.db.prepare(`
      SELECT r.*, u.id as user_id, u.name as user_name, u.profession as user_profession, u.batchYear as user_batchYear
      FROM requests r
      JOIN users u ON r.userId = u.id
      WHERE r.status = 'open'
      ORDER BY 
        CASE WHEN r.urgency = 'urgent' THEN 1 ELSE 2 END,
        r.createdAt DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return Promise.all(rows.map(async row => {
      const responseCount = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE requestId = ?').get(row.id) as { count: number };
      
      return {
        ...this.transformRequestRow(row),
        user: {
          id: row.user_id,
          name: row.user_name,
          profession: row.user_profession,
          batchYear: row.user_batchYear
        },
        responseCount: responseCount.count
      };
    }));
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const stmt = this.db.prepare(`
      UPDATE requests 
      SET status = ?, resolved = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(status, status === "resolved", new Date().toISOString(), id);
    
    const row = this.db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
    return row ? this.transformRequestRow(row) : undefined;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const stmt = this.db.prepare(`
      INSERT INTO responses (requestId, expertId, content, attachments, isHelpful, helpfulCount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertResponse.requestId,
      insertResponse.expertId,
      insertResponse.content,
      JSON.stringify(insertResponse.attachments || []),
      insertResponse.isHelpful || null,
      0,
      new Date().toISOString()
    );

    // Update expert stats
    await this.updateExpertStats(insertResponse.expertId);

    const row = this.db.prepare('SELECT * FROM responses WHERE id = ?').get(result.lastInsertRowid) as any;
    return this.transformResponseRow(row);
  }

  private transformResponseRow(row: any): Response {
    return {
      id: row.id,
      requestId: row.requestId,
      expertId: row.expertId,
      content: row.content,
      attachments: row.attachments ? JSON.parse(row.attachments) : null,
      isHelpful: row.isHelpful ? Boolean(row.isHelpful) : null,
      helpfulCount: row.helpfulCount || null,
      createdAt: row.createdAt ? new Date(row.createdAt) : null
    };
  }

  async getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]> {
    const stmt = this.db.prepare(`
      SELECT r.*, u.id as expert_id, u.name as expert_name, u.profession as expert_profession, 
             u.batchYear as expert_batchYear, u.profileImage as expert_profileImage
      FROM responses r
      JOIN users u ON r.expertId = u.id
      WHERE r.requestId = ?
      ORDER BY r.createdAt ASC
    `);

    const rows = stmt.all(requestId) as any[];
    return rows.map(row => ({
      ...this.transformResponseRow(row),
      expert: {
        id: row.expert_id,
        name: row.expert_name,
        profession: row.expert_profession,
        batchYear: row.expert_batchYear,
        profileImage: row.expert_profileImage
      }
    }));
  }

  async markResponseHelpful(responseId: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE responses 
      SET helpfulCount = helpfulCount + 1, isHelpful = 1
      WHERE id = ?
    `);
    stmt.run(responseId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const stmt = this.db.prepare(`
      INSERT INTO reviews (userId, requestId, expertId, rating, comment, gratitudeAmount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertReview.userId,
      insertReview.requestId,
      insertReview.expertId,
      insertReview.rating,
      insertReview.comment || null,
      insertReview.gratitudeAmount || null,
      new Date().toISOString()
    );

    // Update expert stats
    await this.updateExpertStats(insertReview.expertId);

    const row = this.db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) as any;
    return this.transformReviewRow(row);
  }

  private transformReviewRow(row: any): Review {
    return {
      id: row.id,
      userId: row.userId,
      requestId: row.requestId,
      expertId: row.expertId,
      rating: row.rating,
      comment: row.comment,
      gratitudeAmount: row.gratitudeAmount,
      createdAt: row.createdAt ? new Date(row.createdAt) : null
    };
  }

  async getReviewsByExpertId(expertId: number): Promise<Review[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews 
      WHERE expertId = ? 
      ORDER BY createdAt DESC
    `);

    const rows = stmt.all(expertId) as any[];
    return rows.map(row => this.transformReviewRow(row));
  }

  async getExpertStats(expertId: number): Promise<ExpertStats | undefined> {
    const stmt = this.db.prepare('SELECT * FROM expert_stats WHERE expertId = ?');
    const row = stmt.get(expertId) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      expertId: row.expertId,
      totalResponses: row.totalResponses,
      averageRating: row.averageRating,
      totalReviews: row.totalReviews,
      helpfulResponses: row.helpfulResponses,
      todayResponses: row.todayResponses,
      lastResetDate: row.lastResetDate ? new Date(row.lastResetDate) : new Date()
    };
  }

  async updateExpertStats(expertId: number): Promise<void> {
    // Get or create stats
    let stats = await this.getExpertStats(expertId);
    if (!stats) {
      const stmt = this.db.prepare(`
        INSERT INTO expert_stats (expertId, totalResponses, averageRating, totalReviews, helpfulResponses, todayResponses, lastResetDate)
        VALUES (?, 0, '0', 0, 0, 0, ?)
      `);
      stmt.run(expertId, new Date().toISOString());
      stats = await this.getExpertStats(expertId);
      if (!stats) return;
    }

    // Reset daily count if it's a new day
    const today = new Date();
    const lastReset = new Date(stats.lastResetDate!);
    if (today.toDateString() !== lastReset.toDateString()) {
      const resetStmt = this.db.prepare(`
        UPDATE expert_stats 
        SET todayResponses = 0, lastResetDate = ?
        WHERE expertId = ?
      `);
      resetStmt.run(today.toISOString(), expertId);
    }

    // Update counts
    const responseCount = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE expertId = ?').get(expertId) as { count: number };
    const reviewCount = this.db.prepare('SELECT COUNT(*) as count FROM reviews WHERE expertId = ?').get(expertId) as { count: number };
    const helpfulCount = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE expertId = ? AND isHelpful = 1').get(expertId) as { count: number };
    const avgRating = this.db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE expertId = ?').get(expertId) as { avg: number };
    const todayCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM responses 
      WHERE expertId = ? AND date(createdAt) = date('now')
    `).get(expertId) as { count: number };

    const updateStmt = this.db.prepare(`
      UPDATE expert_stats 
      SET totalResponses = ?, totalReviews = ?, helpfulResponses = ?, 
          averageRating = ?, todayResponses = ?
      WHERE expertId = ?
    `);

    updateStmt.run(
      responseCount.count,
      reviewCount.count,
      helpfulCount.count,
      avgRating.avg ? avgRating.avg.toFixed(1) : '0',
      todayCount.count,
      expertId
    );
  }

  async getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    averageResponseTime: string;
    communityRating: number;
  }> {
    const totalRequests = this.db.prepare('SELECT COUNT(*) as count FROM requests').get() as { count: number };
    const activeExperts = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE isExpert = 1 AND isActive = 1').get() as { count: number };
    const avgRating = this.db.prepare('SELECT AVG(rating) as avg FROM reviews').get() as { avg: number };

    return {
      totalRequests: totalRequests.count,
      activeExperts: activeExperts.count,
      averageResponseTime: "12 mins",
      communityRating: Number((avgRating.avg || 0).toFixed(1))
    };
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const requestsPosted = this.db.prepare('SELECT COUNT(*) as count FROM requests WHERE userId = ?').get(userId) as { count: number };
    const requestsResolved = this.db.prepare('SELECT COUNT(*) as count FROM requests WHERE userId = ? AND status = "resolved"').get(userId) as { count: number };
    const requestsResponded = this.db.prepare('SELECT COUNT(*) as count FROM responses WHERE expertId = ?').get(userId) as { count: number };
    const reviewsGiven = this.db.prepare('SELECT COUNT(*) as count FROM reviews WHERE userId = ?').get(userId) as { count: number };
    const reviewsReceived = this.db.prepare('SELECT COUNT(*) as count FROM reviews WHERE expertId = ?').get(userId) as { count: number };

    return {
      requestsPosted: requestsPosted.count,
      requestsResponded: requestsResponded.count,
      requestsResolved: requestsResolved.count,
      reviewsGiven: reviewsGiven.count,
      reviewsReceived: reviewsReceived.count
    };
  }
}

export class PersistentMemStorage extends MemStorage {
  private dataFile = './data/storage.json';
  
  constructor() {
    super();
    this.loadData();
  }

  private loadData() {
    try {
      // Create data directory if it doesn't exist
      const dir = './data';
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Load data from file if it exists
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        
        // Restore Maps from JSON
        if (data.users) {
          this.users = new Map(Object.entries(data.users).map(([k, v]: [string, any]) => [parseInt(k), {
            ...v,
            lastActive: v.lastActive ? new Date(v.lastActive) : null,
            createdAt: v.createdAt ? new Date(v.createdAt) : null
          }]));
        }
        
        if (data.requests) {
          this.requests = new Map(Object.entries(data.requests).map(([k, v]: [string, any]) => [parseInt(k), {
            ...v,
            createdAt: v.createdAt ? new Date(v.createdAt) : null,
            updatedAt: v.updatedAt ? new Date(v.updatedAt) : null
          }]));
        }
        
        if (data.responses) {
          this.responses = new Map(Object.entries(data.responses).map(([k, v]: [string, any]) => [parseInt(k), {
            ...v,
            createdAt: v.createdAt ? new Date(v.createdAt) : null
          }]));
        }
        
        if (data.reviews) {
          this.reviews = new Map(Object.entries(data.reviews).map(([k, v]: [string, any]) => [parseInt(k), {
            ...v,
            createdAt: v.createdAt ? new Date(v.createdAt) : null
          }]));
        }
        
        if (data.expertStats) {
          this.expertStats = new Map(Object.entries(data.expertStats).map(([k, v]: [string, any]) => [parseInt(k), {
            ...v,
            lastResetDate: v.lastResetDate ? new Date(v.lastResetDate) : new Date()
          }]));
        }
        
        if (data.otpVerifications) {
          this.otpVerifications = new Map(Object.entries(data.otpVerifications).map(([k, v]: [string, any]) => [k, {
            ...v,
            expiresAt: new Date(v.expiresAt)
          }]));
        }

        // Restore counters
        if (data.counters) {
          this.currentUserId = data.counters.currentUserId || this.currentUserId;
          this.currentRequestId = data.counters.currentRequestId || this.currentRequestId;
          this.currentResponseId = data.counters.currentResponseId || this.currentResponseId;
          this.currentReviewId = data.counters.currentReviewId || this.currentReviewId;
          this.currentStatsId = data.counters.currentStatsId || this.currentStatsId;
          this.currentOtpId = data.counters.currentOtpId || this.currentOtpId;
        }

        console.log('Data loaded from persistent storage');
      }
    } catch (error) {
      console.error('Failed to load persistent data:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        users: Object.fromEntries(this.users),
        requests: Object.fromEntries(this.requests),
        responses: Object.fromEntries(this.responses),
        reviews: Object.fromEntries(this.reviews),
        expertStats: Object.fromEntries(this.expertStats),
        otpVerifications: Object.fromEntries(this.otpVerifications),
        counters: {
          currentUserId: this.currentUserId,
          currentRequestId: this.currentRequestId,
          currentResponseId: this.currentResponseId,
          currentReviewId: this.currentReviewId,
          currentStatsId: this.currentStatsId,
          currentOtpId: this.currentOtpId
        }
      };
      
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save persistent data:', error);
    }
  }

  // Override methods to save data after changes
  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await super.createUser(insertUser);
    this.saveData();
    return user;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const request = await super.createRequest(insertRequest);
    this.saveData();
    return request;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const request = await super.updateRequestStatus(id, status);
    this.saveData();
    return request;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async updateRequest(id: number, updates: Partial<Pick<Request, 'title' | 'description'>>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    
    if (updates.title !== undefined) {
      request.title = updates.title;
    }
    if (updates.description !== undefined) {
      request.description = updates.description;
    }
    request.updatedAt = new Date();
    
    this.saveData();
    return request;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const response = await super.createResponse(insertResponse);
    this.saveData();
    return response;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review = await super.createReview(insertReview);
    this.saveData();
    return review;
  }

  async createOtpVerification(insertOtp: InsertOtp): Promise<OtpVerification> {
    const otp = await super.createOtpVerification(insertOtp);
    this.saveData();
    return otp;
  }

  async markResponseHelpful(responseId: number): Promise<void> {
    await super.markResponseHelpful(responseId);
    this.saveData();
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = await super.updateUser(id, updates);
    this.saveData();
    return user;
  }
}

// Use DatabaseStorage for persistent storage

export class DatabaseStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
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
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getExperts(limit = 10): Promise<ExpertWithStats[]> {
    const expertsData = await db
      .select()
      .from(users)
      .where(eq(users.isExpert, true))
      .limit(limit);

    return Promise.all(expertsData.map(async (expert) => {
      const stats = await this.getExpertStats(expert.id);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, expert.dailyRequestLimit - (stats?.totalResponses || 0))
      };
    }));
  }

  async getExpertsByExpertise(expertise: string): Promise<ExpertWithStats[]> {
    const expertsData = await db
      .select()
      .from(users)
      .where(and(
        eq(users.isExpert, true),
        sql`${users.expertiseAreas} @> ${JSON.stringify([expertise])}`
      ));

    return Promise.all(expertsData.map(async (expert) => {
      const stats = await this.getExpertStats(expert.id);
      return {
        ...expert,
        stats,
        availableSlots: Math.max(0, expert.dailyRequestLimit - (stats?.totalResponses || 0))
      };
    }));
  }

  async createOtpVerification(insertOtp: InsertOtp): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values({
        ...insertOtp,
        createdAt: new Date(),
        verified: false,
      })
      .returning();
    return otp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(and(
        eq(otpVerifications.phone, phone),
        eq(otpVerifications.otp, otp),
        sql`${otpVerifications.expiresAt} > NOW()`
      ));

    if (verification) {
      await db
        .update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.id, verification.id));
      return true;
    }
    return false;
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const [request] = await db
      .insert(requests)
      .values({
        ...insertRequest,
        status: "open",
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return request;
  }

  async getRequestById(id: number): Promise<RequestWithUser | undefined> {
    const requestData = await db
      .select()
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.id, id));

    if (!requestData[0]) return undefined;

    const request = requestData[0].requests;
    const user = requestData[0].users;
    
    if (!user) return undefined;

    const responsesData = await this.getResponsesByRequestId(id);

    return {
      ...request,
      user: {
        id: user.id,
        name: user.name,
        profession: user.profession,
        batchYear: user.batchYear
      },
      responses: responsesData,
      responseCount: responsesData.length
    };
  }

  async getRequestsByUserId(userId: number): Promise<RequestWithUser[]> {
    const requestsData = await db
      .select()
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.userId, userId))
      .orderBy(desc(requests.createdAt));

    return Promise.all(requestsData.map(async (item) => {
      const request = item.requests;
      const user = item.users;
      
      if (!user) throw new Error("User not found");

      const responsesData = await this.getResponsesByRequestId(request.id);

      return {
        ...request,
        user: {
          id: user.id,
          name: user.name,
          profession: user.profession,
          batchYear: user.batchYear
        },
        responses: responsesData,
        responseCount: responsesData.length
      };
    }));
  }

  async getOpenRequests(limit = 20): Promise<RequestWithUser[]> {
    const requestsData = await db
      .select()
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.status, "open"))
      .orderBy(desc(requests.createdAt))
      .limit(limit);

    return Promise.all(requestsData.map(async (item) => {
      const request = item.requests;
      const user = item.users;
      
      if (!user) throw new Error("User not found");

      const responsesData = await this.getResponsesByRequestId(request.id);

      return {
        ...request,
        user: {
          id: user.id,
          name: user.name,
          profession: user.profession,
          batchYear: user.batchYear
        },
        responses: responsesData,
        responseCount: responsesData.length
      };
    }));
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({
        status,
        resolved: status === "resolved",
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();
    return request || undefined;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
      .insert(responses)
      .values({
        ...insertResponse,
        helpfulCount: 0,
        isHelpful: false,
        createdAt: new Date(),
      })
      .returning();
    return response;
  }

  async getResponsesByRequestId(requestId: number): Promise<ResponseWithExpert[]> {
    const responsesData = await db
      .select()
      .from(responses)
      .leftJoin(users, eq(responses.expertId, users.id))
      .where(eq(responses.requestId, requestId))
      .orderBy(desc(responses.createdAt));

    return responsesData.map((item) => {
      const response = item.responses;
      const expert = item.users;
      
      if (!expert) throw new Error("Expert not found");

      return {
        ...response,
        expert: {
          id: expert.id,
          name: expert.name,
          profession: expert.profession,
          batchYear: expert.batchYear,
          profileImage: expert.profileImage
        }
      };
    });
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
        createdAt: new Date(),
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
    // Calculate stats from actual data
    const reviewsData = await this.getReviewsByExpertId(expertId);
    const responsesData = await db
      .select()
      .from(responses)
      .where(eq(responses.expertId, expertId));

    const averageRating = reviewsData.length > 0 
      ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
      : 0;

    const totalResponses = responsesData.length;
    const totalReviews = reviewsData.length;

    // Upsert stats
    await db
      .insert(expertStats)
      .values({
        expertId,
        averageRating,
        totalResponses,
        totalReviews,
        responseRate: 0.95, // Default value
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: expertStats.expertId,
        set: {
          averageRating,
          totalResponses,
          totalReviews,
          updatedAt: new Date(),
        }
      });
  }

  async getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    averageResponseTime: string;
    communityRating: number;
  }> {
    const [totalRequestsResult] = await db
      .select({ count: sql`count(*)` })
      .from(requests);

    const [activeExpertsResult] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(and(
        eq(users.isExpert, true),
        eq(users.isActive, true)
      ));

    const [avgRatingResult] = await db
      .select({ avgRating: sql`avg(${expertStats.averageRating})` })
      .from(expertStats);

    return {
      totalRequests: Number(totalRequestsResult.count) || 0,
      activeExperts: Number(activeExpertsResult.count) || 0,
      averageResponseTime: "2.5 hours",
      communityRating: Number(avgRatingResult.avgRating) || 4.2
    };
  }

  async getPersonalStats(userId: number): Promise<{
    requestsPosted: number;
    requestsResponded: number;
    requestsResolved: number;
    reviewsGiven: number;
    reviewsReceived: number;
  }> {
    const [requestsPostedResult] = await db
      .select({ count: sql`count(*)` })
      .from(requests)
      .where(eq(requests.userId, userId));

    const [requestsRespondedResult] = await db
      .select({ count: sql`count(*)` })
      .from(responses)
      .where(eq(responses.expertId, userId));

    const [requestsResolvedResult] = await db
      .select({ count: sql`count(*)` })
      .from(requests)
      .innerJoin(responses, eq(requests.id, responses.requestId))
      .where(and(
        eq(responses.expertId, userId),
        eq(requests.resolved, true)
      ));

    const [reviewsGivenResult] = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    const [reviewsReceivedResult] = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(eq(reviews.expertId, userId));

    return {
      requestsPosted: Number(requestsPostedResult.count) || 0,
      requestsResponded: Number(requestsRespondedResult.count) || 0,
      requestsResolved: Number(requestsResolvedResult.count) || 0,
      reviewsGiven: Number(reviewsGivenResult.count) || 0,
      reviewsReceived: Number(reviewsReceivedResult.count) || 0,
    };
  }
}

export const storage = new PersistentMemStorage();
