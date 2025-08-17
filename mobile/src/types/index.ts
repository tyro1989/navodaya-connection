// Shared types that match your web app's schema
// These are imported from your shared schema to maintain consistency

export interface User {
  id: number;
  email?: string;
  name: string;
  phone?: string;
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  authProvider: string;
  password?: string;
  emailVerified?: boolean;
  gender?: string;
  batchYear: number;
  profession?: string;
  professionOther?: string;
  state: string;
  district: string;
  pinCode?: string;
  gpsLocation?: string;
  gpsEnabled?: boolean;
  helpAreas?: string[];
  helpAreasOther?: string;
  expertiseAreas?: string[];
  isExpert?: boolean;
  dailyRequestLimit?: number;
  phoneVisible?: boolean;
  upiId?: string;
  bio?: string;
  profileImage?: string;
  isActive?: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface Request {
  id: number;
  userId: number;
  title: string;
  description: string;
  expertiseRequired?: string;
  urgency: string;
  helpType: string;
  helpLocationState?: string;
  helpLocationDistrict?: string;
  helpLocationArea?: string;
  helpLocationGps?: string;
  helpLocationNotApplicable?: boolean;
  targetExpertId?: number;
  status?: string;
  attachments?: string[];
  resolved?: boolean;
  bestResponseId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestWithUser extends Request {
  user: User;
  responseCount?: number;
  hasUserResponded?: boolean;
}

export interface Response {
  id: number;
  requestId: number;
  expertId: number;
  content: string;
  attachments?: string[];
  isHelpful?: boolean;
  helpfulCount?: number;
  createdAt?: string;
}

export interface ResponseWithUser extends Response {
  expert: User;
  rating?: number;
  ratingComment?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  actionUserId?: number;
  isRead?: boolean;
  createdAt?: string;
}

export interface NotificationWithUser extends Notification {
  actionUser?: User;
}

export interface ExpertWithStats extends User {
  totalResponses?: number;
  averageRating?: number;
  totalReviews?: number;
  helpfulResponses?: number;
  availableSlots?: number;
}

export interface DashboardStats {
  totalRequests: number;
  activeExperts: number;
  averageResponseTime: string;
  communityRating: number;
}

export interface PersonalStats {
  requestsPosted: number;
  requestsResponded: number;
  requestsResolved: number;
  reviewsGiven: number;
  reviewsReceived: number;
}

// Mobile-specific types
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface CameraResult {
  uri: string;
  type: 'image';
  name: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  requestResponses: boolean;
  requestUpdates: boolean;
  expertRequests: boolean;
  reviews: boolean;
}