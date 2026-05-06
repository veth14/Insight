# Source Code Documentation - Appendix

## Overview
This appendix provides a comprehensive overview of the Insight application source code, including architecture, key files, and important modules.

---

## Directory Structure & Key Files

### Backend (`/backend`)

#### Main Entry Point
```
src/server.ts - Main Express server configuration
```

#### Configuration (`/backend/src/config`)
- `env.ts` - Environment variable validation and schema
- `database.ts` - Database connection initialization
- `firebase.ts` - Firebase admin SDK setup
- `supabase.ts` - Supabase client configuration

#### Controllers (`/backend/src/controllers`)
Handle HTTP requests and business logic:
- `auth.controller.ts` - Authentication endpoints
- `admin.controller.ts` - Admin operations
- `studies.controller.ts` - Academic studies management
- `register-otp.controller.ts` - User registration OTP
- `otp.controller.ts` - OTP handling
- `reset.controller.ts` - Password reset functionality
- `activity.controller.ts` - User activity tracking
- `analytics.controller.ts` - Analytics data
- `audit.controller.ts` - Audit log management
- `library.controller.ts` - Literature library management
- `literature.controller.ts` - Literature resources

#### Routes (`/backend/src/routes`)
Define API endpoints:
- `auth.routes.ts` - Authentication endpoints
- `admin.routes.ts` - Admin endpoints
- `studies.routes.ts` - Studies endpoints

#### Models (`/backend/src/models`)
Database models/schemas:
- `User.ts` - User account model
- `AcademicStudy.ts` - Academic study data
- `Bookmark.ts` - Bookmarked items
- `ReadingHistory.ts` - Reading history tracking
- `UserActivity.ts` - User activity log
- `AuditLog.ts` - System audit logs
- `OTP.ts` - One-time passwords
- `PasswordResetOTP.ts` - Password reset tokens
- `RegisterOTP.ts` - Registration tokens

#### Middleware (`/backend/src/middleware`)
Request processing middleware:
- `auth.middleware.ts` - JWT authentication verification
- `authorize.middleware.ts` - Role-based authorization
- `error.middleware.ts` - Global error handling
- `rateLimiter.middleware.ts` - Rate limiting protection
- `sanitize.middleware.ts` - Input sanitization

#### Services (`/backend/src/services`)
Business logic & external integrations:
- `ai.service.ts` - Gemini AI integration
- `email.service.ts` - Email sending service
- `cron.service.ts` - Scheduled tasks

#### Utilities (`/backend/src/utils`)
- `audit.ts` - Audit logging utility

#### Types (`/backend/src/types`)
- `index.ts` - TypeScript type definitions

#### Dependencies (key packages)
```json
{
  "express": "Web framework",
  "firebase-admin": "Firebase services",
  "@supabase/supabase-js": "Supabase client",
  "typescript": "Type safety",
  "dotenv": "Environment configuration",
  "cors": "Cross-origin support",
  "nodemailer": "Email sending",
  "@google/generative-ai": "Gemini AI"
}
```

---

### Mobile App (`/mobile`)

#### Main Entry Point
```
App.tsx - Root app component
```

#### Navigation (`/mobile/src/navigation`)
Screen routing configuration:
- `RootNavigator.tsx` - Main navigation logic
- `AuthStack.tsx` - Authentication screens
- `MainTabs.tsx` - Main app tab navigation
- `AdminStack.tsx` - Admin section navigation
- `AdminTabs.tsx` - Admin tab navigation
- `HomeStack.tsx` - Home screen stack
- `SearchStack.tsx` - Search screen stack

#### Screens (`/mobile/src/screens`)
App screens organized by feature:

**Authentication Screens** (`/screens/auth`)
- Login, registration, password reset screens
- OTP verification screens

**Main App Screens** (`/screens/main`)
- Home, search, studies, bookmarks
- Reading history, user profile
- Settings screens

**Admin Screens** (`/screens/admin`)
- `AdminAccountsScreen.tsx` - Manage user accounts
- `AdminActivityLogsScreen.tsx` - View activity logs
- Additional admin management screens

#### Components (`/mobile/src/components`)
Reusable UI components:
- `AppHeader.tsx` - Main app header
- `AdminHeader.tsx` - Admin section header
- `StudyCard.tsx` - Study display component
- `CustomAlert.tsx` - Custom alert dialogs

#### Contexts (`/mobile/src/contexts`)
Global state management:
- `AuthContext.tsx` - Authentication state & user data
- `OfflineContext.tsx` - Offline mode & data sync
- `SecurityContext.tsx` - Security & encryption context

#### Services (`/mobile/src/services`)
API & authentication services:
- `api.service.ts` - HTTP client for backend API calls
- `auth.service.ts` - Authentication logic & token management

#### Configuration (`/mobile/src/config`)
- `firebase.ts` - Firebase initialization for mobile

#### Constants (`/mobile/src/constants`)
- `theme.ts` - App colors, spacing, typography

#### Utilities (`/mobile/src/utils`)
- `responsive.ts` - Responsive design utilities

#### Types (`/mobile/src/types`)
- `index.ts` - TypeScript type definitions
- `expo-image-manipulator.d.ts` - Expo image type definitions

#### Configuration Files
- `app.json` - Expo app configuration
- `eas.json` - EAS build configuration
- `babel.config.js` - Babel transpiler config
- `metro.config.js` - Metro bundler config
- `tsconfig.json` - TypeScript configuration

#### Dependencies (key packages)
```json
{
  "react-native": "Mobile framework",
  "expo": "Development platform",
  "@react-navigation/native": "Navigation library",
  "firebase": "Firebase client SDK",
  "axios": "HTTP client",
  "zustand|redux": "State management"
}
```

---

### Root Configuration Files

```
tsconfig.json - TypeScript configuration
package.json - Project metadata & scripts
app.json - Expo app metadata
eas.json - EAS build & submit config
README.md - Project overview
```

---

## API Architecture

### Request Flow
```
HTTP Request 
    ↓
Express Middleware (CORS, Rate Limit, Sanitize)
    ↓
Authentication Middleware (JWT Verification)
    ↓
Authorization Middleware (Role Checking)
    ↓
Route Handler
    ↓
Controller (Business Logic)
    ↓
Service Layer (Data Processing)
    ↓
Database Query (Supabase/Firebase)
    ↓
Response
```

### Authentication Flow
```
1. User registration/login
2. OTP sent via email (RegisterOTP/OTP model)
3. OTP verified
4. JWT token generated
5. Token stored in mobile app (secure storage)
6. Token sent with each request (Authorization header)
7. JWT verified by auth middleware
8. Request processed
```

---

## Database Schema Overview

### Supabase/Firebase Tables
- **users** - User accounts with authentication info
- **academic_studies** - Research studies and literature
- **bookmarks** - User bookmarked items
- **reading_history** - User reading activity
- **user_activity** - Activity logs
- **audit_logs** - System audit trails
- **otps** - One-time passwords for registration
- **password_reset_otps** - Password reset tokens

---

## Key Features Implementation

### 1. Authentication System
**Location:** `backend/src/controllers/auth.controller.ts`
- JWT-based authentication
- Firebase authentication integration
- OTP verification for security
- Password reset via email

### 2. Academic Study Management
**Location:** `backend/src/controllers/studies.controller.ts`
- CRUD operations for studies
- Filtering and searching
- Reading history tracking

### 3. Bookmarking System
**Location:** `backend/src/models/Bookmark.ts`
- Save/remove bookmarks
- List bookmarks by user

### 4. Email Services
**Location:** `backend/src/services/email.service.ts`
- OTP email delivery
- Password reset emails
- Notification emails

### 5. AI Integration
**Location:** `backend/src/services/ai.service.ts`
- Gemini AI API integration
- Content analysis and recommendations

### 6. Admin Dashboard
**Location:** `mobile/src/screens/admin/`
- User management
- Activity log viewing
- System administration

### 7. Offline Support (Mobile)
**Location:** `mobile/src/contexts/OfflineContext.tsx`
- Data caching when offline
- Sync when connection restored

---

## Security Considerations

### Backend Security
- **Rate Limiting** (`middleware/rateLimiter.middleware.ts`) - Prevent brute force attacks
- **Input Sanitization** (`middleware/sanitize.middleware.ts`) - Prevent injection attacks
- **JWT Authentication** - Secure token-based auth
- **CORS Configuration** - Cross-origin request control
- **Audit Logging** (`utils/audit.ts`) - Track all important actions

### Mobile Security
- **Security Context** (`contexts/SecurityContext.tsx`) - Encryption and security logic
- **Secure Token Storage** - Use platform-specific secure storage
- **SSL Pinning** - Validate backend certificates
- **Input Validation** - Client-side data validation

---

## Performance Considerations

### Backend
- Database indexing on frequently queried fields
- Caching strategies for frequently accessed data
- Pagination for large datasets
- Efficient query optimization

### Mobile
- Image optimization and lazy loading
- Component memoization to prevent re-renders
- Data pagination and infinite scroll
- Offline data caching

---

## File Naming Conventions

```
Controllers:     [feature].controller.ts
Routes:          [feature].routes.ts
Middleware:      [feature].middleware.ts
Services:        [feature].service.ts
Models:          [PascalCase].ts
Screens:         [ScreenName]Screen.tsx
Components:      [ComponentName].tsx
Contexts:        [ContextName]Context.tsx
Utilities:       [utility-name].ts
Types:           index.ts
```

---

## Build & Deployment Structure

### Backend Build Output
- Transpiled JavaScript in `dist/` directory
- Can be deployed to Node.js hosting (Heroku, AWS, DigitalOcean, etc.)

### Mobile Build Output
- iOS: `.ipa` file for App Store submission
- Android: `.aab` (Bundle) or `.apk` for Play Store submission
- Built using EAS (Expo Application Services)

---

## Repository Resources

- **Design Assets:** `/Resources/` - Icons, illustrations, logos
- **Documentation:** `README.md files in each folder
- **Configuration:** `.env` files (not in repo, configure locally)

---

**Source Code Version:** 1.0.0
**Last Updated:** May 2026
