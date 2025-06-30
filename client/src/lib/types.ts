export interface DashboardStats {
  totalRequests: number;
  activeExperts: number;
  averageResponseTime: string;
  communityRating: number;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

export interface ExpertAvailability {
  expertId: number;
  availableSlots: number;
  totalSlots: number;
  isOnline: boolean;
}

export interface RequestFilters {
  expertise?: string;
  urgency?: 'urgent' | 'medium';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  location?: string;
}

export interface ExpertFilters {
  expertise?: string;
  location?: string;
  availability?: 'available' | 'busy' | 'offline';
  rating?: number;
}
