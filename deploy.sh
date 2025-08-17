#!/bin/bash

echo "🚀 Navodaya Connect Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found."
    echo "📝 Creating .env file with default values..."
    cat > .env << EOF
# Production Environment Variables

# Session Configuration
SESSION_SECRET=navodaya-connection-prod-secret-$(date +%s)

# SMS Service Configuration
SMS_PROVIDER=mock

# Environment
NODE_ENV=production

# Server Configuration
PORT=5000
EOF
    echo "✅ Created .env file with default values"
fi

echo ""
echo "🎉 Application is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Choose your deployment platform:"
echo "   - Railway (recommended): https://railway.app"
echo "   - Render: https://render.com"
echo "   - Vercel: https://vercel.com"
echo "   - DigitalOcean: https://digitalocean.com"
echo ""
echo "2. For Railway deployment:"
echo "   - Install Railway CLI: npm install -g @railway/cli"
echo "   - Run: railway login"
echo "   - Run: railway init"
echo "   - Run: railway up"
echo ""
echo "3. For other platforms, follow their documentation for Node.js deployment"
echo ""
echo "🔗 Your application will be available at the URL provided by your hosting platform" 