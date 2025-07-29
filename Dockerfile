# Use Node.js 18 Alpine Linux as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build:full

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S navodaya -u 1001

# Create uploads directory with proper permissions
RUN mkdir -p uploads/profile-images uploads/request-attachments
RUN chown -R navodaya:nodejs uploads

# Switch to non-root user
USER navodaya

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:5000/api/health').catch(() => process.exit(1))"

# Start the application
CMD ["npm", "start"]