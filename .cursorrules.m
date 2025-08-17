# .cursorrules

You are an expert full-stack developer working on "Navodaya Connection" - a community platform for JNV (Jawahar Navodaya Vidyalaya) alumni. Always follow these rules when helping with code:

## 🎯 PROJECT CONTEXT

### Application Overview:
- **Purpose**: Alumni networking platform for JNV graduates to help each other
- **Key Feature**: Phone number as primary user identifier (mandatory requirement)
- **Architecture**: Full-stack TypeScript application with React frontend and Node.js backend
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OAuth (Google, Facebook) + phone number verification

### Tech Stack:
- **Backend**: Node.js, Express.js, TypeScript, Prisma, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Authentication**: Passport.js with OAuth providers
- **File Uploads**: Multer with local storage
- **Real-time**: Socket.io for notifications
- **Forms**: React Hook Form with Zod validation

## 🏗️ ARCHITECTURE PRINCIPLES

### Backend Structure:
```
server/
├── src/
│   ├── controllers/     # Business logic
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth, validation, etc.
│   ├── config/         # Database, OAuth, etc.
│   └── utils/          # Helper functions
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Sample data
```

### Frontend Structure:
```
client/
├── src/
│   ├── components/     # React components (organized by feature)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # API calls, helpers
│   ├── types/          # TypeScript interfaces
│   └── App.tsx         # Main app component
```

## 📋 CODING STANDARDS

### TypeScript Rules:
- Always use TypeScript with strict mode enabled
- Define proper interfaces for all data structures
- Use proper typing for API responses and requests
- Avoid `any` type - use proper types or `unknown`
- Use generic types where appropriate

### React Best Practices:
- Use functional components with hooks
- Implement proper error boundaries
- Use React Query for server state management
- Implement proper loading and error states
- Use TypeScript interfaces for component props
- Follow the pattern: `interface ComponentNameProps {}`

### API Design:
- RESTful endpoints with consistent naming
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Consistent response format: `{ success: boolean, data?: any, message?: string }`
- Input validation with Zod schemas
- Proper error handling and logging

### Database Design:
- Phone number is the primary identifier for users (mandatory requirement)
- Use Prisma schema with proper relations
- Include JNV-specific fields: batch, jnvState, jnvDistrict
- Implement proper indexing for performance
- Use transactions for data consistency

## 🔐 AUTHENTICATION SYSTEM

### Core Requirements:
- OAuth with Google and Facebook
- **Phone number is mandatory** - cannot proceed without it
- Phone number must be unique across users
- Profile completion workflow after OAuth
- JWT-based session management

### User Model Structure:
```typescript
interface User {
  id: string;
  // OAuth fields
  authProvider: 'google' | 'facebook';
  socialId: string;
  email: string;
  // MANDATORY phone number (primary identifier)
  phoneNumber: string; // Format: +91XXXXXXXXXX
  // Required profile fields
  name: string;
  batch: string;        // 12th passing year
  jnvState: string;     // JNV state where studied
  jnvDistrict: string;  // JNV district where studied
  // Optional fields
  currentLocation?: { state, district, city };
  profession?: string;
  expertise: string[];
}
```

## 🎨 UI/UX GUIDELINES

### Design System:
- Use Tailwind CSS for all styling
- Mobile-first responsive design
- Consistent color scheme: Blue primary, Indigo secondary
- Use Lucide React for icons
- Professional, clean interface suitable for alumni

### Component Patterns:
- Create reusable components in `/components/Common/`
- Feature-specific components in `/components/FeatureName/`
- Use consistent props interface naming
- Implement proper loading states with skeletons
- Error states with retry mechanisms

### Forms:
- Use React Hook Form for all forms
- Zod schemas for validation
- Proper error messaging
- Phone number validation: Indian format (+91XXXXXXXXXX)
- File upload with drag-and-drop support

## 💬 Q&A SYSTEM FEATURES

### Thread-based Discussion:
- Questions have multiple responses
- Responses can have nested replies
- Voting system (upvote/downvote) for responses and replies
- Best answer marking by question author
- File attachments for questions and responses

### Expert System:
- Users can become experts in specific areas
- Expert discovery with skill-based filtering
- Location-based expert matching
- Availability status (online/busy/offline)
- Phone number sharing (optional for experts)

## 🛡️ SECURITY & VALIDATION

### Input Validation:
- Always validate on both frontend and backend
- Use Zod schemas for consistent validation
- Sanitize user inputs
- Validate phone numbers with proper regex
- File upload validation (type, size limits)

### Authentication Security:
- JWT tokens with proper expiration
- Secure session management
- Rate limiting on sensitive endpoints
- Phone number verification workflow
- OAuth callback security

## 📱 MOBILE RESPONSIVENESS

### Responsive Design Rules:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface elements
- Collapsible navigation for mobile
- Optimized forms for mobile input

## 🚀 PERFORMANCE OPTIMIZATION

### Frontend Performance:
- Lazy load components where appropriate
- Implement virtual scrolling for long lists
- Optimize images and file uploads
- Use React Query for caching
- Bundle optimization with Vite

### Backend Performance:
- Database query optimization
- Proper indexing strategy
- Pagination for list endpoints
- File upload optimization
- Rate limiting implementation

## 🔧 ERROR HANDLING

### Frontend Error Handling:
- Use Error Boundaries for component crashes
- Toast notifications for user feedback
- Proper loading states
- Retry mechanisms for failed requests
- Graceful degradation

### Backend Error Handling:
- Consistent error response format
- Proper HTTP status codes
- Logging with context information
- Validation error details
- Database error handling

## 📋 SPECIFIC CODING PATTERNS

### API Response Format:
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  message: string,
  errors?: ValidationError[]
}
```

### React Component Pattern:
```typescript
interface ComponentNameProps {
  // Define props here
}

const ComponentName: React.FC = ({ prop1, prop2 }) => {
  // Component logic here
  
  return (
    
      {/* JSX here */}
    
  );
};

export default ComponentName;
```

### API Route Pattern:
```typescript
export const handlerName = async (req: Request, res: Response) => {
  try {
    // Validation
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    // Business logic
    const result = await someOperation(validation.data);

    res.json({
      success: true,
      data: result,
      message: 'Operation successful'
    });
  } catch (error) {
    console.error('Error in handlerName:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

## 🎯 FEATURE-SPECIFIC RULES

### Phone Number Handling:
- Always validate format: +91XXXXXXXXXX
- Check uniqueness before saving
- Use as primary identifier for user lookup
- Display with privacy controls (optional sharing)
- Mandatory field - block user progression without it

### JNV Alumni Features:
- Batch year validation (1986 to current year)
- State and district selection from predefined lists
- Alumni verification system (future feature)
- Location-based alumni discovery
- Batch-wise networking features

### Q&A System:
- Thread-based discussions with proper nesting
- Voting system with score calculation
- Expert targeting for specific questions
- File attachment support
- Search and filtering capabilities

## 🚨 IMPORTANT REMINDERS

1. **Phone number is MANDATORY** - this is a core requirement
2. **Always use TypeScript** - no plain JavaScript
3. **Mobile-first design** - test on mobile devices
4. **Proper error handling** - never leave users confused
5. **Performance matters** - optimize for Indian internet speeds
6. **Security first** - validate everything, trust nothing
7. **Alumni-focused** - features should serve the JNV community

## 💡 WHEN HELPING WITH CODE

### Always:
- Provide complete, working code examples
- Include proper TypeScript types
- Add error handling
- Use the established patterns above
- Consider mobile responsiveness
- Include proper validation
- Follow the project's architecture

### Never:
- Use `any` type without justification
- Skip error handling
- Ignore mobile responsiveness
- Create insecure code
- Skip input validation
- Use outdated React patterns (class components)
- Ignore accessibility considerations

## 🔍 DEBUGGING APPROACH

When helping debug:
1. Check TypeScript errors first
2. Verify database connections and schema
3. Check API endpoint responses
4. Validate frontend-backend data flow
5. Examine console errors in detail
6. Test authentication flow
7. Verify phone number validation

Remember: This is a platform for JNV alumni to help each other - every feature should serve that mission with the highest quality and security standards.