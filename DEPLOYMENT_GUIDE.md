# 🚀 Navodaya Connect Deployment Guide

## Quick Start (Recommended: Railway)

### Option 1: Railway Deployment (Easiest)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway Project**
   ```bash
   railway init
   ```

4. **Deploy to Railway**
   ```bash
   railway up
   ```

5. **Get your URL**
   ```bash
   railway domain
   ```

### Option 2: Render Deployment

1. **Sign up at [Render](https://render.com)**
2. **Connect your GitHub repository**
3. **Create a new Web Service**
4. **Configure:**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     NODE_ENV=production
     SESSION_SECRET=your-secret-key
     SMS_PROVIDER=mock
     PORT=10000
     ```

### Option 3: Vercel + Railway (Frontend + Backend)

1. **Deploy Backend to Railway** (follow Option 1)
2. **Deploy Frontend to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in your project root:

```bash
# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# SMS Service Configuration
SMS_PROVIDER=mock

# Environment
NODE_ENV=production

# Server Configuration
PORT=5000
```

### Optional: Real SMS Service

For production SMS, replace `SMS_PROVIDER=mock` with:

**Twilio:**
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

**MSG91 (India):**
```bash
SMS_PROVIDER=msg91
MSG91_API_KEY=your_msg91_api_key
MSG91_SENDER_ID=NAVODAYA
MSG91_TEMPLATE_ID=your_template_id
```

## Database Options

### Option 1: In-Memory Storage (Default)
- No setup required
- Data resets on server restart
- Good for testing and demos

### Option 2: PostgreSQL Database
1. **Add DATABASE_URL to environment:**
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database_name
   ```

2. **Railway PostgreSQL:**
   ```bash
   railway add postgresql
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. **Render PostgreSQL:**
   - Create PostgreSQL service in Render dashboard
   - Link to your web service

## Testing Your Deployment

1. **Visit your deployed URL**
2. **Test WhatsApp OTP:**
   - Enter any phone number
   - Use OTP: `123456` (development mode)
3. **Test user registration and login**
4. **Test all features**

## Troubleshooting

### Common Issues

**Build Fails:**
- Check Node.js version (requires 18+)
- Ensure all dependencies are installed
- Check for TypeScript errors

**App Won't Start:**
- Verify PORT environment variable
- Check SESSION_SECRET is set
- Review deployment logs

**OTP Not Working:**
- Verify SMS_PROVIDER is set
- Check SMS service credentials
- Use mock provider for testing

**Database Issues:**
- Verify DATABASE_URL format
- Check database connectivity
- Use in-memory storage for testing

### Getting Help

1. **Check deployment logs**
2. **Verify environment variables**
3. **Test locally first**
4. **Check platform-specific documentation**

## Platform-Specific Notes

### Railway
- Automatic HTTPS
- Built-in PostgreSQL
- Easy environment variable management
- Free tier available

### Render
- Automatic HTTPS
- Built-in PostgreSQL
- Good free tier
- Easy GitHub integration

### Vercel
- Great for frontend
- Automatic HTTPS
- Global CDN
- Free tier available

### DigitalOcean
- More control
- Professional hosting
- Requires more setup
- Paid service

## Security Considerations

1. **Use strong SESSION_SECRET**
2. **Enable HTTPS in production**
3. **Set secure cookies**
4. **Use environment variables for secrets**
5. **Regular security updates**

## Performance Optimization

1. **Enable compression**
2. **Use CDN for static assets**
3. **Optimize images**
4. **Monitor performance**
5. **Use caching strategies**

---

## 🎉 Your Application is Ready!

Once deployed, your Navodaya Connect application will be available at your platform's URL. Share this URL with others to test the WhatsApp OTP authentication and all features!

**Features Available:**
- ✅ WhatsApp OTP Authentication
- ✅ User Registration & Login
- ✅ Request Management
- ✅ Expert Responses
- ✅ Community Features
- ✅ Mobile Responsive Design 