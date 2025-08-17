# 🔐 Social Authentication Setup Guide

This guide covers setting up Google and Facebook OAuth authentication for Navodaya Connect.

## 📋 Overview

The application now supports:
- **Google OAuth** - Sign in with Google accounts
- **Facebook OAuth** - Sign in with Facebook accounts
- **Phone Verification** - Required for all users (including OAuth users)
- **Profile Completion** - Required fields for Navodaya alumni
- **Verified Badges** - Visual indicator for phone-verified users

## 🎯 User Flow

### New OAuth User Journey
1. **Click Google/Facebook** button on auth page
2. **OAuth Authorization** with Google/Facebook
3. **Phone Verification** - Add and verify phone number
4. **Profile Completion** - Add batch year, state, district
5. **Access Application** - Full access with verified badge

### Existing User Linking
- Users can link Google/Facebook to existing accounts
- Phone verification status is preserved
- Profile data is merged appropriately

## 🔧 Backend Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### Database Updates

The following field has been added to the users table:
```sql
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
```

This is automatically handled by the migration script in `scripts/migrate.ts`.

## 🔑 OAuth App Setup

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"

4. **Configure Redirect URIs**
   ```
   Development:
   http://localhost:5000/api/auth/google/callback
   
   Production:
   https://your-domain.com/api/auth/google/callback
   ```

5. **Copy Credentials**
   - Copy Client ID and Client Secret to your `.env` file

### Facebook OAuth Setup

1. **Go to Facebook Developers**
   - Visit [Facebook for Developers](https://developers.facebook.com/)
   - Create a new app or select existing one

2. **Add Facebook Login Product**
   - In your app dashboard, click "Add Product"
   - Choose "Facebook Login" and click "Set Up"

3. **Configure Valid OAuth Redirect URIs**
   ```
   Development:
   http://localhost:5000/api/auth/facebook/callback
   
   Production:
   https://your-domain.com/api/auth/facebook/callback
   ```

4. **Copy App Credentials**
   - Go to Settings > Basic
   - Copy App ID and App Secret to your `.env` file

## 🎨 Frontend Integration

### Web Application

The auth page (`client/src/pages/auth.tsx`) now includes:
- **Social Login Buttons** with brand colors and icons
- **OAuth Flow Handling** for phone verification and profile completion
- **Error Handling** for OAuth failures
- **Responsive Design** that works on all devices

### Mobile Application

The mobile app (`mobile/src/screens/AuthScreen.tsx`) includes:
- **Native OAuth Integration** using Expo Auth Session
- **Deep Link Handling** for OAuth callbacks
- **Phone Verification Flow** for OAuth users
- **Profile Completion** workflow

## 🔒 Security Features

### Phone Verification Requirement
- **All users must verify phone** - Even OAuth users
- **Primary Key Protection** - Phone is the unique identifier
- **Trust Building** - Verified badge increases community trust

### Account Linking
- **Email Matching** - Links OAuth to existing accounts via email
- **Duplicate Prevention** - Prevents multiple accounts for same user
- **Data Integrity** - Preserves existing user data when linking

### Session Management
- **Same Session System** - OAuth users use existing session management
- **Secure Cookies** - HTTP-only cookies for session tokens
- **Logout Handling** - Proper cleanup of OAuth sessions

## 📱 User Interface Updates

### Authentication Page
- **Social Login Section** prominently displayed at top
- **Divider with "Or continue with"** separating OAuth from other methods
- **Google/Facebook Branding** following platform guidelines
- **Error States** for OAuth failures and phone verification

### Profile Page
- **Dynamic Verification Badge** shows phone verification status
- **Verify Phone Button** for unverified users
- **Phone Verification Modal** integrated workflow
- **Account Information Section** displays verification status

### Navigation
- **Verified Badge** in user dropdown for verified users
- **Visual Indicator** of trusted community members
- **Status Consistency** across all pages

## 🚀 Deployment Considerations

### Environment Setup
- **Development**: Use localhost URLs for testing
- **Production**: Use HTTPS URLs for security
- **SSL Required**: OAuth providers require HTTPS in production

### Domain Verification
- **Google**: Verify domain ownership in Google Cloud Console
- **Facebook**: Add domain to Facebook app settings
- **CORS**: Ensure proper CORS settings for OAuth callbacks

### Testing Checklist
- [ ] Google OAuth login works
- [ ] Facebook OAuth login works
- [ ] Phone verification flow completes
- [ ] Profile completion saves data
- [ ] Verified badge appears correctly
- [ ] Account linking works for existing users
- [ ] Logout clears OAuth sessions
- [ ] Error handling displays appropriate messages

## 🔄 User Migration

### Existing Users
- **No Action Required** - Existing users can continue using phone/password
- **Optional Linking** - Can link Google/Facebook to existing accounts
- **Verification Prompt** - Unverified users see verification options

### Data Integrity
- **Profile Preservation** - Existing profile data is maintained
- **Verification Status** - Phone verification status is tracked separately
- **No Duplicate Accounts** - System prevents creating duplicates via email matching

## 📊 Analytics and Monitoring

### OAuth Metrics to Track
- **Registration Method** - Track OAuth vs traditional signups
- **Verification Rates** - Monitor phone verification completion
- **User Engagement** - Compare OAuth vs traditional user activity
- **Error Rates** - Monitor OAuth failure rates

### Debugging
- **Console Logging** - OAuth flow is logged for debugging
- **Error Messages** - Clear error messages for users and developers
- **Health Checks** - OAuth endpoints included in health monitoring

## 🆘 Troubleshooting

### Common Issues

1. **"OAuth Failed" Error**
   - Check client ID/secret in environment variables
   - Verify redirect URIs match exactly
   - Ensure OAuth apps are properly configured

2. **Phone Already Registered**
   - User trying to register with phone that exists
   - Guide user to login instead or contact support
   - Consider account recovery flow

3. **Profile Completion Issues**
   - Ensure required fields are properly validated
   - Check database constraints for batch year, state, district
   - Verify form submission handling

4. **Verification Badge Not Showing**
   - Check `phoneVerified` field in user object
   - Verify database has been migrated with new field
   - Ensure frontend queries include verification status

### Development Debugging
```javascript
// Enable detailed OAuth logging
console.log('OAuth user data:', profile);
console.log('User verification status:', user.phoneVerified);
console.log('Session user ID:', req.session.userId);
```

## 🎯 Future Enhancements

### Planned Features
- **Apple Sign In** - iOS native authentication
- **LinkedIn OAuth** - Professional network integration
- **Two-Factor Authentication** - Additional security layer
- **Social Profile Import** - Auto-fill profile from social data

### Security Improvements
- **OAuth Token Refresh** - Handle expired tokens gracefully
- **Rate Limiting** - Prevent OAuth abuse
- **Audit Logging** - Track authentication events
- **Account Recovery** - OAuth-based account recovery options

---

## 📞 Support

For OAuth setup issues:
1. **Check environment variables** are correctly set
2. **Verify OAuth app configurations** in respective platforms
3. **Test redirect URIs** match exactly
4. **Review application logs** for detailed error messages

**🎉 Your Navodaya Connect application now supports modern social authentication while maintaining the community trust through phone verification!**