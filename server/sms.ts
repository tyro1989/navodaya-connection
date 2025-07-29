import axios from 'axios';

export interface SMSService {
  sendOTP(phone: string, otp: string): Promise<boolean>;
  sendWhatsAppOTP?(phone: string, otp: string): Promise<boolean>;
}

// Twilio SMS Service Implementation
export class TwilioSMSService implements SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        console.error('Twilio credentials not configured');
        return false;
      }

      const message = `Your OTP for Navodaya Connection is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          To: phone,
          From: this.fromNumber,
          Body: message
        },
        {
          auth: {
            username: this.accountSid,
            password: this.authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log(`SMS sent successfully to ${phone}:`, response.data.sid);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}

// MSG91 SMS Service Implementation (Popular in India)
export class MSG91SMSService implements SMSService {
  private apiKey: string;
  private senderId: string;
  private templateId: string;
  private whatsappTemplateId: string;

  constructor() {
    this.apiKey = process.env.MSG91_API_KEY || '';
    this.senderId = process.env.MSG91_SENDER_ID || '';
    this.templateId = process.env.MSG91_TEMPLATE_ID || '';
    this.whatsappTemplateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID || '';
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      if (!this.apiKey || !this.senderId) {
        console.error('MSG91 credentials not configured');
        return false;
      }

      const url = 'https://api.msg91.com/api/v5/flow/';
      const payload = {
        flow_id: this.templateId,
        sender: this.senderId,
        mobiles: phone.replace('+91', '91'), // MSG91 expects format: 919876543210
        VAR1: otp
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authkey': this.apiKey
        }
      });

      if (response.data.type === 'success') {
        console.log(`SMS sent successfully to ${phone}`);
        return true;
      } else {
        console.error('MSG91 API error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Failed to send SMS via MSG91:', error);
      return false;
    }
  }

  async sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
    try {
      if (!this.apiKey || !this.whatsappTemplateId) {
        console.error('MSG91 WhatsApp credentials not configured');
        return false;
      }

      const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk';
      const payload = {
        to: phone.replace('+91', '91'), // MSG91 expects format: 919876543210
        type: 'template',
        template: {
          name: this.whatsappTemplateId,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp
                }
              ]
            }
          ]
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authkey': this.apiKey
        }
      });

      if (response.data.type === 'success') {
        console.log(`WhatsApp OTP sent successfully to ${phone}`);
        return true;
      } else {
        console.error('MSG91 WhatsApp API error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Failed to send WhatsApp OTP via MSG91:', error);
      return false;
    }
  }
}

// Mock SMS Service for development/testing
export class MockSMSService implements SMSService {
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    console.log(`[MOCK SMS] OTP ${otp} sent to ${phone}`);
    return true;
  }

  async sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
    console.log(`[MOCK WHATSAPP] OTP ${otp} sent to ${phone}`);
    return true;
  }
}

// Factory function to create the appropriate SMS service
export function createSMSService(): SMSService {
  const smsProvider = process.env.SMS_PROVIDER?.toLowerCase() || 'mock';
  
  switch (smsProvider) {
    case 'twilio':
      return new TwilioSMSService();
    case 'msg91':
      return new MSG91SMSService();
    case 'mock':
    default:
      return new MockSMSService();
  }
}

// Singleton instance
export const smsService = createSMSService(); 