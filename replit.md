# Navodaya Connection

## Overview

Navodaya Connection is a full-stack web application designed to connect Navodaya alumni for guidance and mentorship. The platform enables students and professionals to seek help from experienced experts in their fields, fostering a community-driven knowledge sharing system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state and React Context for authentication
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (Neon serverless)
- **Build System**: ESBuild for production builds

### Development Setup
- **Build Tool**: Vite with hot module replacement
- **Package Manager**: npm with lockfile version 3
- **TypeScript**: Strict mode enabled with modern ES features
- **Linting**: Configured for consistent code style

## Key Components

### Authentication System
- **OTP-based Authentication**: Phone number verification with 6-digit OTP
- **Session Management**: Secure session cookies with HttpOnly and secure flags
- **User Registration**: Multi-step process including expertise area selection
- **Role-based Access**: Expert and regular user differentiation

### Database Schema
- **Users Table**: Stores user profiles, contact info, expertise areas, and expert status
- **Requests Table**: Help requests with urgency levels and targeting options
- **Responses Table**: Expert responses to requests with helpful rating system
- **Reviews Table**: Expert rating and feedback system
- **OTP Verifications**: Temporary storage for authentication codes
- **Expert Stats**: Aggregated statistics for expert performance

### Core Features
- **Expert Discovery**: Browse and filter experts by expertise and availability
- **Request System**: Create help requests with urgency levels and specific targeting
- **Response Management**: Experts can respond to relevant requests
- **Rating System**: Five-star rating system for experts with review comments
- **WhatsApp Integration**: Direct contact through WhatsApp links
- **Dashboard Analytics**: Statistics for requests, responses, and community metrics

## Data Flow

### User Authentication Flow
1. User enters phone number
2. System generates and sends OTP (returned in development mode)
3. User verifies OTP
4. If new user, completes registration form
5. Session established with user ID stored in server-side session

### Request Lifecycle
1. User creates request with title, description, and expertise requirements
2. Request stored with urgency level and optional expert targeting
3. Relevant experts notified through dashboard
4. Experts can respond with detailed answers
5. Requester can mark responses as helpful
6. Request can be marked as resolved

### Expert Rating System
1. Users can rate expert responses (1-5 stars)
2. Optional review comments for detailed feedback
3. Ratings aggregated into expert statistics
4. Expert profiles display average rating and total reviews

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management

### Data and State Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for forms and API endpoints
- **Date-fns**: Date formatting and manipulation

### Backend Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations
- **Express Session**: Session management with PostgreSQL store

## Deployment Strategy

### Development Mode
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Database schema pushed directly via Drizzle Kit

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles server code for Node.js
- Database: Migrations applied through Drizzle Kit
- Static files served through Express in production

### Environment Configuration
- Session secret for secure cookie signing
- Database URL for PostgreSQL connection
- Development vs production mode detection
- Replit-specific development tooling integration

## Changelog

Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Added development mode authentication with optional registration fields

## User Preferences

Preferred communication style: Simple, everyday language.

### Registration Requirements
- JNV batch year is mandatory 
- JNV state is mandatory
- JNV district is mandatory
- All other fields are optional