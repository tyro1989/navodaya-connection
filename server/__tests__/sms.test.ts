import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockSMSService } from '../sms';

describe('MockSMSService Unit Tests', () => {
  let smsService: MockSMSService;

  beforeEach(() => {
    smsService = new MockSMSService();
    // Clear console spies
    vi.clearAllMocks();
  });

  describe('OTP Sending', () => {
    it('should send OTP via SMS successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await smsService.sendOTP('+919876543210', '123456');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MOCK SMS] OTP 123456 sent to +919876543210'
      );
      
      consoleSpy.mockRestore();
    });

    it('should send OTP via WhatsApp successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await smsService.sendWhatsAppOTP('+919876543210', '123456');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MOCK WHATSAPP] OTP 123456 sent to +919876543210'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid phone numbers gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await smsService.sendOTP('invalid-phone', '123456');
      
      expect(result).toBe(true); // Mock service always returns true
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MOCK SMS] OTP 123456 sent to invalid-phone'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle empty OTP gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await smsService.sendOTP('+919876543210', '');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MOCK SMS] OTP  sent to +919876543210'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Service Type Validation', () => {
    it('should be identified as mock service', () => {
      expect(smsService.constructor.name).toBe('MockSMSService');
    });

    it('should have WhatsApp OTP capability', () => {
      expect(typeof smsService.sendWhatsAppOTP).toBe('function');
    });

    it('should return consistent results', async () => {
      const result1 = await smsService.sendOTP('+919876543210', '123456');
      const result2 = await smsService.sendOTP('+919876543211', '654321');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('Concurrent OTP Sending', () => {
    it('should handle multiple concurrent OTP requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const promises = [
        smsService.sendOTP('+919876543210', '123456'),
        smsService.sendOTP('+919876543211', '234567'),
        smsService.sendWhatsAppOTP('+919876543212', '345678')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toEqual([true, true, true]);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });
  });
});