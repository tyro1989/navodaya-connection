# 🚀 Deployment Guide - Navodaya Connect

This guide covers deploying your Navodaya Connect application to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Database**: PostgreSQL database (recommended: Neon, Railway PostgreSQL, or similar)
2. **Environment Variables**: All required environment variables configured
3. **Domain**: (Optional) Custom domain for production
4. **SMS Service**: Twilio/MSG91 account for OTP functionality (or use mock for testing)

## 🔧 Pre-Deployment Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters
NODE_ENV=production
SMS_PROVIDER=mock  # or 'twilio' or 'msg91'
```

### 2. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build:full

# Test locally
npm start
```

## 🌐 Platform-Specific Deployments

### Railway (Recommended)

Railway is the easiest platform for full-stack Node.js applications.

**Steps:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   railway init
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set SESSION_SECRET="your-secret-key"
   railway variables set SMS_PROVIDER="mock"
   railway variables set NODE_ENV="production"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

**Configuration:** The `railway.toml` file is already configured.

---

### Render

Great free tier with PostgreSQL support.

**Steps:**

1. **Fork/Upload Repository** to GitHub

2. **Create Web Service**
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command:** `npm install && npm run build:full`
     - **Start Command:** `npm start`
     - **Node Version:** 18

3. **Create PostgreSQL Database**
   - Add PostgreSQL service
   - Note the connection string

4. **Set Environment Variables**
   ```
   DATABASE_URL=<your-postgres-connection-string>
   SESSION_SECRET=<generate-random-string>
   NODE_ENV=production
   SMS_PROVIDER=mock
   ```

**Configuration:** The `render.yaml` file is already configured.

---

### Vercel (Serverless)

Good for smaller applications, but has limitations for file uploads.

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel dashboard

**Limitations:**
- File uploads are limited in serverless environment
- Database connections may need connection pooling
- Consider using Vercel's storage solutions

---

### Docker Deployment

For VPS, AWS, Google Cloud, or any Docker-compatible platform.

**Steps:**

1. **Build Docker Image**
   ```bash
   docker build -t navodaya-connect .
   ```

2. **Run Container**
   ```bash
   docker run -d \\
     -p 5000:5000 \\
     -e DATABASE_URL="your-database-url" \\
     -e SESSION_SECRET="your-secret" \\
     -e NODE_ENV="production" \\
     -e SMS_PROVIDER="mock" \\
     --name navodaya-connect \\
     navodaya-connect
   ```

3. **Use Docker Compose** (recommended)
   
   Create `docker-compose.yml`:
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - SESSION_SECRET=your-secret-key
         - SMS_PROVIDER=mock
       depends_on:
         - postgres
       volumes:
         - uploads:/app/uploads
   
     postgres:
       image: postgres:15
       environment:
         - POSTGRES_DB=navodaya_connect
         - POSTGRES_USER=navodaya_user
         - POSTGRES_PASSWORD=your-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
   
   volumes:
     postgres_data:
     uploads:
   ```

   Deploy with:
   ```bash
   docker-compose up -d
   ```

---

## 📦 Database Setup

### Automatic Migration

The application includes automatic database migration:

```bash
npm run db:migrate
```

This creates all necessary tables and indexes.

### Manual Database Setup

If automatic migration fails, run SQL manually:

```sql
-- See scripts/migrate.ts for complete SQL schema
-- Key tables: users, requests, responses, notifications, etc.
```

---

## 🔒 Security Configuration

### Production Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
SESSION_SECRET=<minimum-32-character-random-string>
NODE_ENV=production

# SMS Configuration (choose one)
SMS_PROVIDER=twilio  # or 'msg91' or 'mock'

# If using Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# If using MSG91
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=your_sender_id
MSG91_TEMPLATE_ID=your_template_id
MSG91_WHATSAPP_TEMPLATE_ID=your_whatsapp_template_id

# Optional: OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Providers

### Recommended PostgreSQL Providers

1. **Neon** (Free tier: 0.5GB)
   - Serverless PostgreSQL
   - Great for development and small production apps
   - Easy scaling

2. **Railway PostgreSQL** (Free tier: 1GB)
   - Integrated with Railway deployments
   - Simple setup and management

3. **Supabase** (Free tier: 500MB)
   - PostgreSQL with additional features
   - Real-time capabilities

4. **ElephantSQL** (Free tier: 20MB)
   - Good for testing and small apps

### Database Connection Example

```typescript
// Connection string format
DATABASE_URL=postgresql://username:password@host:port/database

// Example
DATABASE_URL=postgresql://myuser:mypassword@ep-example.us-east-1.aws.neon.tech/navodaya_connect?sslmode=require
```

---

## 📱 SMS/WhatsApp Configuration

### Mock Provider (Development/Testing)

```env
SMS_PROVIDER=mock
```

This returns a fixed OTP `123456` for testing.

### Twilio (Recommended for Production)

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### MSG91 (Popular in India)

```env
SMS_PROVIDER=msg91
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=your_sender_id
MSG91_TEMPLATE_ID=your_template_id
MSG91_WHATSAPP_TEMPLATE_ID=your_whatsapp_template_id
```

---

## 🔍 Monitoring and Health Checks

### Health Check Endpoint

The application includes a health check at `/api/health`:

```bash
curl https://your-app.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

### Logging

Application logs include:
- Database connection status
- SMS service initialization
- Authentication events
- Error tracking

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` is correct
   - Check database server is running
   - Ensure SSL settings match provider requirements

2. **Session Store Errors**
   - Verify PostgreSQL connection
   - Check session table creation
   - Ensure `SESSION_SECRET` is set

3. **Build Failures**
   - Run `npm run clean && npm install`
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed

4. **File Upload Issues**
   - Ensure `uploads/` directory exists and is writable
   - Check disk space on server
   - Verify multer configuration

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=navodaya:*
```

---

## 📈 Performance Optimization

### Production Optimizations

1. **Enable Gzip Compression**
2. **Use CDN for Static Assets**
3. **Database Connection Pooling**
4. **Redis for Session Store** (optional)
5. **File Storage Service** (AWS S3, Cloudinary)

### Scaling Considerations

- **Database**: Consider connection pooling for high traffic
- **File Storage**: Move to cloud storage (S3, Cloudinary) for production
- **Caching**: Implement Redis for session management
- **Load Balancing**: Use multiple app instances behind load balancer

---

## ✅ Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Health check endpoint responds
- [ ] Database connection working
- [ ] User registration/login functional
- [ ] OTP sending works (test with your SMS provider)
- [ ] File uploads working
- [ ] All environment variables set
- [ ] SSL certificate configured (if using custom domain)
- [ ] Monitoring/logging configured

---

## 🆘 Support

If you encounter issues:

1. Check the health endpoint: `/api/health`
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check SMS provider configuration

For platform-specific issues, consult:
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**🎉 Congratulations! Your Navodaya Connect application should now be live and ready to connect the Navodaya community!**