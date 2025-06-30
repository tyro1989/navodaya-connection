import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  batchYear: integer("batch_year").notNull(),
  profession: text("profession").notNull(),
  location: text("location").notNull(),
  pinCode: text("pin_code"),
  expertiseAreas: text("expertise_areas").array(),
  isExpert: boolean("is_expert").default(false),
  dailyRequestLimit: integer("daily_request_limit").default(3),
  phoneVisible: boolean("phone_visible").default(false),
  upiId: text("upi_id"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  expertiseRequired: text("expertise_required").notNull(),
  urgency: text("urgency").notNull(), // 'urgent' or 'medium'
  helpType: text("help_type").notNull(), // 'general' or 'specific'
  targetExpertId: integer("target_expert_id").references(() => users.id),
  status: text("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  attachments: text("attachments").array(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id).notNull(),
  expertId: integer("expert_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isHelpful: boolean("is_helpful"),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id).notNull(),
  expertId: integer("expert_id").references(() => users.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  gratitudeAmount: decimal("gratitude_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expertStats = pgTable("expert_stats", {
  id: serial("id").primaryKey(),
  expertId: integer("expert_id").references(() => users.id).notNull(),
  totalResponses: integer("total_responses").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0),
  helpfulResponses: integer("helpful_responses").default(0),
  todayResponses: integer("today_responses").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  resolved: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
  helpfulCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
  verified: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ExpertStats = typeof expertStats.$inferSelect;

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;

// Extended types for API responses
export type RequestWithUser = Request & {
  user: Pick<User, 'id' | 'name' | 'profession' | 'batchYear'>;
  responses?: ResponseWithExpert[];
  responseCount?: number;
};

export type ResponseWithExpert = Response & {
  expert: Pick<User, 'id' | 'name' | 'profession' | 'batchYear' | 'profileImage'>;
};

export type ExpertWithStats = User & {
  stats?: ExpertStats;
  availableSlots?: number;
};
