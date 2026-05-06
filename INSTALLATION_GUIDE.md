# Insight - Installation & Setup Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### General Requirements
- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

### Backend Requirements
- Node.js with npm
- Firebase account (for authentication & services)
- Supabase account (for database & file storage)
- Email service credentials (for OTP & password reset)

### Mobile App Requirements
- Node.js with npm
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode (macOS) or iOS Simulator
- Android: Android Studio or Android Emulator
- Expo Go app (for live testing on physical device)

---

## Project Structure

```
Insight/
├── backend/                 # Node.js/Express backend server
│   ├── src/
│   │   ├── config/         # Configuration files (database, Firebase, Supabase, env)
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI, email, cron)
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Main server file
│   ├── scripts/            # Helper scripts
│   └── package.json        # Backend dependencies
│
├── mobile/                  # React Native Expo mobile app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation structure
│   │   ├── contexts/       # React contexts (Auth, Offline, Security)
│   │   ├── services/       # API & auth services
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── assets/             # Images and resources
│   └── package.json        # Mobile dependencies
│
└── Resources/              # Design assets (icons, illustrations, logos)
```

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_DATABASE_URL=your_firebase_database_url

# Email Service
EMAIL_SERVICE_USER=your_email@gmail.com
EMAIL_SERVICE_PASSWORD=your_app_password

# AI Service (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 4. Database Setup
- Set up Supabase project and note the credentials
- Set up Firebase project and download service account key
- Run any database migrations (if applicable)

### 5. Start Backend Server
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

---

## Mobile App Setup

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the `mobile/` directory with the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://your-backend-url:3000
EXPO_PUBLIC_API_TIMEOUT=30000

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# App Configuration
EXPO_PUBLIC_APP_NAME=Insight
EXPO_PUBLIC_API_VERSION=1.0.0
```

### 4. Configure Expo
Update `app.json` with proper app configuration:
```json
{
  "expo": {
    "name": "Insight",
    "slug": "insight-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "assetBundlePatterns": ["**/*"]
  }
}
```

---

## Environment Configuration

### Backend Configuration Files

**config/env.ts** - Environment variable validation
**config/database.ts** - Database connection setup
**config/firebase.ts** - Firebase initialization
**config/supabase.ts** - Supabase client configuration

### Mobile Configuration Files

**config/firebase.ts** - Firebase configuration for mobile
**constants/theme.ts** - App theme and colors
**contexts/** - Global state management (Auth, Offline, Security)

---

## Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npx expo start
```

### Option 2: Use VS Code Tasks

Run tasks from VS Code Command Palette:
- **Start Backend Server** - `shell: Start Backend Server`
- **Start Mobile App** - `shell: Start Mobile App`

### Option 3: Using npm Scripts

From root directory:
```bash
# Start both (if configured in root package.json)
npm run dev

# Or separately
npm run dev:backend
npm run dev:mobile
```

### Mobile App Access

After running `npx expo start`:
- **Development Build**: Press `i` for iOS or `a` for Android
- **Physical Device**: Scan QR code with Expo Go app
- **Web**: Press `w` to open in web browser

---

## API Endpoints Overview

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/verify-otp` - Verify OTP

### Studies Routes
- `GET /api/studies` - List all studies
- `GET /api/studies/:id` - Get study details
- `POST /api/studies` - Create study
- `PUT /api/studies/:id` - Update study
- `DELETE /api/studies/:id` - Delete study

### Admin Routes
- `GET /api/admin/users` - List users
- `GET /api/admin/logs` - Get activity logs
- `PUT /api/admin/users/:id` - Manage user

### Additional Routes
- `GET /api/library` - Get literature library
- `POST /api/bookmarks` - Bookmark content
- `GET /api/activity` - User activity
- `GET /api/analytics` - Analytics data

---

## Key Features

### Backend Features
- User authentication with Firebase & JWT
- OTP-based email verification
- Academic study management
- Reading history tracking
- Bookmarking system
- Admin dashboard with activity logs
- Email notifications
- Gemini AI integration
- Rate limiting & security middleware
- Comprehensive audit logging

### Mobile Features
- User authentication with offline support
- Browse academic studies
- Search and filter studies
- Bookmarking and favorites
- Reading history
- Admin management interface
- Offline data caching
- Dark/Light theme support
- Security contexts for sensitive data

---

## Troubleshooting

### Backend Issues

**Port Already in Use**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Database Connection Error**
- Verify Supabase/Firebase credentials in `.env`
- Check internet connection
- Ensure database is accessible

**Email Service Not Working**
- Verify email credentials in `.env`
- Use app-specific password for Gmail
- Check spam/security settings

### Mobile Issues

**Expo Connection Error**
```bash
npm install -g expo-cli
npx expo start --clear
```

**Module Not Found**
```bash
npm install
npm start -- --reset-cache
```

**Simulator/Emulator Issues**
- Restart the emulator
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies

---

## Deployment

### Backend Deployment
- Use environment variables for production
- Deploy to Heroku, AWS, DigitalOcean, or similar
- Set `NODE_ENV=production`
- Use managed database services

### Mobile Deployment
- iOS: Build with `eas build --platform ios` and submit to App Store
- Android: Build with `eas build --platform android` and submit to Play Store
- Requires EAS credentials configured in `eas.json`

---

## Support & Documentation

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated:** May 2026
**Version:** 1.0.0
