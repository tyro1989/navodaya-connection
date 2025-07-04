# Production Deployment Guide

## Overview
This guide will help you deploy the Navodaya Connection application to production with proper OTP integration.

## Prerequisites
- Node.js 20+ installed
- PostgreSQL database
- SMS service account (Twilio or MSG91)

## 1. Database Setup

### PostgreSQL Database
1. Create a PostgreSQL database
2. Note down the connection details:
   - Host
   - Port (usually 5432)
   - Database name
   - Username
   - Password

### Database Schema
Run the following command to create the database schema:
```bash
npm run db:push
```

## 2. Environment Configuration

Copy the example environment file and configure it:
```bash
cp env.example .env
```

### Required Environment Variables

#### Database
```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

#### Session Security
```bash
SESSION_SECRET=your-super-secret-session-key-here
```

#### SMS Service Configuration

Choose one SMS provider:

**Option 1: Twilio (Global)**
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

**Option 2: MSG91 (Popular in India)**
```bash
SMS_PROVIDER=msg91
MSG91_API_KEY=your_msg91_api_key
MSG91_SENDER_ID=NAVODAYA
MSG91_TEMPLATE_ID=your_template_id
```

**Option 3: Mock (Development/Testing)**
```bash
SMS_PROVIDER=mock
```

## 3. SMS Service Setup

### Twilio Setup
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number for sending SMS
4. Configure the environment variables

### MSG91 Setup
1. Sign up at [MSG91](https://msg91.com/)
2. Get your API key from the dashboard
3. Create a sender ID (e.g., NAVODAYA)
4. Create an SMS template for OTP
5. Configure the environment variables

## 4. Application Deployment

### Install Dependencies
```bash
npm install
```

### Build the Application
```bash
npm run build
```

### Start the Application
```bash
npm start
```

## 5. Production Considerations

### Security
- Use strong session secrets
- Enable HTTPS in production
- Set secure cookies
- Use environment variables for all sensitive data

### Performance
- Use a process manager like PM2
- Set up reverse proxy (nginx)
- Enable compression
- Use CDN for static assets

### Monitoring
- Set up logging
- Monitor database performance
- Set up error tracking
- Monitor SMS delivery rates

## 6. PM2 Configuration (Recommended)

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'navodaya-connection',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env'
  }]
};
```

Start with PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 7. Nginx Configuration

Create `/etc/nginx/sites-available/navodaya-connection`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/navodaya-connection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL Certificate (Let's Encrypt)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## 9. Testing OTP Integration

1. Set up your SMS service credentials
2. Test OTP sending with a real phone number
3. Verify OTP verification works
4. Check SMS delivery rates

## 10. Troubleshooting

### Common Issues

**SMS not sending:**
- Check SMS service credentials
- Verify phone number format
- Check SMS service balance
- Review SMS service logs

**Database connection issues:**
- Verify DATABASE_URL format
- Check database server accessibility
- Ensure database exists
- Verify user permissions

**Session issues:**
- Check SESSION_SECRET is set
- Verify cookie settings
- Check HTTPS configuration

## Support

For issues related to:
- **SMS Integration**: Check your SMS service provider's documentation
- **Database**: Refer to PostgreSQL documentation
- **Application**: Check the application logs and error messages 