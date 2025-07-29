import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import passport from 'passport';
import { configureAuth } from '../auth';
import { storage } from '../storage';

// Mock the storage module
vi.mock('../storage', () => ({
  storage: {
    verifyUserPassword: vi.fn(),
    getUserById: vi.fn()
  }
}));

describe('Authentication Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing strategies
    passport._strategies = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Passport Configuration', () => {
    it('should configure local strategy', () => {
      configureAuth();
      
      expect(passport._strategies.local).toBeDefined();
    });

    it('should configure serialization functions', () => {
      configureAuth();
      
      expect(passport._serializers).toBeDefined();
      expect(passport._deserializers).toBeDefined();
    });
  });

  describe('Local Strategy Authentication', () => {
    it('should authenticate valid user credentials', async () => {
      const mockUser = {
        id: 1,
        phone: '+919876543210',
        name: 'Test User',
        password: 'hashedPassword'
      };

      vi.mocked(storage.verifyUserPassword).mockResolvedValue(mockUser as any);
      
      configureAuth();
      
      const localStrategy = passport._strategies.local;
      expect(localStrategy).toBeDefined();
      
      // Test the strategy verify function
      const done = vi.fn();
      await localStrategy._verify('+919876543210', 'testPassword', done);
      
      expect(storage.verifyUserPassword).toHaveBeenCalledWith('+919876543210', 'testPassword');
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should reject invalid user credentials', async () => {
      vi.mocked(storage.verifyUserPassword).mockResolvedValue(null);
      
      configureAuth();
      
      const localStrategy = passport._strategies.local;
      const done = vi.fn();
      await localStrategy._verify('+919876543210', 'wrongPassword', done);
      
      expect(storage.verifyUserPassword).toHaveBeenCalledWith('+919876543210', 'wrongPassword');
      expect(done).toHaveBeenCalledWith(null, false, { message: 'Invalid phone or password' });
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(storage.verifyUserPassword).mockRejectedValue(error);
      
      configureAuth();
      
      const localStrategy = passport._strategies.local;
      const done = vi.fn();
      await localStrategy._verify('+919876543210', 'testPassword', done);
      
      expect(done).toHaveBeenCalledWith(error);
    });
  });

  describe('User Serialization', () => {
    it('should serialize user correctly', () => {
      configureAuth();
      
      const user = { id: 123, phone: '+919876543210', name: 'Test User' };
      const done = vi.fn();
      
      passport._serializers[0](user, done);
      
      expect(done).toHaveBeenCalledWith(null, 123);
    });

    it('should deserialize user correctly', async () => {
      const mockUser = {
        id: 123,
        phone: '+919876543210',
        name: 'Test User'
      };

      vi.mocked(storage.getUserById).mockResolvedValue(mockUser as any);
      
      configureAuth();
      
      const done = vi.fn();
      await passport._deserializers[0](123, done);
      
      expect(storage.getUserById).toHaveBeenCalledWith(123);
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle deserialization errors', async () => {
      const error = new Error('User not found');
      vi.mocked(storage.getUserById).mockRejectedValue(error);
      
      configureAuth();
      
      const done = vi.fn();
      await passport._deserializers[0](123, done);
      
      expect(done).toHaveBeenCalledWith(error);
    });
  });

  describe('Strategy Options', () => {
    it('should use phone field as username', () => {
      configureAuth();
      
      const localStrategy = passport._strategies.local;
      expect(localStrategy._usernameField).toBe('phone');
    });
  });
});