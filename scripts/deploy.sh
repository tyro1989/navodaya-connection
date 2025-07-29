#!/bin/bash

# Navodaya Connect Deployment Script
set -e

echo "🚀 Starting Navodaya Connect Deployment..."

# Check if environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Error: Environment variable $1 is not set"
        exit 1
    fi
}

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login check
    railway whoami || {
        echo "🔐 Please login to Railway:"
        railway login
    }
    
    # Deploy
    railway up
    echo "✅ Railway deployment complete!"
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "📋 Please follow these steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository in Render dashboard"
    echo "3. Use these settings:"
    echo "   - Build Command: npm install && npm run build:full"
    echo "   - Start Command: npm start"
    echo "   - Node Version: 18"
    echo "4. Set environment variables in Render dashboard"
    echo "✅ Render deployment instructions provided!"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy
    vercel --prod
    echo "✅ Vercel deployment complete!"
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    
    # Build image
    docker build -t navodaya-connect .
    
    echo "✅ Docker image built successfully!"
    echo "📋 To run the container:"
    echo "docker run -d -p 5000:5000 --env-file .env navodaya-connect"
}

# Function to run migrations
run_migrations() {
    echo "🗄️  Running database migrations..."
    
    check_env_var "DATABASE_URL"
    
    npm run db:migrate
    echo "✅ Database migrations complete!"
}

# Function to run build
build_app() {
    echo "🔨 Building application..."
    
    # Clean previous build
    npm run clean
    
    # Install dependencies
    npm ci --only=production
    npm install # Install dev dependencies for build
    
    # Build
    npm run build:full
    
    echo "✅ Build complete!"
}

# Function to verify environment
verify_env() {
    echo "🔍 Verifying environment..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "⚠️  Warning: .env file not found. Using environment variables."
    fi
    
    # Check critical environment variables
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  Warning: DATABASE_URL not set. Database functionality will not work."
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        echo "⚠️  Warning: SESSION_SECRET not set. Using default (not secure for production)."
    fi
    
    echo "✅ Environment verification complete!"
}

# Function to run health check
health_check() {
    echo "🏥 Running health check..."
    
    if [ -z "$1" ]; then
        URL="http://localhost:5000"
    else
        URL="$1"
    fi
    
    echo "🔗 Checking health at: $URL/api/health"
    
    # Wait a bit for server to start
    sleep 5
    
    # Check health
    if curl -f "$URL/api/health" > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        exit 1
    fi
}

# Main deployment logic
case "$1" in
    "railway")
        verify_env
        build_app
        run_migrations
        deploy_railway
        ;;
    "render")
        verify_env
        build_app
        deploy_render
        ;;
    "vercel")
        verify_env
        build_app
        run_migrations
        deploy_vercel
        ;;
    "docker")
        verify_env
        build_docker
        ;;
    "build")
        verify_env
        build_app
        ;;
    "migrate")
        run_migrations
        ;;
    "health")
        health_check "$2"
        ;;
    *)
        echo "🚀 Navodaya Connect Deployment Script"
        echo ""
        echo "Usage: $0 {railway|render|vercel|docker|build|migrate|health}"
        echo ""
        echo "Commands:"
        echo "  railway  - Deploy to Railway"
        echo "  render   - Deploy to Render (shows instructions)"
        echo "  vercel   - Deploy to Vercel"
        echo "  docker   - Build Docker image"
        echo "  build    - Build application only"
        echo "  migrate  - Run database migrations"
        echo "  health   - Run health check (optional URL parameter)"
        echo ""
        echo "Examples:"
        echo "  $0 railway"
        echo "  $0 health https://myapp.railway.app"
        echo ""
        exit 1
        ;;
esac

echo "🎉 Deployment process completed!"