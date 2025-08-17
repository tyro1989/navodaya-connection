import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface LoginData {
  phone: string;
  password: string;
}

interface OTPData {
  phone: string;
  otp: string;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  batchYear: string;
  state: string;
  district: string;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { login, register, loginWithOTP, sendOTP } = useAuth();

  // Form states
  const [loginData, setLoginData] = useState<LoginData>({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '', phone: '', password: '', batchYear: '', state: '', district: ''
  });
  const [otpData, setOTPData] = useState<OTPData>({ phone: '', otp: '' });

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+91|91)?[6789]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleLogin = async () => {
    setErrors({});
    
    if (!loginData.phone || !loginData.password) {
      setErrors({ general: 'Please fill in all fields' });
      return;
    }

    if (!validatePhone(loginData.phone)) {
      setErrors({ phone: 'Please enter a valid phone number' });
      return;
    }

    setLoading(true);
    try {
      await login(loginData.phone, loginData.password);
      navigation.navigate('Home' as never);
    } catch (error: any) {
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrors({});
    
    const { name, phone, password, batchYear, state, district } = registerData;
    
    if (!name || !phone || !password || !batchYear || !state || !district) {
      setErrors({ general: 'Please fill in all required fields' });
      return;
    }

    if (!validatePhone(phone)) {
      setErrors({ phone: 'Please enter a valid phone number' });
      return;
    }

    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await register({
        ...registerData,
        batchYear: parseInt(batchYear),
        authProvider: 'local',
      });
      navigation.navigate('Home' as never);
    } catch (error: any) {
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setErrors({});
    
    if (!otpData.phone) {
      setErrors({ phone: 'Please enter your phone number' });
      return;
    }

    if (!validatePhone(otpData.phone)) {
      setErrors({ phone: 'Please enter a valid phone number' });
      return;
    }

    setLoading(true);
    try {
      await sendOTP(otpData.phone);
      Alert.alert('OTP Sent', 'Please check your WhatsApp/SMS for the verification code');
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setErrors({});
    
    if (!otpData.otp) {
      setErrors({ otp: 'Please enter the OTP' });
      return;
    }

    setLoading(true);
    try {
      await loginWithOTP(otpData.phone, otpData.otp);
      navigation.navigate('Home' as never);
    } catch (error: any) {
      setErrors({ general: error.message || 'OTP verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#f8fafc', '#e2e8f0', '#cbd5e1']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.title}>Navodaya Connect</Text>
          <Text style={styles.subtitle}>Connect • Share • Grow</Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={300}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Mode Selection */}
              <View style={styles.modeContainer}>
                <Chip
                  selected={mode === 'login'}
                  onPress={() => setMode('login')}
                  style={[styles.modeChip, mode === 'login' && styles.selectedChip]}
                  textStyle={mode === 'login' ? styles.selectedChipText : styles.chipText}
                >
                  Login
                </Chip>
                <Chip
                  selected={mode === 'otp'}
                  onPress={() => setMode('otp')}
                  style={[styles.modeChip, mode === 'otp' && styles.selectedChip]}
                  textStyle={mode === 'otp' ? styles.selectedChipText : styles.chipText}
                >
                  WhatsApp OTP
                </Chip>
                <Chip
                  selected={mode === 'register'}
                  onPress={() => setMode('register')}
                  style={[styles.modeChip, mode === 'register' && styles.selectedChip]}
                  textStyle={mode === 'register' ? styles.selectedChipText : styles.chipText}
                >
                  Register
                </Chip>
              </View>

              {/* Error Display */}
              {errors.general && (
                <HelperText type="error" style={styles.errorText}>
                  {errors.general}
                </HelperText>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <View style={styles.form}>
                  <TextInput
                    label="Phone Number"
                    value={loginData.phone}
                    onChangeText={(text) => setLoginData({ ...loginData, phone: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                  />
                  {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
                  
                  <TextInput
                    label="Password"
                    value={loginData.password}
                    onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                    error={!!errors.password}
                  />
                  {errors.password && <HelperText type="error">{errors.password}</HelperText>}
                  
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    Login
                  </Button>
                </View>
              )}

              {/* OTP Form */}
              {mode === 'otp' && (
                <View style={styles.form}>
                  <TextInput
                    label="Phone Number"
                    value={otpData.phone}
                    onChangeText={(text) => setOTPData({ ...otpData, phone: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                  />
                  {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
                  
                  <Button
                    mode="outlined"
                    onPress={handleSendOTP}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    Send OTP
                  </Button>
                  
                  <TextInput
                    label="Enter OTP"
                    value={otpData.otp}
                    onChangeText={(text) => setOTPData({ ...otpData, otp: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    error={!!errors.otp}
                    placeholder="Enter 6-digit code"
                  />
                  {errors.otp && <HelperText type="error">{errors.otp}</HelperText>}
                  
                  <Button
                    mode="contained"
                    onPress={handleVerifyOTP}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    disabled={!otpData.otp}
                  >
                    Verify & Login
                  </Button>
                </View>
              )}

              {/* Register Form */}
              {mode === 'register' && (
                <View style={styles.form}>
                  <TextInput
                    label="Full Name *"
                    value={registerData.name}
                    onChangeText={(text) => setRegisterData({ ...registerData, name: text })}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.name}
                  />
                  
                  <TextInput
                    label="Phone Number *"
                    value={registerData.phone}
                    onChangeText={(text) => setRegisterData({ ...registerData, phone: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                  />
                  {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
                  
                  <TextInput
                    label="Password *"
                    value={registerData.password}
                    onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                    error={!!errors.password}
                  />
                  {errors.password && <HelperText type="error">{errors.password}</HelperText>}
                  
                  <TextInput
                    label="Batch Year *"
                    value={registerData.batchYear}
                    onChangeText={(text) => setRegisterData({ ...registerData, batchYear: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    error={!!errors.batchYear}
                    placeholder="e.g., 2020"
                  />
                  
                  <TextInput
                    label="State *"
                    value={registerData.state}
                    onChangeText={(text) => setRegisterData({ ...registerData, state: text })}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.state}
                  />
                  
                  <TextInput
                    label="District *"
                    value={registerData.district}
                    onChangeText={(text) => setRegisterData({ ...registerData, district: text })}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.district}
                  />
                  
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    Create Account
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </Animatable.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 24,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  modeChip: {
    backgroundColor: '#f1f5f9',
  },
  selectedChip: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    color: '#64748b',
  },
  selectedChipText: {
    color: '#ffffff',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});