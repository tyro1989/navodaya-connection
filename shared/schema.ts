import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  gender: text("gender"), // 'male', 'female', 'other', 'prefer-not-to-say'
  batchYear: integer("batch_year").notNull(),
  profession: text("profession").notNull(),
  professionOther: text("profession_other"),
  state: text("state").notNull(),
  district: text("district").notNull(),
  currentState: text("current_state"),
  currentDistrict: text("current_district"),
  pinCode: text("pin_code"),
  gpsLocation: text("gps_location"),
  gpsEnabled: boolean("gps_enabled").default(false),
  helpAreas: text("help_areas").array(),
  helpAreasOther: text("help_areas_other"),
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
  expertiseRequired: text("expertise_required"), // Made optional
  urgency: text("urgency").notNull(), // 'critical', 'high', 'medium'
  helpType: text("help_type").notNull(), // 'general' or 'specific'
  // Location where help is needed (optional)
  helpLocationState: text("help_location_state"),
  helpLocationDistrict: text("help_location_district"),
  helpLocationArea: text("help_location_area"),
  helpLocationGps: text("help_location_gps"),
  helpLocationNotApplicable: boolean("help_location_not_applicable").default(false),
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

export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").default(false),
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

export const insertRequestSchema = z.object({
  userId: z.number().optional(), // Will be added by server
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  expertiseRequired: z.string().nullable().optional(),
  urgency: z.enum(["critical", "high", "medium"]),
  helpType: z.enum(["general", "specific"]),
  helpLocationState: z.string().nullable().optional(),
  helpLocationDistrict: z.string().nullable().optional(),
  helpLocationArea: z.string().nullable().optional(),
  helpLocationGps: z.string().nullable().optional(),
  helpLocationNotApplicable: z.boolean().default(false),
  targetExpertId: z.number().nullable().optional(),
  attachments: z.array(z.string()).default([]),
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
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

export const insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;

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

export type PrivateMessageWithUser = PrivateMessage & {
  sender: Pick<User, 'id' | 'name' | 'profession' | 'batchYear' | 'profileImage'>;
  receiver: Pick<User, 'id' | 'name' | 'profession' | 'batchYear' | 'profileImage'>;
};

export type ExpertWithStats = User & {
  stats?: ExpertStats;
  availableSlots?: number;
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(requests),
  responses: many(responses),
  reviews: many(reviews),
  stats: many(expertStats),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  user: one(users, {
    fields: [requests.userId],
    references: [users.id],
  }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  request: one(requests, {
    fields: [responses.requestId],
    references: [requests.id],
  }),
  expert: one(users, {
    fields: [responses.expertId],
    references: [users.id],
  }),
}));

export const privateMessagesRelations = relations(privateMessages, ({ one }) => ({
  request: one(requests, {
    fields: [privateMessages.requestId],
    references: [requests.id],
  }),
  sender: one(users, {
    fields: [privateMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [privateMessages.receiverId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  expert: one(users, {
    fields: [reviews.expertId],
    references: [users.id],
  }),
  request: one(requests, {
    fields: [reviews.requestId],
    references: [requests.id],
  }),
}));

export const expertStatsRelations = relations(expertStats, ({ one }) => ({
  expert: one(users, {
    fields: [expertStats.expertId],
    references: [users.id],
  }),
}));
