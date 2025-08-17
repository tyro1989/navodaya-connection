# 🔐 OAuth Setup Guide

This guide walks you through setting up Google and Facebook OAuth for your Navodaya Connect application.

## 🌟 Overview

The OAuth integration allows users to:
- Sign up with Google or Facebook accounts
- Complete their profile with Navodaya-specific information
- Verify their phone number (required for full access)
- Get verified badges for phone verification

## 📋 Quick Setup Checklist

- [ ] Set up Google OAuth credentials
- [ ] Set up Facebook OAuth credentials  
- [ ] Update .env file with credentials
- [ ] Test OAuth flows
- [ ] Verify phone verification works for OAuth users

## 🔧 Google OAuth Setup

### 1. Go to Google Cloud Console
Visit: https://console.developers.google.com/

### 2. Create a New Project (or select existing)
- Click "New Project" 
- Name: "Navodaya Connect" (or your preferred name)
- Click "Create"

### 3. Enable Google+ API
- Go to "APIs & Services" > "Library"
- Search for "Google+ API" 
- Click "Enable"

### 4. Create OAuth Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Application type: "Web application"
- Name: "Navodaya Connect Web Client"

### 5. Configure OAuth Consent Screen
- Go to "OAuth consent screen"
- User Type: "External"
- Fill required fields:
  - App name: "Navodaya Connect"
  - User support email: singh.ritesh79@gmail.com
  - Developer contact: singh.ritesh79@gmail.com

### 6. Set Authorized URLs
**Authorized JavaScript origins:**
```
http://localhost:5000
https://your-production-domain.com
```

**Authorized redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
https://your-production-domain.com/api/auth/google/callback
```

### 7. Copy Credentials
- Copy **Client ID** and **Client Secret**
- Update your `.env` file:
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## 📘 Facebook OAuth Setup

### 1. Go to Facebook Developers
Visit: https://developers.facebook.com/

### 2. Create a New App
- Click "Create App"
- Use case: "Consumer" 
- App name: "Navodaya Connect"
- Contact email: singh.ritesh79@gmail.com

### 3. Add Facebook Login Product
- In your app dashboard, click "Add Product"
- Find "Facebook Login" and click "Set Up"

### 4. Configure Facebook Login Settings
Go to Facebook Login > Settings:

**Valid OAuth Redirect URIs:**
```
http://localhost:5000/api/auth/facebook/callback
https://your-production-domain.com/api/auth/facebook/callback
```

### 5. Copy App Credentials
- Go to Settings > Basic
- Copy **App ID** and **App Secret**
- Update your `.env` file:
```bash
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

## 🔄 Testing the Setup

### 1. Restart Your Server
```bash
npm run dev
```

### 2. Test OAuth Endpoints
```bash
# Test Google OAuth (should redirect to Google)
curl -I http://localhost:5000/api/auth/google

# Test Facebook OAuth (should redirect to Facebook)  
curl -I http://localhost:5000/api/auth/facebook
```

### 3. Test Complete Flow
1. Go to http://localhost:5000/auth
2. Click "Google" or "Facebook" button
3. Complete OAuth flow
4. Should redirect to profile completion
5. Complete profile, then verify phone number

## 🚀 User Flow After OAuth

### For New OAuth Users:
1. **OAuth Authentication** → Redirected from Google/Facebook
2. **Profile Completion** → Fill Navodaya-specific fields (batch, state, district)
3. **Phone Verification** → Add and verify phone number
4. **Full Access** → Can use all app features

### For Existing Users:
1. **OAuth Link** → Links OAuth account to existing account
2. **Full Access** → Immediate access (already verified)

## 🎯 Environment Variables Summary

Your `.env` file should have:
```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
FACEBOOK_CLIENT_ID=your_actual_facebook_app_id  
FACEBOOK_CLIENT_SECRET=your_actual_facebook_app_secret
```

## 🔧 Troubleshooting

### "Unknown authentication strategy" error
- ✅ **Fixed**: Environment variables were missing
- ✅ **Solution**: OAuth credentials added to .env file

### OAuth redirect errors
- Check redirect URIs in OAuth app settings
- Ensure URLs match exactly (with/without trailing slash)
- Verify http vs https in development vs production

### "This app isn't verified" (Google)
- Normal for development
- Click "Advanced" → "Go to Navodaya Connect (unsafe)"
- Submit for verification before production launch

### Facebook app in development mode
- Add test users in App Roles > Roles
- Only added users can test OAuth flow
- Switch to Live mode for public access

## 🎉 Next Steps

After OAuth is working:
1. Test complete user flows
2. Verify phone verification works for OAuth users
3. Test existing user linking
4. Set up production OAuth apps
5. Deploy with production credentials

---

**🚀 Your OAuth authentication system is now ready!**