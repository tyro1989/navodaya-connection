# 📱 Navodaya Connect Mobile App

This is the React Native mobile application for Navodaya Connect, built with Expo and React Native Paper.

## 🚀 Features

- **Cross-Platform**: Works on both Android and iOS
- **Native Integration**: Camera, GPS, Push Notifications
- **Shared Backend**: Uses the same API as the web application
- **Modern UI**: Material Design 3 components
- **Offline Support**: Caching and offline-first approach
- **Real-time Notifications**: Push notifications for responses and updates

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- For iOS development: Xcode and iOS Simulator
- For Android development: Android Studio and Android Emulator

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Development Server

```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
```

### 3. Configure Backend Connection

Update `src/config/api.ts` with your backend URL:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' // Your local development server
  : 'https://your-production-domain.com'; // Your production server
```

## 📱 Building for Production

### Setup EAS (Expo Application Services)

1. **Login to Expo**:
   ```bash
   eas login
   ```

2. **Configure Project**:
   ```bash
   eas build:configure
   ```

3. **Update app.json** with your details:
   ```json
   {
     "expo": {
       "name": "Navodaya Connect",
       "slug": "navodaya-connect",
       "ios": {
         "bundleIdentifier": "com.yourcompany.navodayaconnect"
       },
       "android": {
         "package": "com.yourcompany.navodayaconnect"
       }
     }
   }
   ```

### Build APK/IPA

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

### Submit to App Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

### Push Notifications

1. **Get Push Token**: The app automatically registers for push notifications
2. **Backend Integration**: Send the push token to your backend
3. **Send Notifications**: Use Expo's push notification service

Example backend integration:
```javascript
// When user logs in, save their push token
app.post('/api/users/push-token', (req, res) => {
  const { pushToken } = req.body;
  // Save pushToken to user's record in database
});
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── contexts/           # React contexts (Auth, Notifications)
│   ├── config/             # Configuration files
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, icons, fonts
├── app.json               # Expo configuration
├── eas.json               # EAS build configuration
└── package.json           # Dependencies and scripts
```

## 📱 Platform-Specific Features

### Android
- **Adaptive Icons**: Configured in `app.json`
- **Permissions**: Camera, Location, Storage
- **Push Notifications**: FCM integration
- **Deep Links**: Custom URL schemes

### iOS
- **App Icons**: Multiple sizes configured
- **Permissions**: Usage descriptions in Info.plist
- **Push Notifications**: APNs integration
- **Universal Links**: Domain association

## 🔒 Security Features

- **Secure Storage**: User credentials stored in device keychain
- **API Security**: Same session-based auth as web app
- **Certificate Pinning**: SSL certificate validation
- **Biometric Auth**: (Optional) Fingerprint/Face ID login

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Performance Optimization

- **Image Optimization**: Automatic image compression
- **Bundle Splitting**: Code splitting for faster loading
- **Caching**: React Query for API response caching
- **Memory Management**: Optimized component lifecycle

## 🚀 Deployment Pipeline

### Development
1. Code changes
2. Local testing
3. Expo development build

### Staging
1. EAS preview build
2. Internal testing
3. TestFlight/Internal testing distribution

### Production
1. EAS production build
2. App store submission
3. Release management

## 📱 App Store Guidelines

### Google Play Store
- **Target API Level**: Android 13 (API 33)
- **App Bundle**: Use `.aab` format
- **Privacy Policy**: Required for apps collecting data
- **Content Rating**: Complete questionnaire

### Apple App Store
- **iOS Version**: Minimum iOS 13.0
- **App Store Guidelines**: Follow Human Interface Guidelines
- **Privacy Labels**: Declare data collection practices
- **App Review**: 24-48 hour review process

## 🆘 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start -c  # Clear cache
   ```

2. **Android build failures**:
   - Check Android SDK installation
   - Verify Gradle configuration

3. **iOS build failures**:
   - Update Xcode to latest version
   - Clear iOS simulator

4. **API connection issues**:
   - Verify API_BASE_URL configuration
   - Check network connectivity
   - Ensure backend is running

### Debug Commands

```bash
# Debug Android
npx expo run:android --variant debug

# Debug iOS
npx expo run:ios --configuration Debug

# Check dependencies
expo doctor

# Clear all caches
npx expo start -c
```

## 📈 Analytics and Monitoring

- **Expo Analytics**: Built-in app usage analytics
- **Crash Reporting**: Automatic crash detection
- **Performance Monitoring**: App performance metrics
- **User Feedback**: In-app feedback collection

## 🔄 Updates

### Over-the-Air (OTA) Updates
```bash
# Publish update
eas update --branch preview

# Publish to production
eas update --branch production
```

### App Store Updates
- Increment version number in `app.json`
- Build new version with EAS
- Submit to app stores

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test on both platforms
5. Submit pull request

## 📞 Support

For technical support:
- Create an issue in the GitHub repository
- Contact the development team
- Check Expo documentation

---

**🎉 Your Navodaya Connect mobile app is ready to build the community on mobile devices!**