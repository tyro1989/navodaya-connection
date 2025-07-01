import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:5000';

describe('End-to-End API Tests', () => {
  it('should return experts with correct structure', async () => {
    const response = await fetch(`${BASE_URL}/api/users/experts`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Verify the response has the correct structure
    expect(data).toHaveProperty('experts');
    expect(Array.isArray(data.experts)).toBe(true);
    
    // Verify each expert has required properties
    if (data.experts.length > 0) {
      const expert = data.experts[0];
      expect(expert).toHaveProperty('id');
      expect(expert).toHaveProperty('name');
      expect(expert).toHaveProperty('isExpert');
      expect(expert.isExpert).toBe(true);
      
      // Verify availableSlots is calculated correctly
      expect(expert).toHaveProperty('availableSlots');
      expect(typeof expert.availableSlots).toBe('number');
    }
  });

  it('should return dashboard stats with correct structure', async () => {
    const response = await fetch(`${BASE_URL}/api/stats/dashboard`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Verify the response has the correct structure
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalRequests');
    expect(data.stats).toHaveProperty('activeExperts');
    expect(data.stats).toHaveProperty('averageResponseTime');
    expect(data.stats).toHaveProperty('communityRating');
    
    // Verify data types
    expect(typeof data.stats.totalRequests).toBe('number');
    expect(typeof data.stats.activeExperts).toBe('number');
    expect(typeof data.stats.averageResponseTime).toBe('string');
    expect(typeof data.stats.communityRating).toBe('number');
  });

  it('should handle data extraction correctly (simulating the home component logic)', async () => {
    // Simulate the data extraction logic from the home component
    const [expertsResponse, statsResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/users/experts`),
      fetch(`${BASE_URL}/api/stats/dashboard`)
    ]);
    
    const expertsData = await expertsResponse.json();
    const statsData = await statsResponse.json();
    
    // Test the exact extraction logic used in home.tsx
    const experts = expertsData?.experts || [];
    const stats = statsData?.stats || {
      totalRequests: 0,
      activeExperts: 0,
      averageResponseTime: "0 mins",
      communityRating: 0,
    };
    
    // Verify that experts.filter works (this was the original error)
    expect(() => {
      const availableExperts = experts.filter((expert: any) => (expert.availableSlots || 0) > 0);
      expect(Array.isArray(availableExperts)).toBe(true);
    }).not.toThrow();
    
    // Verify stats are accessible
    expect(stats.totalRequests).toBeDefined();
    expect(stats.activeExperts).toBeDefined();
    expect(stats.averageResponseTime).toBeDefined();
    expect(stats.communityRating).toBeDefined();
  });

  it('should handle malformed responses gracefully', async () => {
    // Test with empty objects (simulating malformed API responses)
    const malformedExpertsData = {};
    const malformedStatsData = {};
    
    // Test the extraction logic with malformed data
    const experts = (malformedExpertsData as { experts?: any[] })?.experts || [];
    const stats = (malformedStatsData as { stats?: any })?.stats || {
      totalRequests: 0,
      activeExperts: 0,
      averageResponseTime: "0 mins",
      communityRating: 0,
    };
    
    // Should not throw errors
    expect(() => {
      const availableExperts = experts.filter((expert: any) => (expert.availableSlots || 0) > 0);
      expect(Array.isArray(availableExperts)).toBe(true);
      expect(availableExperts.length).toBe(0);
    }).not.toThrow();
    
    expect(stats.totalRequests).toBe(0);
    expect(stats.averageResponseTime).toBe("0 mins");
  });

  it('should filter available experts correctly', async () => {
    const response = await fetch(`${BASE_URL}/api/users/experts`);
    const data = await response.json();
    const experts = data?.experts || [];
    
    // Test the filtering logic
    const availableExperts = experts.filter((expert: any) => (expert.availableSlots || 0) > 0);
    const unavailableExperts = experts.filter((expert: any) => (expert.availableSlots || 0) === 0);
    
    expect(Array.isArray(availableExperts)).toBe(true);
    expect(Array.isArray(unavailableExperts)).toBe(true);
    expect(availableExperts.length + unavailableExperts.length).toBe(experts.length);
    
    // Verify each available expert actually has slots
    availableExperts.forEach((expert: any) => {
      expect(expert.availableSlots).toBeGreaterThan(0);
    });
    
    // Verify each unavailable expert has no slots
    unavailableExperts.forEach((expert: any) => {
      expect(expert.availableSlots || 0).toBe(0);
    });
  });

  it('should return main page without runtime errors', async () => {
    const response = await fetch(`${BASE_URL}/`);
    expect(response.ok).toBe(true);
    
    const html = await response.text();
    
    // Should not contain runtime error messages
    expect(html).not.toMatch(/experts\.filter is not a function/);
    expect(html).not.toMatch(/CardHeader is not defined/);
    expect(html).not.toMatch(/useToast is not defined/);
    
    // Should contain the expected page structure
    expect(html).toMatch(/Need Help\? We're Here for You/);
    expect(html).toMatch(/Community Impact/);
  });
}); 