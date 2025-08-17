# 📱 Mobile App Deployment Guide - Navodaya Connect

This guide covers deploying your React Native mobile applications (Android & iOS) to production.

## 📋 Prerequisites

### Required Tools
- **Node.js 18+** 
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Expo Account**: Create at [expo.dev](https://expo.dev)

### For iOS Development
- **macOS** (required for iOS builds)
- **Xcode 14+**
- **Apple Developer Account** ($99/year)
- **iOS Simulator**

### For Android Development
- **Android Studio**
- **Android SDK**
- **Google Play Console Account** ($25 one-time fee)
- **Android Emulator**

## 🚀 Quick Start

### 1. Setup Mobile Project

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start
```

### 2. Test on Devices

```bash
# Test on Android emulator
npm run android

# Test on iOS simulator (macOS only)
npm run ios

# Test on physical device via Expo Go app
# Scan QR code from 'npm start'
```

## 🏗️ Production Build Setup

### 1. Configure EAS (Expo Application Services)

```bash
# Login to Expo
eas login

# Initialize EAS in mobile directory
cd mobile
eas build:configure
```

### 2. Update App Configuration

Edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "Navodaya Connect",
    "slug": "navodaya-connect",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.navodayaconnect.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.navodayaconnect.app",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 3. Configure API Endpoint

Update `mobile/src/config/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' // Development
  : 'https://your-production-domain.com'; // Production - use your deployed backend URL
```

## 📱 Platform-Specific Deployment

### Android Deployment

#### 1. Build APK for Testing

```bash
cd mobile
eas build --platform android --profile preview
```

#### 2. Build AAB for Google Play Store

```bash
cd mobile
eas build --platform android --profile production
```

#### 3. Submit to Google Play Store

```bash
# Manual submission:
# 1. Download the .aab file from EAS dashboard
# 2. Upload to Google Play Console
# 3. Fill in app details, screenshots, descriptions
# 4. Submit for review

# Automated submission (after configuring service account):
eas submit --platform android
```

### iOS Deployment

#### 1. Build for TestFlight

```bash
cd mobile
eas build --platform ios --profile preview
```

#### 2. Build for App Store

```bash
cd mobile
eas build --platform ios --profile production
```

#### 3. Submit to App Store

```bash
# Manual submission:
# 1. Download the .ipa file from EAS dashboard
# 2. Upload to App Store Connect via Transporter app
# 3. Fill in app metadata, screenshots, descriptions
# 4. Submit for review

# Automated submission (after configuring credentials):
eas submit --platform ios
```

## 🔧 Environment Configuration

### Production Environment Variables

Create `mobile/.env.production`:

```env
EXPO_PUBLIC_API_URL=https://your-production-domain.com
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

### Development Environment Variables

Create `mobile/.env.development`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

## 🔔 Push Notifications Setup

### 1. Configure Expo Push Notifications

The mobile app is already configured for push notifications. You need to:

1. **Get EAS Project ID** from your Expo dashboard
2. **Update app.json** with the project ID
3. **Configure backend** to send push notifications

### 2. Backend Integration

Add to your backend (already exists in your API):

```javascript
// server/routes.ts - Add push notification endpoint
app.post('/api/users/push-token', authenticateUser, async (req, res) => {
  const { pushToken } = req.body;
  
  try {
    // Save push token to user record
    await db.update(users).set({ 
      pushToken: pushToken 
    }).where(eq(users.id, req.user.id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save push token' });
  }
});

// Function to send push notification
async function sendPushNotification(pushToken, title, body, data = {}) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

## 📊 Store Optimization

### App Store Listing (iOS)

Required assets:
- **App Icon**: 1024x1024px
- **Screenshots**: Various iPhone/iPad sizes
- **App Description**: Compelling description
- **Keywords**: Relevant search terms
- **Privacy Policy URL**: Required
- **Support URL**: Contact information

### Google Play Listing (Android)

Required assets:
- **App Icon**: 512x512px
- **Screenshots**: Phone and tablet sizes
- **Feature Graphic**: 1024x500px
- **App Description**: Up to 4000 characters
- **Privacy Policy URL**: Required
- **Content Rating**: Complete questionnaire

### Screenshots and Assets

Create screenshots for both platforms showing:
1. **Authentication screen** with OTP login
2. **Home screen** with requests feed
3. **Create request** screen
4. **Request details** with responses
5. **Dashboard** with stats
6. **Profile** management

## 🔒 Security Configuration

### Code Signing (iOS)

EAS automatically handles code signing, but you can provide your own certificates:

```bash
# Add iOS credentials
eas credentials:configure --platform ios
```

### App Signing (Android)

EAS automatically generates signing keys, or you can provide your own:

```bash
# Add Android credentials
eas credentials:configure --platform android
```

### API Security

Ensure your mobile app uses the same security measures as your web app:
- **Session-based authentication**
- **HTTPS only** in production
- **Input validation**
- **Rate limiting**

## 🚀 CI/CD Pipeline

### Automated Builds with GitHub Actions

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile App Build

on:
  push:
    branches: [main]
    paths: ['mobile/**']
  pull_request:
    branches: [main]
    paths: ['mobile/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: mobile/package-lock.json
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd mobile
          npm ci
      
      - name: Build on EAS
        run: |
          cd mobile
          eas build --platform all --non-interactive
```

### Release Management

```bash
# Create preview build for testing
eas build --platform all --profile preview

# Create production build for stores
eas build --platform all --profile production

# Submit to stores
eas submit --platform all
```

## 📈 Analytics and Monitoring

### Expo Analytics

Built-in analytics include:
- **App opens** and user engagement
- **Crash reports** and error tracking
- **Performance metrics**
- **Update adoption** rates

### Custom Analytics

Add to your mobile app:

```typescript
// mobile/src/utils/analytics.ts
import * as Analytics from 'expo-analytics';

export const trackEvent = (eventName: string, properties?: any) => {
  if (__DEV__) {
    console.log('Analytics Event:', eventName, properties);
    return;
  }
  
  Analytics.track(eventName, properties);
};

// Usage in components
trackEvent('request_created', { category: 'academic' });
trackEvent('response_posted', { requestId: '123' });
```

## 🔄 Over-the-Air (OTA) Updates

### Publishing Updates

```bash
# Update preview branch
eas update --branch preview

# Update production branch
eas update --branch production

# Update with message
eas update --branch production --message "Bug fixes and improvements"
```

### Update Strategies

Configure in `app.json`:

```json
{
  "expo": {
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear EAS cache
   eas build:clear-cache
   
   # Check build logs
   eas build:list
   ```

2. **Expo CLI Issues**:
   ```bash
   # Update CLI
   npm install -g @expo/cli@latest
   npm install -g eas-cli@latest
   ```

3. **Metro Bundler Issues**:
   ```bash
   cd mobile
   npx expo start -c  # Clear cache
   ```

4. **iOS Simulator Issues**:
   ```bash
   # Reset simulator
   xcrun simctl erase all
   ```

### Debug Commands

```bash
# Run in development mode
cd mobile
npm run android # or npm run ios

# Check project status
eas project:info

# View build logs
eas build:view [build-id]

# Test OTA updates
eas update:view
```

## 📱 Store Submission Checklist

### Before Submission

- [ ] App tested on physical devices
- [ ] All features working correctly
- [ ] Push notifications configured
- [ ] API endpoints pointing to production
- [ ] App icons and screenshots ready
- [ ] Privacy policy and terms of service written
- [ ] Content rating completed
- [ ] App metadata filled out
- [ ] Test accounts provided (if required)

### iOS App Store

- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Build uploaded to TestFlight
- [ ] Internal testing completed
- [ ] App Store listing completed
- [ ] Submitted for review

### Google Play Store

- [ ] Google Play Console account active
- [ ] App created in console
- [ ] Internal testing track configured
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] Submitted for review

## 📞 Support and Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

### Community
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://reactnative.dev/community/overview)

### Store Guidelines
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

---

**🎉 Your Navodaya Connect mobile apps are ready for the app stores! This setup provides a production-ready mobile experience that complements your web application perfectly.**