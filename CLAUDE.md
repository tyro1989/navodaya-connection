# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the Application
- `npm run dev` - Start development server (serves both frontend and backend on port 5000)
- `npm start` - Start production server
- `npm run build` - Build both client and server for production

### Database Operations
- `npm run db:push` - Push database schema changes using Drizzle Kit
- Check `drizzle.config.ts` for database configuration (PostgreSQL via Neon)

### Testing
- `npm test` - Run tests in watch mode using Vitest
- `npm run test:run` - Run tests once
- Tests are located in `client/src/__tests__/` directory
- Test setup uses Vitest with jsdom environment and React Testing Library

### Type Checking and Linting
- `npm run check` - Run TypeScript type checking
- Server has separate linting setup in `server/package.json`

### Utilities
- `npm run update-password` - Utility script for password updates
- `tsx update-password.ts` - Direct execution of password update script

## Architecture Overview

### Project Structure
This is a full-stack TypeScript application with a React frontend and Express backend:

- **Root**: Monorepo structure with shared configuration
- **Client**: React SPA using Wouter for routing, TanStack Query for state management
- **Server**: Express.js API with session-based authentication
- **Shared**: Common TypeScript schemas and types using Zod

### Key Technologies
- **Frontend**: React 18, Wouter (routing), TanStack Query, Radix UI components, Tailwind CSS
- **Backend**: Express.js, Passport.js (authentication), Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Build Tools**: Vite (frontend), esbuild (backend), TypeScript
- **Testing**: Vitest with React Testing Library

### Database Architecture
- Uses Drizzle ORM with PostgreSQL
- Schema defined in `shared/schema.ts` with full type safety
- Main entities: users, requests, responses, reviews, private messages
- Supports multiple authentication providers (local, OTP, social)
- Expert system with ratings and stats tracking

### Authentication System
- Multi-modal authentication: phone/password, WhatsApp/SMS OTP verification, social login (Google, Facebook, Apple)
- **WhatsApp OTP Integration**: Primary authentication method with SMS fallback
- **Country Code Support**: Integrated +91 (India) as default with dropdown support for other countries
- Session-based authentication using express-session with Passport.js strategies
- Dual authentication middleware: `isAuthenticated` (Passport) and `authenticateUser` (session-based)
- User profiles include Navodaya alumni-specific fields (batch year, profession, JNV location)
- SMS/WhatsApp services: Twilio, MSG91 (popular in India), and Mock service for development
- **Phone Number Format**: All phone numbers stored with country code (e.g., +919876543210)

### API Structure
All API routes are prefixed with `/api/` and organized by domain:
- `/api/auth/*` - Authentication and user management
- `/api/users/*` - User profiles and expert listings
- `/api/requests/*` - Help requests and status management
- `/api/responses/*` - Expert responses to requests
- `/api/reviews/*` - Rating and review system
- `/api/messages/*` - Private messaging between users
- `/api/stats/*` - Dashboard and personal statistics
- `/api/upload/*` - File upload endpoints (profile images, request attachments)

**Key Upload Endpoints:**
- `/api/upload/profile-image` - Profile image upload (5MB limit, authenticated)
- `/api/upload/request-attachment` - Request attachment upload (supports images, PDFs, docs)

### Frontend Architecture
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Page-based routing with components in `client/src/pages/`
- Custom hooks for mobile detection and toast notifications
- Authentication context provider (`useAuth`) for user state management with `updateUser` function
- TanStack Query for server state management and caching with consistent cache invalidation
- React Hook Form with Zod validation for all forms
- **Profile Management**: Two-tab interface (Personal Info, Account Settings) with streamlined UX

### Key Business Logic
- Expert-helpseeker matching system for Navodaya alumni
- Request lifecycle: open → in_progress → resolved/closed
- Response rating and "best response" selection
- Private messaging system tied to specific requests
- Daily request limits and expert availability tracking
- Location-based help with GPS integration
- **Community Ranking System**: "Top Community Helpers" with multi-dimensional scoring:
  - Average Rating (40% weight)
  - Total Responses (30% weight) 
  - Best Answers (30% weight)
  - Updated every 30 days with comprehensive metrics display

### File Upload Handling
- Profile image uploads via multer to `uploads/profile-images/`
- Request attachment uploads to `uploads/request-attachments/`
- Static file serving for uploaded content via `/uploads` route
- Image type validation and size limits (5MB)
- **Supported formats**: JPEG, PNG, GIF, WebP (images), PDF, DOC/DOCX, TXT (attachments)
- Proper authentication middleware integration with `isAuthenticated`

### Environment Requirements
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment setting (development/production)
- `SMS_PROVIDER` - SMS service provider: 'twilio', 'msg91', or 'mock'

**SMS/WhatsApp Configuration:**
- **Twilio**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **MSG91**: `MSG91_API_KEY`, `MSG91_SENDER_ID`, `MSG91_TEMPLATE_ID`, `MSG91_WHATSAPP_TEMPLATE_ID`
- **Mock**: No configuration needed (for development)

## Development Notes

### Running in Development
The application serves both frontend and backend on port 5000 in development mode. Vite dev server is integrated with Express for hot reloading.

### Database Migrations
Use Drizzle Kit for schema management. Migrations are generated in `./migrations` directory. Always run `npm run db:push` after schema changes.

### Testing Strategy
Frontend testing focuses on component behavior and API integration. Tests use mock data and jsdom environment for browser simulation.

### Code Organization
- Shared schemas ensure type safety between frontend and backend
- Path aliases configured: `@/` (client src), `@shared/` (shared schemas), `@assets/` (attached assets)
- Consistent error handling with standardized API responses
- **React Query Cache Management**: Consistent query keys and invalidation patterns
- **Form Validation**: Centralized Zod schemas with proper error handling

## Recent Updates & Key Features

### Profile Management System
- **Two-tab interface**: Personal Info and Account Settings
- **JNV Location**: Editable state/district fields with cascading dropdowns
- **Privacy Settings**: Phone visibility toggle and UPI ID for gratitude payments
- **Photo Upload**: Working profile image upload with proper authentication
- **Account Integration**: Sign-out moved to Account tab (removed "Danger Zone")

### Authentication Enhancements
- **Country Code Support**: Dropdown with +91 as default, supports multiple countries
- **Dual Auth Methods**: Phone/password and WhatsApp/SMS OTP with proper fallback
- **Session Management**: Fixed logout functionality and auth context consistency
- **Debug Logging**: Comprehensive authentication debugging throughout the stack

### Community Features
- **Top Helpers Ranking**: Multi-dimensional scoring system for community recognition
- **Real-time Updates**: Immediate UI updates for comments/responses without refresh
- **Image Support**: Request attachments with thumbnail previews and proper display
- **GPS Integration**: Location-based help matching with proximity filtering

### Technical Improvements
- **Cache Consistency**: Fixed React Query invalidation across all components
- **Form State Management**: Proper reset and validation across complex forms
- **Error Handling**: Enhanced error messages and user feedback
- **File Uploads**: Reliable image/document upload with proper authentication