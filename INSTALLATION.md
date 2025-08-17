# Navodaya Connect - Installation Guide

A comprehensive community platform for Navodaya alumni to connect, share knowledge, and help each other. This guide will help you set up and review both the web application and mobile app.

## 🏗️ Project Overview

**Navodaya Connect** is a full-stack TypeScript application featuring:
- **Web App**: React SPA with modern UI/UX
- **Mobile App**: React Native/Expo cross-platform app
- **Backend**: Express.js API with PostgreSQL database
- **Authentication**: Multi-modal (phone/password, WhatsApp/SMS OTP, social login)
- **Features**: Expert-helpseeker matching, messaging, file uploads, location-based help

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud)
- **Git**

### For Mobile Development (Optional)
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **Expo Go app** (for device testing)

## 🚀 Quick Start - Web Application

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/tyro1989/navodaya-connection.git
cd navodaya-connection

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/navodaya_connect"

# Session Security (Required)
SESSION_SECRET="your-super-secret-session-key-here"

# Environment
NODE_ENV="development"

# SMS/WhatsApp Configuration (Choose one provider)
SMS_PROVIDER="mock"  # Options: 'twilio', 'msg91', 'mock'

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_FROM_NUMBER="your-twilio-phone-number"

# MSG91 Configuration (if using MSG91 - popular in India)
MSG91_API_KEY="your-msg91-api-key"
MSG91_SENDER_ID="your-sender-id"
MSG91_TEMPLATE_ID="your-sms-template-id"
MSG91_WHATSAPP_TEMPLATE_ID="your-whatsapp-template-id"

# Social Authentication (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
```

### 3. Database Setup

```bash
# Push database schema (creates tables)
npm run db:push

# The application will create the database schema automatically
# Make sure your PostgreSQL database exists and is accessible
```

### 4. Start Development Server

```bash
# Start both frontend and backend (serves on port 5000)
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 Mobile App Setup

### 1. Navigate to Mobile Directory

```bash
cd mobile/
```

### 2. Install Mobile Dependencies

```bash
npm install
```

### 3. Configure Mobile Environment

Update `mobile/src/config/api.ts` with your backend URL:

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000'  // Development
  : 'https://your-production-domain.com';  // Production
```

### 4. Start Mobile Development

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web browser
```

### 5. Test on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code from the Expo development server
3. The app will load on your device

## 🗄️ Database Configuration Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database
createdb navodaya_connect

# Use in .env
DATABASE_URL="postgresql://localhost:5432/navodaya_connect"
```

### Option 2: Cloud Database (Recommended)
- **Neon** (serverless PostgreSQL) - Free tier available
- **Supabase** - PostgreSQL with additional features
- **Railway** - Simple deployment with PostgreSQL
- **Heroku Postgres** - Add-on for Heroku deployments

## 🔧 Available Scripts

### Web Application
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run check       # TypeScript type checking
npm test            # Run tests
npm run db:push     # Push database schema
```

### Mobile Application
```bash
cd mobile/
npm start                # Start Expo development
npm run android         # Run on Android
npm run ios            # Run on iOS
npm run build:android  # Build Android APK
```

## 🌟 Key Features to Review

### Authentication System
- **Phone/Password login**
- **WhatsApp/SMS OTP verification**
- **Social login** (Google, Facebook, Apple)
- **Country code support** with +91 (India) default

### Core Functionality
1. **User Profiles**: Alumni information, JNV location, batch year
2. **Help Requests**: Post questions, attach files, set urgency
3. **Expert Responses**: Answer questions, get rated, earn recognition
4. **Private Messaging**: Direct communication between users
5. **Location Services**: GPS-based help matching
6. **File Uploads**: Profile images, request attachments
7. **Community Ranking**: Top helpers with comprehensive scoring

### Mobile Features
- **Native authentication** with biometric support
- **Push notifications** for new requests/responses
- **Camera integration** for profile photos and attachments
- **Location services** for nearby help requests
- **Offline support** with data synchronization

## 🧪 Testing the Application

### Web Application Testing
1. **Register** with phone number (use +91 prefix for India)
2. **Verify** with OTP (mock provider works in development)
3. **Complete profile** with JNV details
4. **Post a help request** with attachments
5. **Respond to requests** as an expert
6. **Test messaging** system
7. **Upload profile image**

### Mobile App Testing
1. **Install Expo Go** on your device
2. **Scan QR code** from development server
3. **Test authentication** flow
4. **Camera permissions** for profile photos
5. **Location permissions** for nearby requests
6. **Push notifications** (requires physical device)

## 🚀 Production Deployment

### Web Application
```bash
# Build application
npm run build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL="your-production-db-url"

# Start production server
npm start
```

### Mobile Application
```bash
cd mobile/

# Build for Android
npm run build:android

# Build for iOS (requires Apple Developer account)
npm run build:ios

# Submit to stores
npm run submit:android
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Check database permissions

2. **SMS/WhatsApp Not Working**
   - Set SMS_PROVIDER="mock" for development
   - Verify credentials for production providers

3. **Mobile App Not Loading**
   - Check API_BASE_URL in mobile config
   - Ensure backend is running on correct port
   - Verify network connectivity

4. **File Upload Issues**
   - Check uploads/ directory permissions
   - Verify multer configuration
   - Ensure sufficient disk space

### Environment-Specific Notes

**Development:**
- Uses mock SMS provider by default
- File uploads stored locally in uploads/
- Database can be local PostgreSQL

**Production:**
- Requires real SMS provider (Twilio/MSG91)
- Consider cloud file storage
- Use cloud database for scalability

## 📚 Architecture Notes

### Backend Structure
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **Session-based** authentication with PostgreSQL store

### Frontend Structure
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for state management
- **Radix UI** components with Tailwind CSS

### Mobile Structure
- **React Native** with Expo
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Expo modules** for native features

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code documentation in CLAUDE.md
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

**Happy coding! 🚀**

This installation guide covers both web and mobile development setup for the Navodaya Connect platform. The application is designed to help Navodaya alumni connect, share knowledge, and support each other through a modern, feature-rich platform.