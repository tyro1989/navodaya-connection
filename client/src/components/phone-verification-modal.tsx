import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

// Common country codes
const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "US/Canada", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
];

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export default function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified 
}: PhoneVerificationModalProps) {
  const { updateUser } = useAuth();
  const [step, setStep] = useState<'add_phone' | 'verify_otp'>('add_phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullPhoneForVerification, setFullPhoneForVerification] = useState('');

  const addPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return await apiRequest("POST", "/api/auth/add-phone", { phone });
    },
    onSuccess: (response) => {
      setFullPhoneForVerification(response.phone);
      setStep('verify_otp');
    },
    onError: (error: Error) => {
      console.error("Add phone failed:", error.message);
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      return await apiRequest("POST", "/api/auth/verify-phone", data);
    },
    onSuccess: (response) => {
      // Update the user context with verified phone
      updateUser(response.user);
      onVerified?.();
      onClose();
      // Reset form
      setStep('add_phone');
      setPhoneNumber('');
      setOtp('');
    },
    onError: (error: Error) => {
      console.error("Phone verification failed:", error.message);
    },
  });

  const handleAddPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    
    const fullPhone = countryCode + phoneNumber;
    addPhoneMutation.mutate(fullPhone);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) return;
    
    verifyPhoneMutation.mutate({
      phone: fullPhoneForVerification,
      otp: otp
    });
  };

  const handleClose = () => {
    setStep('add_phone');
    setPhoneNumber('');
    setOtp('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Verify Your Phone Number
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-gray-600">
            {step === 'add_phone' 
              ? "Add your phone number to get verified and access all features"
              : "Enter the verification code sent to your phone"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Why verify?</strong> Get the verified badge, enable SMS notifications, and help build trust in our community.
            </AlertDescription>
          </Alert>

          {step === 'add_phone' ? (
            <form onSubmit={handleAddPhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                    required
                  />
                </div>
              </div>

              {addPhoneMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {addPhoneMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  disabled={addPhoneMutation.isPending || !phoneNumber.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {addPhoneMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send OTP
                    </div>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-wider"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 text-center">
                  Code sent to {fullPhoneForVerification}
                </p>
              </div>

              {verifyPhoneMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verifyPhoneMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('add_phone')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={verifyPhoneMutation.isPending || otp.length !== 6}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {verifyPhoneMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Verify
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}