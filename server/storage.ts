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
  getRequestById(id: number): Promise<RequestWithUser | undefined>;
  getRequestsByUserId(userId: number): Promise<RequestWithUser[]>;
  getOpenRequests(limit?: number): Promise<RequestWithUser[]>;
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
  updateExpertStats(expertId: number): Promise<void>;
  
  // Dashboard data
  getDashboardStats(): Promise<{
    totalRequests: number;
    activeExperts: number;
    averageResponseTime: string;
    communityRating: number;
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
    console.log("Storage.createRequest - Input data:", insertRequest);
    const request: Request = {
      ...insertRequest,
      id: this.currentRequestId++,
      status: "open",
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log("Storage.createRequest - Created request:", request);
    this.requests.set(request.id, request);
    console.log("Storage.createRequest - Total requests in storage:", this.requests.size);
    return request;
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
    console.log("Storage.getOpenRequests - Total requests in storage:", this.requests.size);
    const allRequests = Array.from(this.requests.values());
    console.log("Storage.getOpenRequests - All requests:", allRequests);
    
    const openRequests = allRequests
      .filter(request => request.status === "open")
      .sort((a, b) => {
        // Sort by urgency first, then by creation time
        if (a.urgency === "urgent" && b.urgency !== "urgent") return -1;
        if (b.urgency === "urgent" && a.urgency !== "urgent") return 1;
        return b.createdAt!.getTime() - a.createdAt!.getTime();
      })
      .slice(0, limit);
    
    console.log("Storage.getOpenRequests - Filtered open requests:", openRequests.length);
    
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

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
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
}

export const storage = new MemStorage();
