import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Home from '../pages/home';

// Mock the auth hook
const mockUser = {
  id: 1,
  name: 'Test User',
  phone: '1234567890',
  isExpert: false,
  isActive: true,
  batchYear: 2010
};

vi.mock('../lib/auth', () => ({
  useAuth: () => ({ user: mockUser })
}));

// Mock the components
vi.mock('../components/navigation', () => ({
  default: () => <div data-testid="navigation">Navigation</div>
}));

vi.mock('../components/request-form', () => ({
  default: () => <div data-testid="request-form">Request Form</div>
}));

vi.mock('../components/expert-card', () => ({
  default: ({ expert, onMessageClick }: any) => (
    <div data-testid={`expert-card-${expert.id}`} onClick={onMessageClick}>
      {expert.name}
    </div>
  )
}));

vi.mock('../components/request-card', () => ({
  default: ({ request, onViewClick }: any) => (
    <div data-testid={`request-card-${request.id}`} onClick={() => onViewClick(request)}>
      {request.title}
    </div>
  )
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Home Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderHome = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Router>
          <Home />
        </Router>
      </QueryClientProvider>
    );
  };

  it('should render without crashing when API returns proper data structure', async () => {
    // Mock successful API responses with correct structure
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/experts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            experts: [
              {
                id: 1,
                name: 'Dr. Test Expert',
                isExpert: true,
                profession: 'Doctor',
                batchYear: 2005,
                expertiseAreas: ['Medicine'],
                availableSlots: 2,
                stats: { totalResponses: 50, averageRating: '4.8' }
              }
            ]
          })
        });
      }
      if (url.includes('/api/requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            requests: [
              {
                id: 1,
                title: 'Test Request',
                description: 'Test description',
                urgency: 'medium',
                status: 'open',
                user: { id: 1, name: 'Test User' }
              }
            ]
          })
        });
      }
      if (url.includes('/api/stats/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stats: {
              totalRequests: 100,
              activeExperts: 25,
              averageResponseTime: '12 mins',
              communityRating: 4.7
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    renderHome();

    // Wait for the component to load and verify it renders properly
    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('request-form')).toBeInTheDocument();
      expect(screen.getByText('Need Help? We\'re Here for You')).toBeInTheDocument();
    });

    // Verify stats are displayed
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total requests
      expect(screen.getByText('25')).toBeInTheDocument(); // Active experts
      expect(screen.getByText('12 mins')).toBeInTheDocument(); // Response time
      expect(screen.getByText('4.7')).toBeInTheDocument(); // Community rating
    });
  });

  it('should handle empty API responses gracefully', async () => {
    // Mock API responses with empty but properly structured data
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/experts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ experts: [] })
        });
      }
      if (url.includes('/api/requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ requests: [] })
        });
      }
      if (url.includes('/api/stats/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stats: {
              totalRequests: 0,
              activeExperts: 0,
              averageResponseTime: '0 mins',
              communityRating: 0
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('request-form')).toBeInTheDocument();
    });

    // Should handle empty data without crashing
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for empty stats
    });
  });

  it('should handle malformed API responses gracefully', async () => {
    // Mock API responses with unexpected structure
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/experts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) // Missing experts array
        });
      }
      if (url.includes('/api/requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) // Missing requests array
        });
      }
      if (url.includes('/api/stats/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) // Missing stats object
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    renderHome();

    // Should render without crashing even with malformed data
    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('request-form')).toBeInTheDocument();
    });

    // Should show default values when data is malformed
    await waitFor(() => {
      expect(screen.getByText('0 mins')).toBeInTheDocument(); // Default response time
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock network failures
    (global.fetch as any).mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    });

    renderHome();

    // Should still render the basic structure
    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('request-form')).toBeInTheDocument();
    });
  });

  it('should filter available experts correctly', async () => {
    // Mock experts with different availability
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/experts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            experts: [
              {
                id: 1,
                name: 'Available Expert',
                availableSlots: 2,
                stats: { totalResponses: 50 }
              },
              {
                id: 2,
                name: 'Busy Expert',
                availableSlots: 0,
                stats: { totalResponses: 100 }
              }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ requests: [], stats: {} })
      });
    });

    renderHome();

    // Should only show available expert
    await waitFor(() => {
      expect(screen.getByTestId('expert-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('expert-card-2')).not.toBeInTheDocument();
    });
  });
}); 